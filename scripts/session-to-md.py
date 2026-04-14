#!/usr/bin/env python3
"""
Convert a Claude Code session JSONL (+ subagent files) into a clean Markdown transcript.
Usage: python3 session-to-md.py <session_id> [output_path]
"""

import json
import sys
import os
import glob as globmod
from datetime import datetime

SESSION_BASE = os.path.expanduser(
    "~/.claude/projects/-Users-ethan-Documents-projects-final-exp"
)


def load_jsonl(path):
    """Load all JSON lines from a file."""
    lines = []
    with open(path, "r") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    lines.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    return lines


def ts_short(iso_ts):
    """Convert ISO timestamp to a readable short form."""
    try:
        dt = datetime.fromisoformat(iso_ts.replace("Z", "+00:00"))
        return dt.strftime("%H:%M:%S")
    except Exception:
        return iso_ts or ""


def format_tool_input(name, inp):
    """Format tool input nicely depending on tool type."""
    if name == "WebSearch":
        return f'Query: `{inp.get("query", "")}`'
    elif name == "WebFetch":
        url = inp.get("url", "")
        prompt = inp.get("prompt", "")
        return f"URL: {url}\nPrompt: {prompt}"
    elif name == "Read":
        return f'File: `{inp.get("file_path", "")}`'
    elif name == "Grep":
        pattern = inp.get("pattern", "")
        path = inp.get("path", "")
        return f'Pattern: `{pattern}`\nPath: `{path}`'
    elif name == "Glob":
        return f'Pattern: `{inp.get("pattern", "")}`'
    elif name == "Bash":
        return f'```bash\n{inp.get("command", "")}\n```'
    elif name == "Write":
        fp = inp.get("file_path", "")
        content = inp.get("content", "")
        if len(content) > 500:
            content = content[:500] + "\n... (truncated)"
        return f"File: `{fp}`\n```\n{content}\n```"
    elif name == "Edit":
        fp = inp.get("file_path", "")
        old = inp.get("old_string", "")
        new = inp.get("new_string", "")
        if len(old) > 300:
            old = old[:300] + "... (truncated)"
        if len(new) > 300:
            new = new[:300] + "... (truncated)"
        return f"File: `{fp}`\n**Old:**\n```\n{old}\n```\n**New:**\n```\n{new}\n```"
    elif name == "Task":
        desc = inp.get("description", "")
        prompt = inp.get("prompt", "")
        agent = inp.get("subagent_type", "")
        bg = inp.get("run_in_background", False)
        parts = [f"**Agent:** {agent}"]
        if desc:
            parts.append(f"**Description:** {desc}")
        if bg:
            parts.append("**Mode:** Background")
        if prompt:
            if len(prompt) > 800:
                prompt = prompt[:800] + "\n... (truncated)"
            parts.append(f"\n{prompt}")
        return "\n".join(parts)
    else:
        # Generic: dump as JSON
        s = json.dumps(inp, indent=2)
        if len(s) > 600:
            s = s[:600] + "\n... (truncated)"
        return f"```json\n{s}\n```"


def format_tool_result(content):
    """Format tool result content."""
    if isinstance(content, str):
        text = content
    elif isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict):
                if item.get("type") == "text":
                    parts.append(item.get("text", ""))
                elif item.get("type") == "image":
                    src = item.get("source", {})
                    if src.get("type") == "base64":
                        parts.append(f"[Image: {src.get('media_type', 'image')}]")
                    elif src.get("type") == "url":
                        parts.append(f"![Image]({src.get('url', '')})")
                    else:
                        parts.append("[Image]")
                elif item.get("type") == "tool_result":
                    inner = item.get("content", "")
                    if isinstance(inner, str):
                        parts.append(inner)
                    elif isinstance(inner, list):
                        for sub in inner:
                            if isinstance(sub, dict) and sub.get("type") == "text":
                                parts.append(sub.get("text", ""))
                else:
                    parts.append(json.dumps(item)[:400])
            else:
                parts.append(str(item))
        text = "\n".join(parts)
    else:
        text = str(content)

    # Truncate very long results
    if len(text) > 2000:
        text = text[:2000] + "\n\n... (result truncated for readability)"
    return text


def process_messages(records, subagent_data, indent_level=0):
    """Process JSONL records into markdown sections."""
    md_parts = []
    prefix = ""  # No indent for main, used for subagents

    # Track tool_use IDs to match with results
    pending_tools = {}  # tool_use_id -> (name, input)

    for rec in records:
        rec_type = rec.get("type")
        if rec_type == "queue-operation":
            continue

        msg = rec.get("message", {})
        role = msg.get("role", rec_type)
        content = msg.get("content", "")
        timestamp = ts_short(rec.get("timestamp", ""))
        agent_id = rec.get("agentId", "")

        if role == "user":
            # Check if this is a tool result or a human message
            if isinstance(content, str):
                md_parts.append(f"\n---\n\n### User `{timestamp}`\n\n{content}\n")
            elif isinstance(content, list):
                has_tool_result = any(
                    isinstance(c, dict)
                    and (c.get("type") == "tool_result" or "tool_use_id" in c)
                    for c in content
                )
                if has_tool_result:
                    for item in content:
                        if isinstance(item, dict):
                            tool_id = item.get("tool_use_id", "")
                            is_error = item.get("is_error", False)
                            result_content = item.get("content", "")
                            tool_name, tool_input = pending_tools.pop(
                                tool_id, ("Unknown", {})
                            )
                            result_text = format_tool_result(result_content)

                            status = "ERROR" if is_error else "Result"
                            md_parts.append(
                                f"\n> **{tool_name}** {status}:\n>\n"
                            )
                            for line in result_text.split("\n"):
                                md_parts.append(f"> {line}\n")
                            md_parts.append("\n")

                            # Check if this tool result triggers a subagent
                            tool_result_meta = rec.get("toolUseResult", {})
                            if isinstance(tool_result_meta, dict):
                                sub_agent_id = tool_result_meta.get("agentId", "")
                                if (
                                    sub_agent_id
                                    and sub_agent_id in subagent_data
                                ):
                                    md_parts.append(
                                        f"\n<details>\n<summary>Subagent: {tool_result_meta.get('description', sub_agent_id)}</summary>\n\n"
                                    )
                                    sub_md = process_messages(
                                        subagent_data[sub_agent_id],
                                        {},
                                        indent_level + 1,
                                    )
                                    md_parts.append(sub_md)
                                    md_parts.append("\n</details>\n\n")
                else:
                    # Regular user message with structured content
                    text_parts = []
                    for item in content:
                        if isinstance(item, dict) and item.get("type") == "text":
                            text_parts.append(item.get("text", ""))
                    if text_parts:
                        md_parts.append(
                            f"\n---\n\n### User `{timestamp}`\n\n{''.join(text_parts)}\n"
                        )

        elif role == "assistant":
            if isinstance(content, list):
                for item in content:
                    if isinstance(item, dict):
                        if item.get("type") == "text":
                            text = item.get("text", "").strip()
                            if text:
                                md_parts.append(
                                    f"\n### Assistant `{timestamp}`\n\n{text}\n"
                                )
                        elif item.get("type") == "tool_use":
                            tool_name = item.get("name", "Unknown")
                            tool_id = item.get("id", "")
                            tool_input = item.get("input", {})
                            pending_tools[tool_id] = (tool_name, tool_input)

                            formatted_input = format_tool_input(
                                tool_name, tool_input
                            )
                            md_parts.append(
                                f"\n#### Tool: `{tool_name}`\n\n{formatted_input}\n"
                            )
            elif isinstance(content, str) and content.strip():
                md_parts.append(
                    f"\n### Assistant `{timestamp}`\n\n{content}\n"
                )

    return "".join(md_parts)


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 session-to-md.py <session_id> [output_path]")
        sys.exit(1)

    session_id = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None

    main_jsonl = os.path.join(SESSION_BASE, f"{session_id}.jsonl")
    if not os.path.exists(main_jsonl):
        print(f"Session file not found: {main_jsonl}")
        sys.exit(1)

    # Load main session
    print(f"Loading main session: {main_jsonl}")
    main_records = load_jsonl(main_jsonl)

    # Load subagent files
    subagent_dir = os.path.join(SESSION_BASE, session_id, "subagents")
    subagent_data = {}
    if os.path.isdir(subagent_dir):
        for sa_file in sorted(globmod.glob(os.path.join(subagent_dir, "*.jsonl"))):
            basename = os.path.basename(sa_file)
            # Extract agent ID from filename like "agent-afced95.jsonl"
            agent_id = basename.replace("agent-", "").replace(".jsonl", "")
            print(f"Loading subagent: {agent_id} ({sa_file})")
            subagent_data[agent_id] = load_jsonl(sa_file)

    # Extract session metadata
    first_user = None
    session_start = None
    for rec in main_records:
        if rec.get("type") == "user" and isinstance(
            rec.get("message", {}).get("content"), str
        ):
            first_user = rec["message"]["content"]
            session_start = rec.get("timestamp", "")
            break

    # Build markdown
    md = []
    md.append(f"# Claude Code Session Transcript\n")
    md.append(f"**Session ID:** `{session_id}`\n")
    if session_start:
        try:
            dt = datetime.fromisoformat(session_start.replace("Z", "+00:00"))
            md.append(f"**Date:** {dt.strftime('%B %d, %Y at %H:%M UTC')}\n")
        except Exception:
            md.append(f"**Date:** {session_start}\n")
    md.append(f"**Subagents:** {len(subagent_data)}\n")
    md.append(f"**Total messages (main):** {len(main_records)}\n")
    md.append("")

    if first_user:
        md.append(f"## Topic\n\n{first_user[:300]}\n")

    md.append("\n---\n\n## Conversation\n")

    conversation_md = process_messages(main_records, subagent_data)
    md.append(conversation_md)

    full_md = "\n".join(md)

    if output_path:
        os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
        with open(output_path, "w") as f:
            f.write(full_md)
        print(f"\nWritten to: {output_path}")
        print(f"Size: {len(full_md):,} characters")
    else:
        print(full_md)


if __name__ == "__main__":
    main()
