from sqlalchemy import Column, Integer, String, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime
import enum


class MemberRole(str, enum.Enum):
    admin = "admin"
    member = "member"


class MemberStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"


class Team(Base):
    __tablename__ = "teams"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(100), unique=True, nullable=False)
    tag         = Column(String(10), nullable=True)   # e.g. "FCB", "RMA"
    color       = Column(String(7), default="#CAFF33") # hex color

    members     = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")


class TeamMember(Base):
    __tablename__ = "team_members"

    id          = Column(Integer, primary_key=True, index=True)
    team_id     = Column(Integer, ForeignKey("teams.id"), nullable=False)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    role        = Column(Enum(MemberRole), default=MemberRole.member, nullable=False)
    status      = Column(Enum(MemberStatus), default=MemberStatus.pending, nullable=False)
    joined_at   = Column(DateTime, default=datetime.utcnow)

    team        = relationship("Team", back_populates="members")
    user        = relationship("User", backref="team_memberships")
