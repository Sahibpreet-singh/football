import numpy as np

def get_embedding(img_path: str):
    """
    Mock embedding for deployment.
    Returns a fake 512-d vector so API still works.
    """
    # deterministic fake embedding (so same image → same result if needed later)
    np.random.seed(abs(hash(img_path)) % (10**6))
    return np.random.rand(512).astype("float32")