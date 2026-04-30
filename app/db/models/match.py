from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime
import enum


class MatchStatus(str, enum.Enum):
    open = "open"       # posted, waiting for opponent team
    full = "full"       # opponent team joined, match confirmed
    done = "done"       # match completed


class Match(Base):
    __tablename__ = "matches"

    id                   = Column(Integer, primary_key=True, index=True)
    title                = Column(String(200), nullable=False)
    location             = Column(String(300), nullable=False)
    scheduled_at         = Column(DateTime, nullable=False)
    slots                = Column(Integer, nullable=False, default=10)

    status               = Column(Enum(MatchStatus), default=MatchStatus.open, nullable=False)

    # Team that posted the match request
    requesting_team_id   = Column(Integer, ForeignKey("teams.id"), nullable=False)
    # Team that accepted/joined (null until another team joins)
    opponent_team_id     = Column(Integer, ForeignKey("teams.id"), nullable=True)

    # Which user (admin) created this match request
    created_by_user_id   = Column(Integer, ForeignKey("users.id"), nullable=False)
    # Which user (admin) joined on behalf of opponent team
    joined_by_user_id    = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at           = Column(DateTime, default=datetime.utcnow)

    requesting_team      = relationship("Team", foreign_keys=[requesting_team_id], backref="requested_matches")
    opponent_team        = relationship("Team", foreign_keys=[opponent_team_id], backref="joined_matches")
    created_by           = relationship("User", foreign_keys=[created_by_user_id])
    joined_by            = relationship("User", foreign_keys=[joined_by_user_id])
