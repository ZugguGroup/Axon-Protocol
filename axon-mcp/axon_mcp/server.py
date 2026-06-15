import os
import json
from pathlib import Path
from typing import Dict, Any, Optional
from mcp.server.fastmcp import FastMCP
import httpx

# FastMCP Server Instance
mcp = FastMCP("Axon Protocol")

def find_cwd_config() -> Optional[Path]:
    config_path = Path.cwd() / ".axon"
    if config_path.is_file():
        return config_path
    return None

def find_upward_config() -> Optional[Path]:
    current = Path.cwd()
    for parent in [current] + list(current.parents):
        config_path = parent / ".axon"
        if config_path.is_file():
            return config_path
    return None

def find_home_config() -> Optional[Path]:
    home = Path.home()
    # Try ~/.axon/config.json
    config_json = home / ".axon" / "config.json"
    if config_json.is_file():
        return config_json
    # Try ~/.axon
    config_dot = home / ".axon"
    if config_dot.is_file():
        return config_dot
    return None

def load_config() -> Dict[str, Any]:
    # Default settings checking env first
    config = {
        "base_url": os.getenv("AXON_BASE_URL", "http://localhost:8000"),
        "api_key": os.getenv("AXON_API_KEY"),
        "project_id": os.getenv("AXON_PROJECT_ID"),
        "agent_id": os.getenv("AXON_AGENT_ID"),
        "agent_token": os.getenv("AXON_AGENT_TOKEN"),
    }
    
    # Try loading from local config files
    config_path = find_cwd_config() or find_upward_config() or find_home_config()
    if config_path:
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict):
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
            pass
            
    return config

def get_client() -> httpx.Client:
    config = load_config()
    headers = {
        "Content-Type": "application/json"
    }
    # If using local mode fallback defaults, inject default project key
    api_key = config.get("api_key") or "axon-local-dev-key-384729"
    headers["X-API-Key"] = api_key
    
    if config.get("agent_id"):
        headers["X-Agent-ID"] = config["agent_id"]
    if config.get("agent_token"):
        headers["Authorization"] = f"Bearer {config['agent_token']}"
        
    return httpx.Client(
        base_url=config["base_url"],
        headers=headers,
        timeout=10.0
    )

@mcp.tool()
def axon_register_agent(name: str, capabilities: list[str]) -> str:
    """Register a new agent in Axon.
    
    Args:
        name: Name of the agent.
        capabilities: List of capability strings (e.g., ["coding", "planning"]).
    """
    config = load_config()
    project_id = config.get("project_id") or "00000000-0000-0000-0000-000000000000"
        
    with get_client() as client:
        try:
            resp = client.post("/v1/agents/register", json={
                "name": name,
                "project_id": project_id,
                "capabilities": capabilities
            })
            if resp.status_code != 200:
                return f"Error registering agent: {resp.text}"
            data = resp.json()
            return f"Agent registered successfully.\nAgent ID: {data.get('agent_id')}\nToken: {data.get('token')}"
        except Exception as e:
            return f"Error connecting to server: {str(e)}"

@mcp.tool()
def axon_store_memory(content: str, tags: dict = None, scope: str = "project", ttl: int = None) -> str:
    """Store a text memory in Axon.
    
    Args:
        content: The text content of the memory.
        tags: Optional dict of key-value tags.
        scope: Scope of the memory ('project', 'private', or 'org'). Defaults to 'project'.
        ttl: Optional Time-to-Live in seconds.
    """
    with get_client() as client:
        try:
            resp = client.post("/v1/memory/store", json={
                "content": content,
                "tags": tags or {},
                "scope": scope,
                "ttl": ttl
            })
            if resp.status_code != 200:
                return f"Error storing memory: {resp.text}"
            data = resp.json()
            return f"Memory stored successfully.\nMemory ID: {data.get('id')}\nCreated At: {data.get('created_at')}"
        except Exception as e:
            return f"Error connecting to server: {str(e)}"

@mcp.tool()
def axon_search_memories(query: str, limit: int = 10, min_similarity: float = 0.3, scope: str = None) -> str:
    """Search stored memories in Axon.
    
    Args:
        query: The semantic search query.
        limit: Max number of results. Defaults to 10.
        min_similarity: Threshold for similarity [0.0 - 1.0]. Defaults to 0.3.
        scope: Optional scope filter.
    """
    with get_client() as client:
        try:
            payload = {
                "query": query,
                "limit": limit,
                "min_similarity": min_similarity
            }
            if scope:
                payload["scope"] = scope
                
            resp = client.post("/v1/memory/search", json=payload)
            if resp.status_code != 200:
                return f"Error searching memories: {resp.text}"
                
            data = resp.json()
            results = data.get("results", [])
            if not results:
                return "No matching memories found."
                
            output = []
            for r in results:
                output.append(
                    f"[{r.get('similarity', 0.0):.2f}] ID: {r.get('id')}\nContent: {r.get('content')}\nTags: {r.get('tags', {})}\n"
                )
            return "\n".join(output)
        except Exception as e:
            return f"Error connecting to server: {str(e)}"

@mcp.tool()
def axon_acquire_lock(resource_id: str, timeout: int = 300) -> str:
    """Acquire a distributed lock.
    
    Args:
        resource_id: The ID of the resource to lock.
        timeout: Expiry time in seconds. Defaults to 300.
    """
    with get_client() as client:
        try:
            resp = client.post("/v1/lock/acquire", json={
                "resource_id": resource_id,
                "timeout": timeout
            })
            if resp.status_code == 409:
                return f"Conflict: Resource '{resource_id}' is already locked."
            if resp.status_code != 200:
                return f"Error acquiring lock: {resp.text}"
            data = resp.json()
            return f"Lock acquired successfully.\nLock ID: {data.get('lock_id')}\nExpires At: {data.get('expires_at')}"
        except Exception as e:
            return f"Error connecting to server: {str(e)}"

@mcp.tool()
def axon_release_lock(resource_id: str) -> str:
    """Release a distributed lock.
    
    Args:
        resource_id: The ID of the resource to release.
    """
    with get_client() as client:
        try:
            resp = client.post(f"/v1/lock/release?resource_id={resource_id}")
            if resp.status_code == 403:
                return "Error: You do not own this lock."
            if resp.status_code != 200:
                return f"Error releasing lock: {resp.text}"
            return f"Lock on resource '{resource_id}' released successfully."
        except Exception as e:
            return f"Error connecting to server: {str(e)}"

@mcp.tool()
def axon_create_receipt(input_data: str, steps: list[dict], output_data: str) -> str:
    """Create a cryptographic reasoning receipt in Axon.
    
    Args:
        input_data: The initial input/prompt.
        steps: List of logic step dicts (e.g., [{"step": 1, "action": "parse", "log": "..."}]).
        output_data: The final generated response.
    """
    with get_client() as client:
        try:
            resp = client.post("/v1/receipts/create", json={
                "input": input_data,
                "steps": steps,
                "output": output_data
            })
            if resp.status_code != 200:
                return f"Error creating receipt: {resp.text}"
            data = resp.json()
            return f"Reasoning receipt uploaded.\nReceipt ID: {data.get('id')}\nChain Signature: {data.get('chain_hash')}"
        except Exception as e:
            return f"Error connecting to server: {str(e)}"

def main():
    mcp.run()

if __name__ == "__main__":
    main()
