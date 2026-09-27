"""Experimental, stateless selector for a verified v4 commute pair.

This proves deterministic text selection locally. It does not prove that
ChatGPT Live can invoke Python or speak the selected text verbatim.
"""

import argparse
import hashlib
import json
from pathlib import Path


def select_playback(main, reference, expected_filename, position=None):
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

    if position is None:
        return sweep
    if type(position) is not int or not 1 <= position <= len(items):
        raise ValueError("position outside verified queue")
    return items[position - 1]["item_playback"]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--playback", required=True, type=Path)
    parser.add_argument("--reference", required=True, type=Path)
    selection = parser.add_mutually_exclusive_group(required=True)
    selection.add_argument("--sweep", action="store_true")
    selection.add_argument("--position", type=int)
    args = parser.parse_args()
    try:
        playback = json.loads(args.playback.read_text(encoding="utf-8"))
        reference = json.loads(args.reference.read_text(encoding="utf-8"))
        result = select_playback(playback, reference, args.playback.name, args.position)
    except (OSError, json.JSONDecodeError, TypeError, AttributeError, ValueError) as error:
        parser.exit(2, f"playback selection failed: {error}\n")
    print(result)


if __name__ == "__main__":
    main()
