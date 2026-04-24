from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import engine, Base, SessionLocal
from app.db.models import user, match
from app.api.routes import users, matches, google_auth
from app.ml.faiss_index import load_embeddings_from_db

app = FastAPI(title="Football Match App", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(matches.router)
app.include_router(google_auth.router)

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        load_embeddings_from_db(db)
    finally:
        db.close()

@app.get("/")
def root():
    return {"message": "API is working"}
