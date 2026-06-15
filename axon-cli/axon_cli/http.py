import httpx
import click
from typing import Any, Dict, Optional
from axon_cli.config import load_config

class AxonHttpClient:
    def __init__(self):
        config = load_config()
        self.base_url = config["base_url"].rstrip("/")
        self.api_key = config["api_key"]
        self.project_id = config["project_id"]
        self.agent_id = config.get("agent_id")
        self.agent_token = config.get("agent_token")

        headers = {}
        if self.api_key:
            headers["X-API-Key"] = self.api_key
        if self.agent_token:
            headers["Authorization"] = f"Bearer {self.agent_token}"
        if self.agent_id:
            headers["X-Agent-ID"] = self.agent_id
        
        self.client = httpx.Client(
            headers=headers,
            timeout=10.0
        )

    def request(self, method: str, path: str, **kwargs) -> Any:
        url = f"{self.base_url}{path}"
        try:
            response = self.client.request(method, url, **kwargs)
        except httpx.ConnectError:
            raise click.ClickException(
                f"Cannot connect to Axon server at {self.base_url}.\n"
                f"Make sure the server is running (e.g. uvicorn app.main:app)."
            )
        except httpx.TimeoutException:
            raise click.ClickException(
                f"Request to {url} timed out. Server may be overloaded."
            )

        if response.status_code == 200:
            try:
                return response.json()
            except Exception:
                return response.text

        # Error handling
        try:
            detail = response.json().get("detail", response.text)
        except Exception:
            detail = response.text

        if response.status_code == 401:
            raise click.ClickException(f"Authentication failed (401): {detail}")
        elif response.status_code == 403:
            raise click.ClickException(f"Permission denied (403): {detail}")
        elif response.status_code == 404:
            raise click.ClickException(f"Not found (404): {detail}")
        elif response.status_code == 409:
            raise click.ClickException(f"Conflict (409): {detail}")
        elif response.status_code == 429:
            raise click.ClickException(f"Rate limited (429): Try again later.")
        elif response.status_code >= 500:
            raise click.ClickException(f"Server error ({response.status_code}): {detail}")
        else:
            raise click.ClickException(f"Unexpected status {response.status_code}: {detail}")

    def get(self, path: str, params: Optional[Dict[str, Any]] = None) -> Any:
        return self.request("GET", path, params=params)

    def post(self, path: str, json: Optional[Dict[str, Any]] = None, params: Optional[Dict[str, Any]] = None) -> Any:
        return self.request("POST", path, json=json, params=params)

    def delete(self, path: str, params: Optional[Dict[str, Any]] = None) -> Any:
        return self.request("DELETE", path, params=params)
