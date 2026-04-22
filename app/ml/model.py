import face_recognition
import numpy as np


def get_embedding(img_path: str):
    """
    Load an image and return the first face's 128-d embedding.
    Returns None if no face is detected.
    """
    image = face_recognition.load_image_file(img_path)
    encodings = face_recognition.face_encodings(image)

    if len(encodings) == 0:
        return None

    return encodings[0]   # numpy array of shape (128,)
