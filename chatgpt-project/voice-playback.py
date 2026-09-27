"""Experimental, stateless selector for a verified v4 commute pair.

This proves deterministic text selection locally. It does not prove that
ChatGPT Live can invoke Python or speak the selected text verbatim.
"""

import argparse
import hashlib
import json
from pathlib import Path


def select_playback(main, reference, expected_filename, action, current_position=0, target_position=None):
    if list(main) != ["sweep_playback", "items"]:
        raise ValueError("invalid playback object shape")
    items = main["items"]
    if not isinstance(main["sweep_playback"], str) or not isinstance(items, list):
        raise ValueError("invalid playback fields")
    if reference.get("queue_version") != "tldr-commute-queue.v4":
        raise ValueError("reference is not v4")
    if reference.get("main_filename") != expected_filename:
        raise ValueError("reference names another playback file")
    if reference.get("total_items") != len(items) or len(reference.get("items", [])) != len(items):
        raise ValueError("playback/reference item counts differ")

    canonical = json.dumps(main, ensure_ascii=False, separators=(",", ":"))
    digest = "sha256:" + hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    if reference.get("main_sha256") != digest:
        raise ValueError("playback/reference hash mismatch")

    for index, (played, source) in enumerate(zip(items, reference["items"]), 1):
        if not isinstance(played, dict) or list(played) != ["item_playback"]:
            raise ValueError(f"invalid playback item {index}")
        if source.get("position") != index:
            raise ValueError(f"invalid reference position {index}")
        value = played["item_playback"]
        if not isinstance(value, str) or not value or "\n" in value or "\r" in value:
            raise ValueError(f"invalid playback text at position {index}")
    sweep = main["sweep_playback"]
    if "\n" in sweep or "\r" in sweep:
        raise ValueError("invalid sweep text")

    if type(current_position) is not int or not 0 <= current_position <= len(items):
        raise ValueError("current position outside verified queue")
    if action == "begin":
        return sweep
    if action == "next":
        position = current_position + 1
        if position > len(items):
            return f"Finished {expected_filename}."
    elif action == "previous":
        position = current_position - 1
        if position <= 0:
            return sweep
    elif action == "repeat":
        if current_position == 0:
            return sweep
        position = current_position
    elif action == "jump":
        position = target_position
    else:
        raise ValueError("unknown playback action")
    if type(position) is not int or not 1 <= position <= len(items):
        raise ValueError("target position outside verified queue")
    return items[position - 1]["item_playback"]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--playback", required=True, type=Path)
    parser.add_argument("--reference", required=True, type=Path)
    parser.add_argument("--action", required=True, choices=("begin", "next", "previous", "repeat", "jump"))
    parser.add_argument("--current-position", type=int, default=0)
    parser.add_argument("--target-position", type=int)
    args = parser.parse_args()
    try:
        playback = json.loads(args.playback.read_text(encoding="utf-8"))
        reference = json.loads(args.reference.read_text(encoding="utf-8"))
        result = select_playback(
            playback, reference, args.playback.name,
            args.action, args.current_position, args.target_position,
        )
    except (OSError, json.JSONDecodeError, TypeError, AttributeError, ValueError) as error:
        parser.exit(2, f"playback selection failed: {error}\n")
    print(result)


if __name__ == "__main__":
    main()
