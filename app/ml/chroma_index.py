import numpy as np
import chromadb
from chromadb.config import Settings

# ── ChromaDB client (persists to disk automatically) ─────────────────────────
client = chromadb.PersistentClient(path="./chroma_store")

# One collection holds all face embeddings
collection = client.get_or_create_collection(
    name="face_embeddings",
    metadata={"hnsw:space": "l2"},   # L2 distance, same as before
)

dimension = 512   # FaceNet InceptionResnetV1 output size


# ── Public API ────────────────────────────────────────────────────────────────

def add_embedding(user_id: int, embedding: np.ndarray):
    """
    Add or replace a user's face embedding in ChromaDB.
    ChromaDB uses string IDs — we use str(user_id).
    """
    vector = embedding.astype("float32").tolist()

    # upsert = insert if not exists, replace if exists
    collection.upsert(
        ids=[str(user_id)],
        embeddings=[vector],
        metadatas=[{"user_id": user_id}],
    )
    print(f"[Chroma] Upserted embedding for user {user_id}")


def search_embedding(query_embedding: np.ndarray) -> int | None:
    """
    Find the closest face in ChromaDB.
    Returns user_id if a good match is found, None otherwise.
    """
    if collection.count() == 0:
        return None

    vector = query_embedding.astype("float32").tolist()

    results = collection.query(
        query_embeddings=[vector],
        n_results=1,
        include=["distances", "metadatas"],
    )

    if not results or not results["ids"][0]:
        return None

    distance = results["distances"][0][0]
    metadata = results["metadatas"][0][0]

    # FaceNet L2 distance threshold — below 0.9 is a confident match
    if distance > 0.9:
        print(f"[Chroma] No match — closest distance was {distance:.4f}")
        return None

    user_id = metadata["user_id"]
    print(f"[Chroma] Matched user {user_id} with distance {distance:.4f}")
    return int(user_id)


def load_embeddings_from_db(db):
    """
    Called once on startup. Syncs ChromaDB with MySQL.
    MySQL is the source of truth — ChromaDB is rebuilt from it.
    This ensures face login works even if chroma_store is deleted.
    """
    from app.db.models.user import User

    users = db.query(User).filter(User.face_embedding.isnot(None)).all()

    loaded  = 0
    skipped = 0

    for user in users:
        if not user.face_embedding:
            skipped += 1
            continue
        try:
            embedding = np.frombuffer(user.face_embedding, dtype="float32").copy()
            if embedding.shape[0] != dimension:
                print(f"[Chroma] Skipping user {user.id}: expected {dimension}-d, got {embedding.shape[0]}-d")
                skipped += 1
                continue

            # Only add if not already in ChromaDB (avoids duplicate work on restart)
            existing = collection.get(ids=[str(user.id)])
            if existing and existing["ids"]:
                loaded += 1
                continue

            collection.upsert(
                ids=[str(user.id)],
                embeddings=[embedding.tolist()],
                metadatas=[{"user_id": user.id}],
            )
            loaded += 1

        except Exception as e:
            print(f"[Chroma] Error loading user {user.id}: {e}")
            skipped += 1

    print(f"[Chroma] Synced {loaded} embeddings from DB ({skipped} skipped) — {collection.count()} total in store")
