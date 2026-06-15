import click
from axon_cli.http import AxonHttpClient
from axon_cli.display import print_success, print_info, print_error, print_table, print_panel, console, supports_unicode

@click.group()
def receipt():
    """Manage and verify reasoning receipts."""
    pass

@receipt.command("list")
@click.option("-l", "--limit", type=int, default=50, help="Max number of receipts (default: 50)")
def list_receipts(limit):
    """List reasoning receipts."""
    client = AxonHttpClient()
    if not client.api_key:
        raise click.ClickException("No API key configured. Run 'axon init' or 'axon agent register'.")

    print_info("Listing receipts...")
    res = client.get("/v1/receipts/list", params={"limit": limit})
    receipts = res.get("receipts", [])
    
    if not receipts:
        print_info("No receipts found.")
        return

    headers = ["ID", "Agent ID", "Input Sneak-peek", "Chain Hash", "Created At"]
    rows = []
    for r in receipts:
        rows.append([
            r["id"],
            r["agent_id"],
            r["input_text"],
            r["chain_hash"][:16] + "...",
            r["created_at"][:19]
        ])
        
    print_table("Reasoning Receipts", headers, rows)

@receipt.command("show")
@click.argument("receipt_id")
def show(receipt_id):
    """Show details and reasoning chain of a receipt."""
    client = AxonHttpClient()
    if not client.api_key:
        raise click.ClickException("No API key configured. Run 'axon init' or 'axon agent register'.")

    print_info(f"Retrieving receipt {receipt_id}...")
    res = client.get(f"/v1/receipts/{receipt_id}")
    
    # Metadata panel
    metadata = (
        f"[bold]Receipt ID:[/bold] {res['id']}\n"
        f"[bold]Agent ID:[/bold] {res['agent_id']}\n"
        f"[bold]Parent ID:[/bold] {res.get('parent_receipt_id') or 'None'}\n"
        f"[bold]Chain Hash:[/bold] {res['chain_hash']}\n"
        f"[bold]Signature:[/bold] {res['signature'][:40]}...\n"
        f"[bold]Created At:[/bold] {res['created_at']}"
    )
    print_panel("Receipt Metadata", metadata)
    
    # Input/Output
    console.print(f"\n[bold #818cf8]Input:[/bold #818cf8] {res['input_text']}\n")
    
    # Steps
    console.print("[bold #818cf8]Reasoning Steps:[/bold #818cf8]")
    steps = res.get("reasoning_steps", [])
    if not steps:
        console.print("  [dim]No steps recorded[/dim]")
    else:
        for idx, step in enumerate(steps, 1):
            console.print(f"  [bold]{idx}. Thought:[/bold] {step.get('thought')}")
            if step.get("tool_called"):
                console.print(f"     [bold cyan]Tool:[/bold cyan] {step['tool_called']}")
            if step.get("result"):
                console.print(f"     [bold green]Result:[/bold green] {step['result']}")
                
    console.print(f"\n[bold #818cf8]Output:[/bold #818cf8] {res['output_text']}\n")

@receipt.command("verify")
@click.argument("receipt_id")
def verify(receipt_id):
    """Verify that a reasoning receipt has not been tampered with."""
    client = AxonHttpClient()
    if not client.api_key:
        raise click.ClickException("No API key configured. Run 'axon init' or 'axon agent register'.")

    print_info(f"Verifying receipt {receipt_id}...")
    res = client.post("/v1/receipts/verify", params={"receipt_id": receipt_id})
    
    valid = res.get("valid", False)
    check_icon = "✔" if supports_unicode() else "OK"
    cross_icon = "✘" if supports_unicode() else "FAIL"
    
    if valid:
        content = (
            f"[bold]Receipt ID:[/bold] {res['receipt_id']}\n"
            f"[bold]Status:[/bold] [green]VALID & UNTAMPERED[/green] (Integrity verified) {check_icon}\n"
            f"[bold]Chain Hash:[/bold] {res['chain_hash']}\n"
            f"[bold]Recomputed Hash:[/bold] {res['recomputed_hash']}\n"
            f"[bold]Message:[/bold] {res['message']}"
        )
        print_panel("Verification Result", content, border_style="green")
        print_success("Receipt integrity verified!")
    else:
        content = (
            f"[bold]Receipt ID:[/bold] {res['receipt_id']}\n"
            f"[bold]Status:[/bold] [red]INVALID / TAMPERED[/red] {cross_icon}\n"
            f"[bold]Chain Hash:[/bold] {res['chain_hash']}\n"
            f"[bold]Recomputed Hash:[/bold] {res['recomputed_hash']}\n"
            f"[bold]Message:[/bold] {res['message']}"
        )
        print_panel("Verification Result", content, border_style="red")
        print_error("WARNING: Receipt has been tampered with or is invalid!")
