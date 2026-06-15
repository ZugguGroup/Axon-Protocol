import click
from axon_cli.http import AxonHttpClient
from axon_cli.display import print_success, print_info, print_error, print_table, print_panel

@click.group()
def lock():
    """Manage distributed resource locks."""
    pass

@lock.command("list")
def list_locks():
    """List all active locks in the project."""
    client = AxonHttpClient()
    if not client.api_key:
        raise click.ClickException("No API key configured. Run 'axon init' or 'axon agent register'.")

    print_info("Listing active locks...")
    res = client.get("/v1/lock/list")
    locks = res.get("locks", [])
    
    if not locks:
        print_info("No active locks found.")
        return

    headers = ["Resource ID", "Holder Agent ID", "Locked At", "Expires At"]
    rows = []
    for l in locks:
        rows.append([
            l["resource_id"],
            l["agent_id"],
            l["locked_at"][:19],
            l["expires_at"][:19]
        ])
        
    print_table("Active Locks", headers, rows)

@lock.command("status")
@click.argument("resource_id")
def status(resource_id):
    """Check the lock status of a resource."""
    client = AxonHttpClient()
    if not client.api_key:
        raise click.ClickException("No API key configured. Run 'axon init' or 'axon agent register'.")

    print_info(f"Checking lock status for resource '{resource_id}'...")
    res = client.get(f"/v1/lock/status/{resource_id}")
    
    locked = res.get("locked", False)
    if locked:
        content = (
            f"[bold]Status:[/bold] [red]LOCKED[/red]\n"
            f"[bold]Resource ID:[/bold] {res['resource_id']}\n"
            f"[bold]Holder Agent ID:[/bold] {res.get('holder_agent_id')}\n"
            f"[bold]Locked At:[/bold] {res.get('locked_at')}\n"
            f"[bold]Expires At:[/bold] {res.get('expires_at')}"
        )
        print_panel("Lock Status", content, border_style="red")
    else:
        content = (
            f"[bold]Status:[/bold] [green]UNLOCKED[/green]\n"
            f"[bold]Resource ID:[/bold] {res['resource_id']}"
        )
        print_panel("Lock Status", content, border_style="green")

@lock.command("acquire")
@click.argument("resource_id")
@click.option("-t", "--timeout", type=int, default=300, help="Expiration timeout in seconds (default: 300)")
@click.option("-m", "--metadata", multiple=True, help="Optional metadata (e.g. -m owner=daemon)")
def acquire(resource_id, timeout, metadata):
    """Acquire an exclusive lock on a resource."""
    client = AxonHttpClient()
    if not client.api_key:
        raise click.ClickException("No API key configured. Run 'axon init' or 'axon agent register'.")

    meta_dict = {}
    for item in metadata:
        if "=" in item:
            k, v = item.split("=", 1)
            meta_dict[k.strip()] = v.strip()
        else:
            meta_dict[item.strip()] = True

    payload = {
        "resource_id": resource_id,
        "timeout": timeout,
    }
    if meta_dict:
        payload["metadata"] = meta_dict

    print_info(f"Acquiring lock on resource '{resource_id}'...")
    res = client.post("/v1/lock/acquire", json=payload)
    
    content = (
        f"[bold]Lock ID:[/bold] {res['lock_id']}\n"
        f"[bold]Resource ID:[/bold] {res['resource_id']}\n"
        f"[bold]Expires At:[/bold] {res['expires_at']}"
    )
    print_panel("Lock Acquired", content)
    print_success(f"Successfully locked resource '{resource_id}'!")

@lock.command("release")
@click.argument("resource_id")
def release(resource_id):
    """Release a lock on a resource."""
    client = AxonHttpClient()
    if not client.api_key:
        raise click.ClickException("No API key configured. Run 'axon init' or 'axon agent register'.")

    print_info(f"Releasing lock on resource '{resource_id}'...")
    res = client.post("/v1/lock/release", params={"resource_id": resource_id})
    
    if res.get("released"):
        print_success(f"Lock on resource '{resource_id}' released successfully.")
    else:
        print_error(f"Failed to release lock on resource '{resource_id}'.")
