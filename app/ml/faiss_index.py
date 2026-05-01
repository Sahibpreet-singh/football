import faiss
import numpy as np
import os
import threading

dimension = 512          # FaceNet (InceptionResnetV1) outputs 512-d embeddings
INDEX_PATH = "faiss_index.bin"
IDS_PATH   = "faiss_ids.npy"

_lock = threading.Lock()

index    = faiss.IndexFlatL2(dimension)
user_ids: list[int] = []


# ── Persistence helpers ───────────────────────────────────────────────────────

def _save_to_disk():
    try:
        faiss.write_index(index, INDEX_PATH)
        np.save(IDS_PATH, np.array(user_ids, dtype="int64"))
    except Exception as e:
        print(f"[FAISS] Warning: could not save to disk: {e}")


def _extract_vectors(out: np.ndarray):
    for i in range(index.ntotal):
        out[i] = index.reconstruct(i)


def _rebuild_without(user_id: int):
    global index, user_ids
    if user_id not in user_ids:
        return

    keep_indices = [i for i, uid in enumerate(user_ids) if uid != user_id]
    if not keep_indices:
        index    = faiss.IndexFlatL2(dimension)
        user_ids = []
        return

    all_vecs = np.zeros((index.ntotal, dimension), dtype="float32")
    _extract_vectors(all_vecs)

    new_vecs = all_vecs[keep_indices]
    index    = faiss.IndexFlatL2(dimension)
    index.add(new_vecs)
    user_ids = [user_ids[i] for i in keep_indices]


# ── Public API ────────────────────────────────────────────────────────────────

def add_embedding(user_id: int, embedding: np.ndarray):
    with _lock:
        if user_id in user_ids:
            _rebuild_without(user_id)

        vector = np.array([embedding], dtype="float32")
        index.add(vector)
        user_ids.append(user_id)
        _save_to_disk()


def search_embedding(query_embedding: np.ndarray) -> int | None:
    with _lock:
        if index.ntotal == 0:
            return None

        vector = np.array([query_embedding], dtype="float32")
        distances, indices = index.search(vector, k=1)

        idx = indices[0][0]
        if idx < 0 or idx >= len(user_ids):
            return None

        # FaceNet embeddings are L2-normalised so distance < 0.9 is a solid match
        if distances[0][0] > 0.9:
            return None

        return user_ids[idx]


def load_embeddings_from_db(db):
    """
    Rebuilds FAISS index from MySQL on every startup.
    MySQL is the source of truth — embeddings stored as raw float32 bytes.
    """
    global index, user_ids

    from app.db.models.user import User

    with _lock:
        index    = faiss.IndexFlatL2(dimension)
        user_ids = []

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
                    print(f"[FAISS] Skipping user {user.id}: expected {dimension}-d, got {embedding.shape[0]}-d")
                    skipped += 1
                    continue
                index.add(np.array([embedding], dtype="float32"))
                user_ids.append(user.id)
                loaded += 1
            except Exception as e:
                print(f"[FAISS] Error loading user {user.id}: {e}")
                skipped += 1

        print(f"[FAISS] Loaded {loaded} embeddings from DB ({skipped} skipped)")
        _save_to_disk()
