from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.orm import Session
import bcrypt

from app.db.database import SessionLocal
from app.db.models.user import User
from app.ml.faiss_index import search_embedding, add_embedding
from app.ml.model import get_embedding
from app.core.auth import create_access_token, get_current_user

import shutil
import os

UPLOAD_DIR = "temp"
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(prefix="/users", tags=["Users"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def hash_password(password: str) -> str:
    # bcrypt limit is 72 bytes — truncate to be safe
    pw_bytes = password.encode("utf-8")[:72]
    return bcrypt.hashpw(pw_bytes, bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    pw_bytes = password.encode("utf-8")[:72]
    return bcrypt.checkpw(pw_bytes, hashed.encode("utf-8"))


@router.post("/register")
def register_face(
    name: str        = Form(...),
    email: str       = Form(...),
    password: str    = Form(...),
    file: UploadFile = File(...),
    db: Session      = Depends(get_db)
):
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    file_path = f"{UPLOAD_DIR}/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    embedding = get_embedding(file_path)
    if embedding is None:
        raise HTTPException(status_code=400, detail="No face detected in the uploaded image")

    user = User(
        name=name,
        email=email,
        password=hash_password(password),
        face_embedding=embedding.tobytes()
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    add_embedding(user.id, embedding)
    token = create_access_token(user.id, user.name)

    return {
        "message": "Registered successfully",
        "id": user.id,
        "name": user.name,
        "access_token": token,
        "token_type": "bearer"
    }


@router.post("/login")
def login_face(
    file: UploadFile = File(...),
    db: Session      = Depends(get_db)
):
    file_path = f"{UPLOAD_DIR}/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    embedding = get_embedding(file_path)
    if embedding is None:
        raise HTTPException(status_code=400, detail="No face detected in the uploaded image")

    user_id = search_embedding(embedding)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Face not recognised — please register first")

    user = db.query(User).filter(User.id == user_id).first()
    token = create_access_token(user.id, user.name)

    return {
        "message": "Login successful",
        "id": user.id,
        "name": user.name,
        "access_token": token,
        "token_type": "bearer"
    }


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email
    }
