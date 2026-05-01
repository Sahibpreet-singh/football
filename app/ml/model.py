import cv2
import torch
import numpy as np
from facenet_pytorch import InceptionResnetV1, MTCNN
from PIL import Image

# ── Device ────────────────────────────────────────────────────────────────────
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"[FaceNet] Running on {device}")

# ── Models (loaded once at import time) ───────────────────────────────────────
# MTCNN: detects and aligns the face, crops it to 160x160
mtcnn = MTCNN(
    image_size=160,
    margin=20,
    min_face_size=40,
    thresholds=[0.6, 0.7, 0.7],
    factor=0.709,
    post_process=True,
    device=device,
    keep_all=False,       # only the most prominent face
)

# InceptionResnetV1: pretrained on VGGFace2, outputs 512-d embedding
resnet = InceptionResnetV1(pretrained="vggface2").eval().to(device)


# ── Main function ─────────────────────────────────────────────────────────────
def get_embedding(img_path: str) -> np.ndarray | None:
    """
    Load an image, detect + align the face with MTCNN,
    then generate a 512-d L2-normalised embedding with FaceNet (InceptionResnetV1).

    Returns a numpy float32 array of shape (512,), or None if no face detected.
    """
    # 1. Read with OpenCV (handles all formats, BGR)
    bgr = cv2.imread(img_path)
    if bgr is None:
        print(f"[FaceNet] Could not read image: {img_path}")
        return None

    # 2. Convert BGR → RGB (MTCNN and PIL expect RGB)
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)

    # 3. Convert to PIL Image (facenet_pytorch expects PIL)
    pil_img = Image.fromarray(rgb)

    # 4. Detect face + align with MTCNN → returns tensor (3, 160, 160) or None
    face_tensor = mtcnn(pil_img)
    if face_tensor is None:
        print(f"[FaceNet] No face detected in: {img_path}")
        return None

    # 5. Add batch dim → (1, 3, 160, 160), move to GPU
    face_batch = face_tensor.unsqueeze(0).to(device)

    # 6. Generate embedding — shape (1, 512), already L2-normalised by resnet
    with torch.no_grad():
        embedding = resnet(face_batch)

    # 7. Return as numpy float32 (512,)
    return embedding.squeeze(0).cpu().numpy().astype("float32")
