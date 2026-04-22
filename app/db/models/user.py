from sqlalchemy import Column,Integer,String,LargeBinary
from app.db.database import Base

class User(Base):
    __tablename__="users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(100), unique=True, index=True)
    password = Column(String(255))
    
    face_embedding = Column(LargeBinary)

