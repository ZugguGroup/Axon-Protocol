import hashlib
import hmac
import json
from app.config import settings

def hash_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def hash_steps(steps: list[dict]) -> str:
    # Sort keys and use compact separators for deterministic output
    serialized = json.dumps(steps, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

def build_chain(input_hash: str, steps_hash: str, output_hash: str) -> str:
    combined = input_hash + steps_hash + output_hash
    return hashlib.sha256(combined.encode("utf-8")).hexdigest()

def sign_chain(chain_hash: str) -> str:
    signature = hmac.new(
        settings.HMAC_SECRET.encode("utf-8"),
        chain_hash.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return signature

def verify_signature(chain_hash: str, signature: str) -> bool:
    expected = sign_chain(chain_hash)
    return hmac.compare_digest(expected, signature)
