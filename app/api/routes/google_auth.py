import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from dotenv import load_dotenv

from app.db.database import SessionLocal
from app.db.models.user import User
from app.core.auth import create_access_token

load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

router = APIRouter(prefix="/auth", tags=["OAuth"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class GoogleTokenRequest(BaseModel):
    token: str


@router.post("/google")
def google_login(payload: GoogleTokenRequest, db: Session = Depends(get_db)):
    try:
        info = id_token.verify_oauth2_token(
            payload.token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    email = info.get("email")
    name  = info.get("name", email.split("@")[0])

    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    user = db.query(User).filter(User.email == email).first()

    if not user:
        user = User(
            name=name,
            email=email,
            password="GOOGLE_AUTH",
            face_embedding=None
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(user.id, user.name)

    return {
        "message": "Google login successful",
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "access_token": token,
        "token_type": "bearer",
        "is_new_user": user.face_embedding is None
    }
