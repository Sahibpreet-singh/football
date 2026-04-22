from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db.models.user import User

router = APIRouter()

# dependency (like getting DB connection)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/users")
def create_user(name: str, email: str, password: str, db: Session = Depends(get_db)):
    user = User(name=name, email=email, password=password)
    
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": "User created", "id": user.id}