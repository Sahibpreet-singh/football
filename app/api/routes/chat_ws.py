from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime
import json

from app.db.database import SessionLocal
from app.db.models.chat import ChatMessage
from app.db.models.team import TeamMember, MemberStatus
from app.db.models.user import User
from app.core.auth import SECRET_KEY, ALGORITHM

router = APIRouter(tags=["Chat"])


# ── DB ────────────────────────────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── In-memory connection manager ──────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        # { team_id: [ (websocket, user_id, user_name) ] }
        self.rooms: dict[int, list[tuple]] = {}

    def get_room(self, team_id: int):
        if team_id not in self.rooms:
            self.rooms[team_id] = []
        return self.rooms[team_id]

    async def connect(self, team_id: int, ws: WebSocket, user_id: int, user_name: str):
        await ws.accept()
        self.get_room(team_id).append((ws, user_id, user_name))

    def disconnect(self, team_id: int, ws: WebSocket):
        room = self.get_room(team_id)
        self.rooms[team_id] = [(w, uid, name) for w, uid, name in room if w != ws]

    async def broadcast(self, team_id: int, message: dict):
        dead = []
        for ws, uid, name in self.get_room(team_id):
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(team_id, ws)

    def online_users(self, team_id: int) -> list[str]:
        return [name for _, _, name in self.get_room(team_id)]


manager = ConnectionManager()


# ── Token helper (WebSocket can't use OAuth2PasswordBearer) ───────────────────
def verify_ws_token(token: str, db: Session) -> User | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None
        return db.query(User).filter(User.id == int(user_id)).first()
    except JWTError:
        return None


def is_team_member(db: Session, team_id: int, user_id: int) -> bool:
    m = db.query(TeamMember).filter_by(
        team_id=team_id, user_id=user_id, status=MemberStatus.approved
    ).first()
    return m is not None


# ── REST: message history ─────────────────────────────────────────────────────
@router.get("/teams/{team_id}/messages", summary="Get last 50 messages for a team")
def get_messages(
    team_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    user = verify_ws_token(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    if not is_team_member(db, team_id, user.id):
        raise HTTPException(status_code=403, detail="Not a member of this team")

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.team_id == team_id)
        .order_by(ChatMessage.created_at.asc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": m.id,
            "user_id": m.user_id,
            "user_name": m.user.name,
            "content": m.content,
            "created_at": m.created_at.isoformat(),
        }
        for m in messages
    ]


# ── WebSocket ─────────────────────────────────────────────────────────────────
@router.websocket("/ws/teams/{team_id}/chat")
async def team_chat(
    team_id: int,
    websocket: WebSocket,
    token: str = Query(...),
):
    db = SessionLocal()
    try:
        user = verify_ws_token(token, db)
        if not user or not is_team_member(db, team_id, user.id):
            await websocket.close(code=4001)
            return

        await manager.connect(team_id, websocket, user.id, user.name)

        # Notify room: user joined
        await manager.broadcast(team_id, {
            "type": "system",
            "content": f"{user.name} joined the chat",
            "online": manager.online_users(team_id),
        })

        try:
            while True:
                text = await websocket.receive_text()
                data = json.loads(text)
                content = data.get("content", "").strip()
                if not content or len(content) > 1000:
                    continue

                # Save to DB
                msg = ChatMessage(
                    team_id=team_id,
                    user_id=user.id,
                    content=content,
                )
                db.add(msg)
                db.commit()
                db.refresh(msg)

                await manager.broadcast(team_id, {
                    "type": "message",
                    "id": msg.id,
                    "user_id": user.id,
                    "user_name": user.name,
                    "content": content,
                    "created_at": msg.created_at.isoformat(),
                })

        except WebSocketDisconnect:
            manager.disconnect(team_id, websocket)
            await manager.broadcast(team_id, {
                "type": "system",
                "content": f"{user.name} left the chat",
                "online": manager.online_users(team_id),
            })
    finally:
        db.close()
