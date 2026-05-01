from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id         = Column(Integer, primary_key=True, index=True)
    team_id    = Column(Integer, ForeignKey("teams.id"), nullable=False, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    content    = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user       = relationship("User", backref="chat_messages")
    team       = relationship("Team", backref="chat_messages")
