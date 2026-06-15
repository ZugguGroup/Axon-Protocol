import click
from axon_cli.commands.init import init
from axon_cli.commands.agent import agent
from axon_cli.commands.memory import memory
from axon_cli.commands.lock import lock
from axon_cli.commands.receipt import receipt
from axon_cli.commands.message import message
from axon_cli.http import AxonHttpClient
from axon_cli.display import print_info, print_table, print_success, print_error, print_logo, supports_unicode

@click.group()
@click.version_option(version="0.1.0")
def cli():
    """Axon Protocol Command Line Interface.
    
    Interact with the Axon server directly from your terminal.
    """
    pass

@cli.command()
def doctor():
    """Run diagnostics to verify backend services health."""
    client = AxonHttpClient()
    print_info("Running diagnostics on Axon Protocol backend...")
    
    # Call readiness check endpoint
    try:
        res = client.get("/v1/health/ready")
    except Exception as e:
        raise click.ClickException(f"Failed to connect to health endpoint: {str(e)}")
        
    status = res.get("status", "unknown")
    checks = res.get("checks", {})
    
    headers = ["Service Component", "Status"]
    rows = []
    
    check_icon = "✔" if supports_unicode() else "OK"
    cross_icon = "✘" if supports_unicode() else "FAIL"
    
    for component, check_val in checks.items():
        name = component.replace("_", " ").title()
        if check_val == "ok":
            status_str = f"[bold green]Healthy[/bold green] {check_icon}"
        else:
            status_str = f"[bold red]Degraded[/bold red] {cross_icon} ({check_val})"
        rows.append([name, status_str])
        
    print_table("System Health Overview", headers, rows)
    
    if status == "ready":
        print_success("All backend systems (Postgres, Redis, Embedder) are fully operational!")
    else:
        print_error("Axon Protocol system is degraded. Check component errors above.")

# Register command groups
cli.add_command(init)
cli.add_command(agent)
cli.add_command(memory)
cli.add_command(lock)
cli.add_command(receipt)
cli.add_command(message)

if __name__ == "__main__":
    cli()
