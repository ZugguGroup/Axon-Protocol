import click
from axon_cli.http import AxonHttpClient
from axon_cli.display import print_success, print_info, print_table, print_panel

@click.group()
def memory():
    """Manage vector memory storage and retrieval."""
    pass

@memory.command("store")
@click.argument("content")
@click.option("-t", "--tag", multiple=True, help="Custom tags to attach to the memory (e.g. -t priority=high)")
@click.option("-s", "--scope", default="project", help="Scope of the memory (e.g. project, agent) (default: project)")
@click.option("--ttl", type=int, help="Time to live in seconds (optional)")
def store(content, tag, scope, ttl):
    """Store a memory in the Axon server."""
    client = AxonHttpClient()
    if not client.api_key:
        raise click.ClickException("No API key configured. Run 'axon init' or 'axon agent register'.")

    tags = {}
    for item in tag:
        if "=" in item:
            k, v = item.split("=", 1)
            tags[k.strip()] = v.strip()
        else:
            tags[item.strip()] = True

    payload = {
        "content": content,
        "scope": scope,
    }
    if tags:
        payload["tags"] = tags
    if ttl is not None:
        payload["ttl"] = ttl

    print_info("Storing memory...")
    res = client.post("/v1/memory/store", json=payload)
    
    print_success(f"Memory stored successfully!")
    print_info(f"ID: {res['id']}")
    print_info(f"Created At: {res['created_at']}")

@memory.command("search")
@click.argument("query")
@click.option("-l", "--limit", type=int, default=10, help="Max number of results (default: 10)")
@click.option("-m", "--min-similarity", type=float, default=0.5, help="Minimum cosine similarity threshold (default: 0.5)")
@click.option("-s", "--scope", help="Search scope filter")
def search(query, limit, min_similarity, scope):
    """Semantically search stored memories."""
    client = AxonHttpClient()
    if not client.api_key:
        raise click.ClickException("No API key configured. Run 'axon init' or 'axon agent register'.")

    payload = {
        "query": query,
        "limit": limit,
        "min_similarity": min_similarity,
    }
    if scope:
        payload["scope"] = scope

    print_info(f"Searching memories for '{query}'...")
    res = client.post("/v1/memory/search", json=payload)
    results = res.get("results", [])
    
    if not results:
        print_info("No matching memories found.")
        return

    headers = ["Similarity", "Content", "Tags", "Scope", "Created At"]
    rows = []
    for r in results:
        tags_str = ", ".join(f"{k}={v}" for k, v in r.get("tags", {}).items()) or "None"
        rows.append([
            f"{r['similarity']:.4f}",
            r["content"],
            tags_str,
            r["scope"],
            r["created_at"][:19]
        ])
        
    print_table(f"Search Results for '{query}'", headers, rows)

@memory.command("list")
@click.option("-l", "--limit", type=int, default=50, help="Max number of results (default: 50)")
def list_memories(limit):
    """List recently stored memories in the current project."""
    client = AxonHttpClient()
    if not client.api_key:
        raise click.ClickException("No API key configured. Run 'axon init' or 'axon agent register'.")

    print_info("Listing memories...")
    res = client.get("/v1/memory/list", params={"limit": limit})
    memories = res.get("memories", [])
    
    if not memories:
        print_info("No memories found.")
        return

    headers = ["ID", "Content", "Tags", "Scope", "Created At"]
    rows = []
    for m in memories:
        tags_str = ", ".join(f"{k}={v}" for k, v in m.get("tags", {}).items()) or "None"
        rows.append([
            m["id"],
            m["content"][:60] + ("..." if len(m["content"]) > 60 else ""),
            tags_str,
            m["scope"],
            m["created_at"][:19]
        ])
        
    print_table("Recent Memories", headers, rows)

@memory.command("delete")
@click.argument("memory_id")
def delete(memory_id):
    """Delete a memory permanently by its ID."""
    client = AxonHttpClient()
    if not client.api_key:
        raise click.ClickException("No API key configured. Run 'axon init' or 'axon agent register'.")

    print_info(f"Deleting memory {memory_id}...")
    res = client.delete(f"/v1/memory/{memory_id}")
    if res.get("deleted"):
        print_success(f"Memory {memory_id} deleted successfully.")
    else:
        print_error(f"Failed to delete memory {memory_id}.")
