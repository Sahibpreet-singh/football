from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import SessionLocal
from app.db.models.team import Team, TeamMember, MemberRole, MemberStatus
from app.db.models.user import User
from app.core.auth import get_current_user

router = APIRouter(prefix="/teams", tags=["Teams"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Response schemas ──────────────────────────────────────────────────────────

class MemberOut(BaseModel):
    id: int
    user_id: int
    user_name: str
    role: MemberRole
    status: MemberStatus

    class Config:
        from_attributes = True


class TeamOut(BaseModel):
    id: int
    name: str
    tag: str | None
    color: str
    member_count: int
    my_role: str | None        # "admin" | "member" | "pending" | None

    class Config:
        from_attributes = True


# ── Helpers ───────────────────────────────────────────────────────────────────

def get_my_membership(team: Team, user_id: int) -> TeamMember | None:
    for m in team.members:
        if m.user_id == user_id:
            return m
    return None


def is_admin_of(team: Team, user_id: int) -> bool:
    m = get_my_membership(team, user_id)
    return m is not None and m.role == MemberRole.admin and m.status == MemberStatus.approved


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/", summary="List all teams")
def list_teams(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    teams = db.query(Team).all()
    result = []
    for t in teams:
        approved = [m for m in t.members if m.status == MemberStatus.approved]
        my_mem = get_my_membership(t, current_user.id)
        if my_mem is None:
            my_role = None
        elif my_mem.status == MemberStatus.pending:
            my_role = "pending"
        else:
            my_role = my_mem.role.value
        result.append({
            "id": t.id,
            "name": t.name,
            "tag": t.tag,
            "color": t.color,
            "member_count": len(approved),
            "my_role": my_role,
            "pending_count": len([m for m in t.members if m.status == MemberStatus.pending]) if my_role == "admin" else 0,
        })
    return result


@router.post("/{team_id}/request-join", summary="Request to join a team")
def request_join(team_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    existing = db.query(TeamMember).filter_by(team_id=team_id, user_id=current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already a member or request pending")

    membership = TeamMember(team_id=team_id, user_id=current_user.id, role=MemberRole.member, status=MemberStatus.pending)
    db.add(membership)
    db.commit()
    return {"message": "Join request sent. Waiting for admin approval."}


@router.get("/{team_id}/members", summary="List members of a team (admin only)")
def list_members(team_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if not is_admin_of(team, current_user.id):
        raise HTTPException(status_code=403, detail="Only team admins can view members")

    return [
        {
            "id": m.id,
            "user_id": m.user_id,
            "user_name": m.user.name,
            "role": m.role,
            "status": m.status,
        }
        for m in team.members
    ]


@router.post("/{team_id}/approve/{user_id}", summary="Approve a join request (admin only)")
def approve_member(team_id: int, user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if not is_admin_of(team, current_user.id):
        raise HTTPException(status_code=403, detail="Only team admins can approve members")

    membership = db.query(TeamMember).filter_by(team_id=team_id, user_id=user_id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="No join request found for this user")
    if membership.status == MemberStatus.approved:
        raise HTTPException(status_code=400, detail="Already approved")

    membership.status = MemberStatus.approved
    db.commit()
    return {"message": "Member approved"}


@router.delete("/{team_id}/kick/{user_id}", summary="Remove a member (admin only)")
def kick_member(team_id: int, user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if not is_admin_of(team, current_user.id):
        raise HTTPException(status_code=403, detail="Only team admins can remove members")
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself")

    membership = db.query(TeamMember).filter_by(team_id=team_id, user_id=user_id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Member not found")

    db.delete(membership)
    db.commit()
    return {"message": "Member removed"}


@router.get("/{team_id}", summary="Get single team detail + members")
def get_team(team_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    my_mem = get_my_membership(team, current_user.id)
    if my_mem is None:
        my_role = None
    elif my_mem.status == MemberStatus.pending:
        my_role = "pending"
    else:
        my_role = my_mem.role.value

    i_am_admin = is_admin_of(team, current_user.id)

    approved = [m for m in team.members if m.status == MemberStatus.approved]
    pending  = [m for m in team.members if m.status == MemberStatus.pending]

    return {
        "id": team.id,
        "name": team.name,
        "tag": team.tag,
        "color": team.color,
        "my_role": my_role,
        "member_count": len(approved),
        "members": [
            { "id": m.id, "user_id": m.user_id, "user_name": m.user.name, "role": m.role, "status": m.status }
            for m in approved
        ],
        # pending requests only visible to admins
        "pending_requests": [
            { "id": m.id, "user_id": m.user_id, "user_name": m.user.name }
            for m in pending
        ] if i_am_admin else [],
    }


@router.get("/mine", summary="Get teams I'm an approved member of")
def my_teams(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    memberships = db.query(TeamMember).filter_by(
        user_id=current_user.id,
        status=MemberStatus.approved
    ).all()
    result = []
    for m in memberships:
        result.append({
            "id": m.team.id,
            "name": m.team.name,
            "tag": m.team.tag,
            "color": m.team.color,
            "role": m.role,
        })
    return result
