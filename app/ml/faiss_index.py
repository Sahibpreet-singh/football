import faiss
import numpy as np

dimension = 128
index = faiss.IndexFlatL2(dimension)
user_ids = []


def add_embedding(user_id: int, embedding):
    vector = np.array([embedding]).astype("float32")
    index.add(vector)
    user_ids.append(user_id)


def search_embedding(query_embedding) -> int | None:
    # If index is empty, nobody is registered yet
    if index.ntotal == 0:
        return None

    vector = np.array([query_embedding]).astype("float32")
    distances, indices = index.search(vector, k=1)

    idx = indices[0][0]

    # ✅ Bounds check — idx can be -1 if search fails
    if idx < 0 or idx >= len(user_ids):
        return None

    # Optional: reject if distance is too large (face doesn't match anyone well)
    if distances[0][0] > 0.6:
        return None

    return user_ids[idx]


def load_embeddings_from_db(db):
    """
    Call this once on startup.
    Reads all face embeddings stored in MySQL and loads them into FAISS.
    This means face login works even after a server restart.
    """
    from app.db.models.user import User

    users = db.query(User).filter(User.face_embedding != None).all()

    loaded = 0
    for user in users:
        if user.face_embedding:
            embedding = np.frombuffer(user.face_embedding, dtype="float32")
            if embedding.shape[0] == dimension:
                add_embedding(user.id, embedding)
                loaded += 1

    print(f"[FAISS] Loaded {loaded} face embeddings from DB")
