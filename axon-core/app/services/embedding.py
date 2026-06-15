from sentence_transformers import SentenceTransformer
from app.config import settings
import logging

logger = logging.getLogger(__name__)

_model: SentenceTransformer | None = None

def load_model():
    global _model
    logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
    _model = SentenceTransformer(settings.EMBEDDING_MODEL, device="cpu")
    logger.info("Embedding model loaded successfully")

def get_model() -> SentenceTransformer:
    if _model is None:
        raise RuntimeError("Embedding model not loaded. Call load_model() at startup.")
    return _model

def encode(text: str) -> list[float]:
    model = get_model()
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.tolist()

def encode_batch(texts: list[str]) -> list[list[float]]:
    model = get_model()
    embeddings = model.encode(texts, normalize_embeddings=True, batch_size=32)
    return embeddings.tolist()
