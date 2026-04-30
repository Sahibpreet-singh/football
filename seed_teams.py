"""
Run this once to seed the teams table:
    python seed_teams.py
"""
from app.db.database import SessionLocal, Base, engine
from app.db.models.team import Team

# Import all models so Base knows about them
import app.db.models.user   # noqa
import app.db.models.team   # noqa
import app.db.models.match  # noqa

Base.metadata.create_all(bind=engine)

TEAMS = [
    {"name": "Red Lions",    "tag": "RDL", "color": "#FF4444"},
    {"name": "Blue Eagles",  "tag": "BLE", "color": "#4488FF"},
    {"name": "Green Wolves", "tag": "GRW", "color": "#CAFF33"},
    {"name": "Gold Kings",   "tag": "GLK", "color": "#FF9500"},
    {"name": "Iron FC",      "tag": "IFC", "color": "#888888"},
    {"name": "Shadow United","tag": "SHD", "color": "#9B59B6"},
]

db = SessionLocal()
try:
    for t in TEAMS:
        exists = db.query(Team).filter_by(name=t["name"]).first()
        if not exists:
            db.add(Team(**t))
    db.commit()
    print(f"✅ Seeded {len(TEAMS)} teams")
finally:
    db.close()
