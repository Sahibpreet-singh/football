from fastapi import APIRouter, Depends, UploadFile, File   # ✅ UploadFile + File added
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db.models.user import User
from app.ml.faiss_index import search_embedding, add_embedding
from app.ml.model import get_embedding                     # ✅ singular, matches model.py fix

import shutil
import os

UPLOAD_DIR = "temp"
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(prefix="/users", tags=["Users"])


# ─── DB Dependency ────────────────────────────────────────────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post("/", summary="Create a user (no face)")
def create_user(name: str, email: str, password: str, db: Session = Depends(get_db)):
    user = User(name=name, email=email, password=password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "User created", "id": user.id}


@router.post("/register-face", summary="Register user with face image")
def register_face(
    name: str,
    email: str,
    password: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    file_path = f"{UPLOAD_DIR}/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    embedding = get_embedding(file_path)

    if embedding is None:
        return {"error": "No face detected in the uploaded image"}

    user = User(
        name=name,
        email=email,
        password=password,
        face_embedding=embedding.tobytes()
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    # Add to in-memory FAISS index
    add_embedding(user.id, embedding)

    return {"message": "User registered with face", "id": user.id}


@router.post("/login-face", summary="Login using face image")
def login_face(file: UploadFile = File(...)):
    file_path = f"{UPLOAD_DIR}/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    embedding = get_embedding(file_path)

    if embedding is None:
        return {"error": "No face detected in the uploaded image"}

    user_id = search_embedding(embedding)

    if user_id is None:
        return {"error": "No matching user found"}

    return {"message": "Login successful", "user_id": user_id}
