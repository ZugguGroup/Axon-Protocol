import click
import json
from axon_cli.http import AxonHttpClient
from axon_cli.display import print_success, print_info, print_error, print_table

@click.group()
def message():
    """Manage agent-to-agent messaging."""
    pass

@message.command("send")
@click.argument("recipient_id", required=False)
@click.argument("text", required=False)
@click.option("--topic", help="Topic to publish the message to")
@click.option("--json", "json_payload", help="JSON string payload instead of plain text")
def send(recipient_id, text, topic, json_payload):
    """Send a message to an agent or publish to a topic."""
    if not recipient_id and not topic:
        raise click.ClickException("Must specify either recipient_id or --topic.")
        
    client = AxonHttpClient()
    if not client.api_key:
        raise click.ClickException("No API key configured. Run 'axon init'.")
        
    # Build payload
    payload_dict = {}
    if json_payload:
        try:
            payload_dict = json.loads(json_payload)
        except json.JSONDecodeError as e:
            raise click.ClickException(f"Invalid JSON payload: {str(e)}")
    elif text:
        payload_dict = {"text": text}
    else:
        payload_dict = {}

    req_body = {}
    if recipient_id:
        req_body["recipient_id"] = recipient_id
    if topic:
        req_body["topic"] = topic
    req_body["payload"] = payload_dict

    print_info("Sending message...")
    res = client.post("/v1/messages/send", json=req_body)
    
    print_success(f"Message sent successfully! ID: {res['message_id']}, Status: {res['status']}")

@message.command("inbox")
@click.option("--topic", help="Filter inbox by topic")
@click.option("--limit", default=50, help="Limit the number of messages to fetch")
def inbox(topic, limit):
    """Fetch and view unread messages in the inbox."""
    client = AxonHttpClient()
    if not client.api_key:
        raise click.ClickException("No API key configured. Run 'axon init'.")

    params = {"limit": limit}
    if topic:
        params["topic"] = topic

    print_info("Fetching messages from inbox...")
    res = client.get("/v1/messages/inbox", params=params)
    messages = res.get("messages", [])

    if not messages:
        print_info("Inbox is empty.")
        return

    headers = ["ID", "Sender ID", "Topic", "Payload", "Status", "Created At"]
    rows = []
    for m in messages:
        payload_str = str(m.get("payload", {}))
        if len(payload_str) > 40:
            payload_str = payload_str[:37] + "..."
        rows.append([
            m["id"],
            m["sender_id"],
            m.get("topic") or "N/A",
            payload_str,
            m["status"],
            m["created_at"]
        ])

    print_table("Agent Inbox", headers, rows)

@message.command("ack")
@click.argument("message_id")
def ack(message_id):
    """Acknowledge a received message."""
    client = AxonHttpClient()
    if not client.api_key:
        raise click.ClickException("No API key configured. Run 'axon init'.")

    print_info(f"Acknowledging message {message_id}...")
    res = client.post("/v1/messages/ack", params={"message_id": message_id})
    if res.get("acknowledged"):
        print_success(f"Message {message_id} acknowledged successfully.")
    else:
        print_error(f"Failed to acknowledge message {message_id}.")
