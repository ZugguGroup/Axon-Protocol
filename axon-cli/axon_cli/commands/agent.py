import click
from axon_cli.http import AxonHttpClient
from axon_cli.config import save_config, load_config
from axon_cli.display import print_success, print_info, print_table, print_panel

@click.group()
def agent():
    """Manage agents and agent registration."""
    pass

@agent.command("register")
@click.argument("name")
@click.option("--project-id", help="Project ID for the agent (defaults to config Project ID)")
@click.option("--org-id", help="Organization ID (optional)")
@click.option("-c", "--capability", multiple=True, help="Capabilities of the agent (e.g. -c memory -c planning)")
def register(name, project_id, org_id, capability):
    """Register a new agent with the Axon server."""
    config = load_config()
    target_project = project_id or config.get("project_id")
    if not target_project:
        target_project = click.prompt("Project ID")

    # Connect to client
    client = AxonHttpClient()
    
    payload = {
        "name": name,
        "project_id": target_project,
        "org_id": org_id,
        "capabilities": list(capability) if capability else []
    }
    
    print_info(f"Registering agent '{name}' in project '{target_project}'...")
    res = client.post("/v1/agents/register", json=payload)
    
    # Save Project key, project_id, and agent info to local config
    api_key_to_save = res.get("api_key") or client.api_key or ""
    save_config(
        base_url=client.base_url,
        api_key=api_key_to_save,
        project_id=target_project,
        agent_id=res["id"],
        agent_token=res["token"]
    )
    
    # Display registration result
    content = (
        f"[bold]Agent ID:[/bold] {res['id']}\n"
        f"[bold]Name:[/bold] {res['name']}\n"
        f"[bold]Project ID:[/bold] {res['project_id']}\n"
        f"[bold]API Key:[/bold] [yellow]{api_key_to_save}[/yellow] *(Saved to .axon)*\n"
        f"[bold]JWT Token:[/bold] {res['token'][:30]}...\n"
        f"[bold]Created At:[/bold] {res['created_at']}"
    )
    print_panel("Agent Registered", content, subtitle="Configuration Auto-Updated")
    print_success(f"Successfully registered and authenticated agent '{name}'!")

@agent.command("me")
def me():
    """Get details of the currently authenticated agent."""
    client = AxonHttpClient()
    if not client.api_key:
        raise click.ClickException("No API key configured. Run 'axon init' or 'axon agent register'.")

    print_info("Retrieving agent profile...")
    res = client.get("/v1/agents/me")
    
    content = (
        f"[bold]Agent ID:[/bold] {res['id']}\n"
        f"[bold]Name:[/bold] {res['name']}\n"
        f"[bold]Project ID:[/bold] {res['project_id']}\n"
        f"[bold]Capabilities:[/bold] {', '.join(res.get('capabilities', [])) or 'None'}\n"
        f"[bold]Status:[/bold] {res.get('status', 'unknown')}\n"
        f"[bold]Last Seen:[/bold] {res.get('last_seen_at', 'never')}\n"
        f"[bold]Created At:[/bold] {res['created_at']}"
    )
    print_panel("Agent Profile", content)

@agent.command("list")
def list_agents():
    """List all agents registered in the current project."""
    client = AxonHttpClient()
    if not client.api_key:
        raise click.ClickException("No API key configured. Run 'axon init' or 'axon agent register'.")

    print_info(f"Listing agents for project '{client.project_id}'...")
    res = client.get("/v1/agents/list")
    agents = res.get("agents", [])
    
    if not agents:
        print_info("No agents found in this project.")
        return

    headers = ["ID", "Name", "Capabilities", "Status", "Last Seen"]
    rows = []
    for a in agents:
        rows.append([
            a["id"],
            a["name"],
            ", ".join(a.get("capabilities", [])) or "None",
            a.get("status", "unknown"),
            a.get("last_seen_at") or "never"
        ])
    
    print_table("Project Agents", headers, rows)
