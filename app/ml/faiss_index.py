import faiss
import numpy as np
import os
import threading

dimension = 128
INDEX_PATH = "faiss_index.bin"
IDS_PATH   = "faiss_ids.npy"

_lock = threading.Lock()

index    = faiss.IndexFlatL2(dimension)
user_ids: list[int] = []


# ── Persistence helpers ───────────────────────────────────────────────────────

def _save_to_disk():
    """Save index + id list to disk so they survive restarts without DB reload."""
    try:
        faiss.write_index(index, INDEX_PATH)
        np.save(IDS_PATH, np.array(user_ids, dtype="int64"))
    except Exception as e:
        print(f"[FAISS] Warning: could not save to disk: {e}")


def _load_from_disk() -> bool:
    """Try to load index from disk. Returns True if successful."""
    global index, user_ids
    if not os.path.exists(INDEX_PATH) or not os.path.exists(IDS_PATH):
        return False
    try:
        loaded_index = faiss.read_index(INDEX_PATH)
        loaded_ids   = np.load(IDS_PATH).tolist()
        if loaded_index.ntotal == len(loaded_ids):
            index    = loaded_index
            user_ids = loaded_ids
            print(f"[FAISS] Loaded {len(user_ids)} embeddings from disk cache")
            return True
    except Exception as e:
        print(f"[FAISS] Could not load from disk: {e}")
    return False


# ── Public API ────────────────────────────────────────────────────────────────

def add_embedding(user_id: int, embedding: np.ndarray):
    """Add a face embedding. Safe to call from any thread."""
    with _lock:
        # Don't add duplicates
        if user_id in user_ids:
            # Replace: rebuild without old entry, then add new
            _rebuild_without(user_id)

        vector = np.array([embedding], dtype="float32")
        index.add(vector)
        user_ids.append(user_id)
        _save_to_disk()


def _rebuild_without(user_id: int):
    """Remove an existing user's embedding by rebuilding the index."""
    global index, user_ids
    if user_id not in user_ids:
        return

    keep_indices = [i for i, uid in enumerate(user_ids) if uid != user_id]
    if not keep_indices:
        index    = faiss.IndexFlatL2(dimension)
        user_ids = []
        return

    # Extract all vectors, keep only the ones we want
    all_vecs = np.zeros((index.ntotal, dimension), dtype="float32")
    faiss.extract_index_to_memory(index, all_vecs) if hasattr(faiss, "extract_index_to_memory") else _extract_vectors(all_vecs)

    new_vecs = all_vecs[keep_indices]
    index    = faiss.IndexFlatL2(dimension)
    index.add(new_vecs)
    user_ids = [user_ids[i] for i in keep_indices]


def _extract_vectors(out: np.ndarray):
    """Fallback: reconstruct vectors from index one by one."""
    for i in range(index.ntotal):
        out[i] = index.reconstruct(i)


def search_embedding(query_embedding: np.ndarray) -> int | None:
    """Find the closest registered face. Returns user_id or None."""
    with _lock:
        if index.ntotal == 0:
            return None

        vector = np.array([query_embedding], dtype="float32")
        distances, indices = index.search(vector, k=1)

        idx = indices[0][0]
        if idx < 0 or idx >= len(user_ids):
            return None

        # Reject if too far — not a real match
        # face_recognition uses euclidean distance; <0.6 is a solid match
        if distances[0][0] > 0.6:
            return None

        return user_ids[idx]


def load_embeddings_from_db(db):
    """
    Called once on startup. Syncs FAISS with whatever is in MySQL.
    Rebuilds from DB — this is the source of truth.
    This handles the case where the disk cache is stale or missing.
    """
    global index, user_ids

    from app.db.models.user import User

    with _lock:
        # Always rebuild from DB on startup — DB is source of truth
        index    = faiss.IndexFlatL2(dimension)
        user_ids = []

        users = db.query(User).filter(User.face_embedding.isnot(None)).all()

        loaded = 0
        skipped = 0
        for user in users:
            if not user.face_embedding:
                skipped += 1
                continue
            try:
                embedding = np.frombuffer(user.face_embedding, dtype="float32").copy()
                if embedding.shape[0] != dimension:
                    print(f"[FAISS] Skipping user {user.id}: wrong embedding size {embedding.shape[0]}")
                    skipped += 1
                    continue
                vector = np.array([embedding], dtype="float32")
                index.add(vector)
                user_ids.append(user.id)
                loaded += 1
            except Exception as e:
                print(f"[FAISS] Error loading user {user.id}: {e}")
                skipped += 1

        print(f"[FAISS] Loaded {loaded} embeddings from DB ({skipped} skipped)")
        _save_to_disk()
