from fastapi import FastAPI
from app.db.database import engine, Base
from app.db.models import user, match          # import both models so tables are registered
from app.api.routes import users, matches


app = FastAPI(title="Football Match App", version="1.0.0")

# Register routers
app.include_router(users.router)
app.include_router(matches.router)

# Create all tables on startup
Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {"message": "API is working ✅"}
