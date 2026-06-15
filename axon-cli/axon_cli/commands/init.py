import click
from axon_cli.config import save_config, load_config
from axon_cli.display import print_success, print_info

@click.command()
@click.option("--base-url", default="http://localhost:8000", help="Axon server base URL (default: http://localhost:8000)")
@click.option("--api-key", default="", help="Agent API key")
@click.option("--project-id", default="", help="Project ID")
@click.option("--interactive/--no-interactive", default=True, help="Prompt interactively if not provided via options")
def init(base_url, api_key, project_id, interactive):
    """Initialize a new .axon configuration file in the current directory."""
    print_info("Initializing Axon Protocol CLI...")
    
    current_config = load_config()
    
    if interactive:
        # Prompt for base URL
        default_url = current_config.get("base_url") or base_url
        base_url = click.prompt("Axon server base URL", default=default_url)
        
        # Prompt for api key
        default_key = current_config.get("api_key") or api_key
        api_key = click.prompt("Agent API key (optional)", default=default_key, show_default=True)
        
        # Prompt for project ID
        default_project = current_config.get("project_id") or project_id
        project_id = click.prompt("Project ID (optional)", default=default_project, show_default=True)

    config_path = save_config(base_url, api_key, project_id)
    print_success(f"Configuration saved successfully to {config_path}")
