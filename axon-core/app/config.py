from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from pydantic import model_validator

class Settings(BaseSettings):
    # Mode: "local" or "cloud"
    AXON_MODE: str = "local"
    AXON_DIR: str = os.path.expanduser("~/.axon")
    
    # Database
    DATABASE_URL: str = ""
    
    # Redis
    REDIS_URL: str = ""
    
    # ChromaDB
    CHROMA_PATH: str = ""
    
    # Security
    JWT_SECRET: str = "change-this-secret-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440  # 24 hours
    HMAC_SECRET: str = "change-this-hmac-secret-in-production"
    
    # Embedding
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    EMBEDDING_DIM: int = 384
    
    # Locks
    DEFAULT_LOCK_TIMEOUT: int = 300  # seconds
    LOCK_CLEANUP_INTERVAL: int = 30  # seconds
    
    # App
    LOG_LEVEL: str = "INFO"
    APP_VERSION: str = "0.1.0"
    
    BILLING_PROVIDER: str = "mock"
    STRIPE_API_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRO_PRICE_ID: str = ""
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""
    
    @model_validator(mode='before')
    @classmethod
    def set_defaults(cls, data: dict) -> dict:
        if not isinstance(data, dict):
            # pydantic settings passes a dictionary or Settings instance
            return data
        axon_mode = data.get("AXON_MODE") or os.getenv("AXON_MODE", "local")
        axon_dir = data.get("AXON_DIR") or os.getenv("AXON_DIR", os.path.expanduser("~/.axon"))
        
        if axon_mode == "local":
            os.makedirs(axon_dir, exist_ok=True)
            data["DATABASE_URL"] = f"sqlite+aiosqlite:///{os.path.join(axon_dir, 'local.db')}"
            data["REDIS_URL"] = "in-memory"
        else:
            if not data.get("DATABASE_URL") and not os.getenv("DATABASE_URL"):
                data["DATABASE_URL"] = "postgresql+asyncpg://axon:axon@localhost:5432/axon"
            if not data.get("REDIS_URL") and not os.getenv("REDIS_URL"):
                data["REDIS_URL"] = "redis://localhost:6379"
                
        if not data.get("CHROMA_PATH") and not os.getenv("CHROMA_PATH"):
            data["CHROMA_PATH"] = os.path.join(axon_dir, "chroma")
            
        return data

    class Config:
        env_file = ".env"
        extra = "ignore"

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
