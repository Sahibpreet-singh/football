import faiss
import numpy as np

dimension=128
index=faiss.IndexFlatL2(dimension)

user_ids = []

def add_embedding(user_id, embedding):
    vector = np.array([embedding]).astype("float32")
    index.add(vector)
    user_ids.append(user_id)

def search_embedding(query_embedding):
    vector = np.array([query_embedding]).astype("float32")
    
    distances, indices = index.search(vector, k=1)
    
    if len(indices[0]) == 0:
        return None
    
    idx = indices[0][0]
    return user_ids[idx]