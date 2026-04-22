from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime
import enum


class MatchStatus(str, enum.Enum):
    open = "open"        # waiting for opponent
    full = "full"        # both teams set, match scheduled
    done = "done"        # match completed


class Match(Base):
    __tablename__ = "matches"

    id              = Column(Integer, primary_key=True, index=True)
    title           = Column(String(200), nullable=False)          # e.g. "Sunday 5v5 at Central Park"
    location        = Column(String(300), nullable=False)
    scheduled_at    = Column(DateTime, nullable=False)             # when the match happens
    slots           = Column(Integer, nullable=False, default=10)  # total players needed

    status          = Column(Enum(MatchStatus), default=MatchStatus.open, nullable=False)

    # Team A = creator's side
    creator_id      = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Team B = team that joins (null until someone joins)
    opponent_id     = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at      = Column(DateTime, default=datetime.utcnow)

    # relationships
    creator         = relationship("User", foreign_keys=[creator_id], backref="created_matches")
    opponent        = relationship("User", foreign_keys=[opponent_id], backref="joined_matches")
