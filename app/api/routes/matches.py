from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.db.database import SessionLocal
from app.db.models.match import Match, MatchStatus
from app.db.models.team import Team, TeamMember, MemberRole, MemberStatus
from app.db.models.user import User
from app.core.auth import get_current_user

router = APIRouter(prefix="/matches", tags=["Matches"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Helpers ───────────────────────────────────────────────────────────────────

def get_admin_teams(db: Session, user_id: int) -> list[int]:
    """Returns list of team IDs where this user is an approved admin."""
    memberships = db.query(TeamMember).filter_by(
        user_id=user_id,
        role=MemberRole.admin,
        status=MemberStatus.approved
    ).all()
    return [m.team_id for m in memberships]


def is_admin_of_team(db: Session, user_id: int, team_id: int) -> bool:
    m = db.query(TeamMember).filter_by(
        user_id=user_id, team_id=team_id,
        role=MemberRole.admin, status=MemberStatus.approved
    ).first()
    return m is not None


# ── Schemas ───────────────────────────────────────────────────────────────────

class CreateMatchRequest(BaseModel):
    title: str
    location: str
    scheduled_at: datetime
    slots: int
    requesting_team_id: int   # which of the admin's teams is posting


class MatchResponse(BaseModel):
    id: int
    title: str
    location: str
    scheduled_at: datetime
    slots: int
    status: MatchStatus
    requesting_team_id: int
    requesting_team_name: str
    opponent_team_id: int | None
    opponent_team_name: str | None
    created_by_user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


def format_match(m: Match) -> dict:
    return {
        "id": m.id,
        "title": m.title,
        "location": m.location,
        "scheduled_at": m.scheduled_at,
        "slots": m.slots,
        "status": m.status,
        "requesting_team_id": m.requesting_team_id,
        "requesting_team_name": m.requesting_team.name if m.requesting_team else None,
        "requesting_team_color": m.requesting_team.color if m.requesting_team else None,
        "opponent_team_id": m.opponent_team_id,
        "opponent_team_name": m.opponent_team.name if m.opponent_team else None,
        "opponent_team_color": m.opponent_team.color if m.opponent_team else None,
        "created_by_user_id": m.created_by_user_id,
        "created_at": m.created_at,
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/", summary="Post a match request (team admin only)")
def create_match(
    payload: CreateMatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not is_admin_of_team(db, current_user.id, payload.requesting_team_id):
        raise HTTPException(status_code=403, detail="You must be an admin of the requesting team")

    match = Match(
        title=payload.title,
        location=payload.location,
        scheduled_at=payload.scheduled_at,
        slots=payload.slots,
        requesting_team_id=payload.requesting_team_id,
        created_by_user_id=current_user.id,
        status=MatchStatus.open,
    )
    db.add(match)
    db.commit()
    db.refresh(match)
    return format_match(match)


@router.post("/{match_id}/join", summary="Join a match as opponent team (team admin only)")
def join_match(
    match_id: int,
    body: dict,   # { "team_id": int }
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    team_id = body.get("team_id")
    if not team_id:
        raise HTTPException(status_code=400, detail="team_id required")

    if not is_admin_of_team(db, current_user.id, team_id):
        raise HTTPException(status_code=403, detail="You must be an admin of that team")

    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    if match.status != MatchStatus.open:
        raise HTTPException(status_code=400, detail=f"Match is already '{match.status}'")
    if match.requesting_team_id == team_id:
        raise HTTPException(status_code=400, detail="Cannot join your own team's match")

    match.opponent_team_id = team_id
    match.joined_by_user_id = current_user.id
    match.status = MatchStatus.full
    db.commit()
    db.refresh(match)
    return format_match(match)


@router.post("/{match_id}/leave", summary="Leave a match (opponent team admin only)")
def leave_match(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    if match.status != MatchStatus.full:
        raise HTTPException(status_code=400, detail="Match is not in full state")
    if not is_admin_of_team(db, current_user.id, match.opponent_team_id):
        raise HTTPException(status_code=403, detail="Only the opponent team's admin can leave")

    match.opponent_team_id = None
    match.joined_by_user_id = None
    match.status = MatchStatus.open
    db.commit()
    db.refresh(match)
    return format_match(match)


@router.delete("/{match_id}", summary="Cancel match (requesting team admin only)")
def cancel_match(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    if not is_admin_of_team(db, current_user.id, match.requesting_team_id):
        raise HTTPException(status_code=403, detail="Only the requesting team's admin can cancel")
    if match.status == MatchStatus.done:
        raise HTTPException(status_code=400, detail="Cannot cancel a completed match")

    db.delete(match)
    db.commit()
    return {"message": f"Match {match_id} cancelled"}


@router.get("/", summary="List open matches")
def list_open_matches(db: Session = Depends(get_db)):
    matches = db.query(Match).filter(Match.status == MatchStatus.open).order_by(Match.created_at.desc()).all()
    return [format_match(m) for m in matches]


@router.get("/all", summary="List all matches")
def list_all_matches(db: Session = Depends(get_db)):
    matches = db.query(Match).order_by(Match.created_at.desc()).all()
    return [format_match(m) for m in matches]


@router.get("/{match_id}", summary="Get single match")
def get_match(match_id: int, db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return format_match(match)
