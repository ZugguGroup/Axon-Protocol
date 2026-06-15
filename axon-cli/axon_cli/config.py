import os
import json
from pathlib import Path
from typing import Optional, Dict, Any

CONFIG_FILENAME = ".axon"

def find_config_file() -> Optional[Path]:
    """Search for .axon config file in the current directory."""
    current = Path.cwd()
    config_path = current / CONFIG_FILENAME
    if config_path.is_file():
        return config_path
    return None

def load_config() -> Dict[str, Any]:
    """Load configuration from .axon file or environment variables."""
    config = {
        "base_url": os.getenv("AXON_BASE_URL", "http://localhost:8000"),
        "api_key": os.getenv("AXON_API_KEY"),
        "project_id": os.getenv("AXON_PROJECT_ID"),
        "agent_id": os.getenv("AXON_AGENT_ID"),
        "agent_token": os.getenv("AXON_AGENT_TOKEN"),
    }

    config_path = find_config_file()
    if config_path:
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict):
                    # Override defaults with config file values if present
                    if "base_url" in data:
                        config["base_url"] = data["base_url"]
                    if "api_key" in data:
                        config["api_key"] = data["api_key"]
                    if "project_id" in data:
                        config["project_id"] = data["project_id"]
                    if "agent_id" in data:
                        config["agent_id"] = data["agent_id"]
                    if "agent_token" in data:
                        config["agent_token"] = data["agent_token"]
        except Exception:
            # If JSON is corrupted or unreadable, fall back to environment/defaults
            pass

    return config

def save_config(base_url: str, api_key: str, project_id: str, agent_id: str = None, agent_token: str = None) -> Path:
    """Save configuration to .axon file in the current directory."""
    config_path = Path.cwd() / CONFIG_FILENAME
    
    # Preserve existing agent values if not explicitly provided
    existing = {}
    if config_path.is_file():
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                existing = json.load(f)
        except Exception:
            pass
            
    data = {
        "base_url": base_url,
        "api_key": api_key,
        "project_id": project_id,
        "agent_id": agent_id or existing.get("agent_id"),
        "agent_token": agent_token or existing.get("agent_token"),
    }
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    return config_path
