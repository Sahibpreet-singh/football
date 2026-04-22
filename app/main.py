from fastapi import FastAPI
from app.db.database import engine,Base
from app.db.models import user
from app.api.routes import users


app=FastAPI()
app.include_router(users.router)

Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"message":" Api is working "}