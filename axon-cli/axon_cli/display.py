from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text
from rich.json import JSON
import json
import sys
from typing import List, Dict, Any

console = Console()

# Theme Colors
ACCENT_COLOR = "purple"
ACCENT_STYLE = "bold #818cf8"
SUCCESS_STYLE = "bold green"
ERROR_STYLE = "bold red"
INFO_STYLE = "bold cyan"
MUTED_STYLE = "dim white"

def supports_unicode() -> bool:
    """Check if the stdout stream supports Unicode/UTF-8 encoding."""
    try:
        encoding = getattr(sys.stdout, "encoding", None) or ""
        return "utf" in encoding.lower()
    except Exception:
        return False

def print_success(message: str):
    prefix = "[bold green]✔[/bold green]" if supports_unicode() else "[bold green][OK][/bold green]"
    console.print(f"{prefix} {message}")

def print_error(message: str):
    prefix = "[bold red]✘[/bold red]" if supports_unicode() else "[bold red][ERR][/bold red]"
    console.print(f"{prefix} {message}")

def print_info(message: str):
    prefix = "[bold cyan]ℹ[/bold cyan]" if supports_unicode() else "[bold cyan][INFO][/bold cyan]"
    console.print(f"{prefix} {message}")

def print_logo():
    # Use standard ASCII art to prevent encoding errors on cp1252
    logo = r"""
   [bold #6366f1]   _                  ___           _                  _ 
  /_\  __  _____ _ _  | _ \_ _ ___ _| |_ ___  __ ___ | |
 / _ \ \ \/ / _ \ ' \ |  _/ '_/ _ \  _| / _ \/ _/ _ \| |
/_/ \_\/_/\_\___/_||_||_| |_| \___/\__|_\___/\__\___/|_|[/bold #6366f1]
    """
    console.print(logo)

def print_table(title: str, headers: List[str], rows: List[List[str]]):
    # Set safe border style if unicode not supported
    border_style = "#3b82f6"
    box_type = None if supports_unicode() else "ASCII"
    
    table = Table(
        title=f"[bold #a855f7]{title}[/bold #a855f7]",
        show_header=True,
        header_style="bold #818cf8",
        border_style=border_style
    )
    
    # If unicode is not supported, rich uses ascii borders automatically if we tell it to.
    # But Table doesn't have box_type parameter directly, instead we import Box from rich.box.
    if not supports_unicode():
        from rich.box import ASCII
        table.box = ASCII

    for header in headers:
        table.add_column(header)
    for row in rows:
        table.add_row(*row)
    console.print(table)

def print_json_pretty(data: Any):
    if isinstance(data, (dict, list)):
        json_str = json.dumps(data)
    else:
        json_str = str(data)
    console.print(JSON(json_str))

def print_panel(title: str, content: str, subtitle: str = None, border_style: str = "#6366f1"):
    panel = Panel(
        content,
        title=f"[bold #a855f7]{title}[/bold #a855f7]",
        subtitle=subtitle,
        border_style=border_style,
        expand=False
    )
    if not supports_unicode():
        from rich.box import ASCII
        panel.box = ASCII
    console.print(panel)
