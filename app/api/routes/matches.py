from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.db.database import SessionLocal
from app.db.models.match import Match, MatchStatus
from app.db.models.user import User

router = APIRouter(prefix="/matches", tags=["Matches"])


# ─── DB Dependency ────────────────────────────────────────────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── Request Schemas ──────────────────────────────────────────────────────────

class CreateMatchRequest(BaseModel):
    title: str
    location: str
    scheduled_at: datetime   # ISO format: "2025-06-01T15:00:00"
    slots: int
    creator_id: int          # ID of the user creating the match


class JoinMatchRequest(BaseModel):
    user_id: int             # ID of the user joining as opponent


# ─── Response Schemas ─────────────────────────────────────────────────────────

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


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post("/", response_model=MatchResponse, summary="Create a new match")
def create_match(payload: CreateMatchRequest, db: Session = Depends(get_db)):
    """
    Any registered user can create a match.
    They become Team A (creator). Status starts as 'open'.
    """
    # Make sure creator exists
    creator = db.query(User).filter(User.id == payload.creator_id).first()
    if not creator:
        raise HTTPException(status_code=404, detail="Creator user not found")

    match = Match(
        title=payload.title,
        location=payload.location,
        scheduled_at=payload.scheduled_at,
        slots=payload.slots,
        creator_id=payload.creator_id,
        status=MatchStatus.open,
    )

    db.add(match)
    db.commit()
    db.refresh(match)

    return match


@router.post("/{match_id}/join", response_model=MatchResponse, summary="Join an open match")
def join_match(match_id: int, payload: JoinMatchRequest, db: Session = Depends(get_db)):
    """
    A user joins an open match as Team B (opponent).
    Rules:
      - Match must exist and be 'open'
      - Opponent cannot be the same user as the creator
      - Once joined, status flips to 'full' (only one team can join)
    """
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if match.status != MatchStatus.open:
        raise HTTPException(
            status_code=400,
            detail=f"Match is already '{match.status}' — cannot join"
        )

    if match.creator_id == payload.user_id:
        raise HTTPException(
            status_code=400,
            detail="You cannot join your own match as opponent"
        )

    # Make sure joining user exists
    opponent = db.query(User).filter(User.id == payload.user_id).first()
    if not opponent:
        raise HTTPException(status_code=404, detail="Joining user not found")

    match.opponent_id = payload.user_id
    match.status = MatchStatus.full

    db.commit()
    db.refresh(match)

    return match


@router.get("/", response_model=list[MatchResponse], summary="List all open matches")
def list_open_matches(db: Session = Depends(get_db)):
    """
    Returns all matches with status 'open' — these are looking for opponents.
    """
    matches = db.query(Match).filter(Match.status == MatchStatus.open).all()
    return matches


@router.get("/all", response_model=list[MatchResponse], summary="List every match")
def list_all_matches(db: Session = Depends(get_db)):
    """
    Returns every match regardless of status.
    Useful for an admin view or match history.
    """
    matches = db.query(Match).order_by(Match.created_at.desc()).all()
    return matches


@router.get("/{match_id}", response_model=MatchResponse, summary="Get a single match")
def get_match(match_id: int, db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match


@router.delete("/{match_id}", summary="Cancel a match (creator only)")
def cancel_match(match_id: int, creator_id: int, db: Session = Depends(get_db)):
    """
    Only the creator can cancel their match.
    Only works if match is still 'open'.
    """
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if match.creator_id != creator_id:
        raise HTTPException(status_code=403, detail="Only the creator can cancel this match")

    if match.status != MatchStatus.open:
        raise HTTPException(
            status_code=400,
            detail="Cannot cancel a match that is already full or done"
        )

    db.delete(match)
    db.commit()

    return {"message": f"Match {match_id} cancelled successfully"}
