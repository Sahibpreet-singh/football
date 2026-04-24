from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.db.database import SessionLocal
from app.db.models.match import Match, MatchStatus
from app.db.models.user import User
from app.core.auth import get_current_user

router = APIRouter(prefix="/matches", tags=["Matches"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class CreateMatchRequest(BaseModel):
    title: str
    location: str
    scheduled_at: datetime
    slots: int

class MatchResponse(BaseModel):
    id: int
    title: str
    location: str
    scheduled_at: datetime
    slots: int
    status: MatchStatus
    creator_id: int
    opponent_id: int | None
    created_at: datetime
    class Config:
        from_attributes = True

@router.post("/", response_model=MatchResponse, summary="Create a match (protected)")
def create_match(
    payload: CreateMatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)   # ✅ JWT protected
):
    match = Match(
        title=payload.title,
        location=payload.location,
        scheduled_at=payload.scheduled_at,
        slots=payload.slots,
        creator_id=current_user.id,
        status=MatchStatus.open,
    )
    db.add(match)
    db.commit()
    db.refresh(match)
    return match

@router.post("/{match_id}/join", response_model=MatchResponse, summary="Join a match (protected)")
def join_match(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)   # ✅ JWT protected
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    if match.status != MatchStatus.open:
        raise HTTPException(status_code=400, detail=f"Match is already '{match.status}'")
    if match.creator_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot join your own match")

    match.opponent_id = current_user.id
    match.status = MatchStatus.full
    db.commit()
    db.refresh(match)
    return match

@router.get("/", response_model=list[MatchResponse], summary="List open matches")
def list_open_matches(db: Session = Depends(get_db)):
    return db.query(Match).filter(Match.status == MatchStatus.open).all()

@router.get("/all", response_model=list[MatchResponse], summary="List all matches")
def list_all_matches(db: Session = Depends(get_db)):
    return db.query(Match).order_by(Match.created_at.desc()).all()

@router.get("/{match_id}", response_model=MatchResponse, summary="Get single match")
def get_match(match_id: int, db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match

@router.delete("/{match_id}", summary="Cancel match (creator only, protected)")
def cancel_match(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    if match.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the creator can cancel this match")
    if match.status != MatchStatus.open:
        raise HTTPException(status_code=400, detail="Cannot cancel a match that is full or done")
    db.delete(match)
    db.commit()
    return {"message": f"Match {match_id} cancelled"}
