from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "mysql+pymysql://root:1234@localhost:3306/football_schema"

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def init_db():
    """
    Call this once on startup to create all tables that don't exist yet.
    Import all models before calling create_all so SQLAlchemy knows about them.
    """
    from app.db.models.user  import User              # noqa
    from app.db.models.team  import Team, TeamMember  # noqa
    from app.db.models.match import Match             # noqa

    Base.metadata.create_all(bind=engine)