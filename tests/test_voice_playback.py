import hashlib
import importlib.util
import json
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "chatgpt-project" / "voice-playback.py"
spec = importlib.util.spec_from_file_location("voice_playback", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class VoicePlaybackTest(unittest.TestCase):
    def setUp(self):
        self.main = {
            "sweep_playback": "1 of 2. Headline only. First 2 of 2. In depth. Second",
            "items": [
                {"item_playback": "1 of 2. Headline only. First"},
                {"item_playback": "2 of 2. In depth. Second Exact description."},
            ],
        }
        canonical = json.dumps(self.main, ensure_ascii=False, separators=(",", ":"))
        self.reference = {
            "queue_version": "tldr-commute-queue.v4",
            "main_filename": "20260925-tldr.txt",
            "main_sha256": "sha256:" + hashlib.sha256(canonical.encode()).hexdigest(),
            "total_items": 2,
            "items": [{"position": 1}, {"position": 2}],
        }

    def test_begin_next_previous_repeat_and_jump_use_literal_strings(self):
        self.assertEqual(
            module.select_playback(self.main, self.reference, "20260925-tldr.txt", "begin"),
            self.main["sweep_playback"],
        )
        self.assertEqual(
            module.select_playback(self.main, self.reference, "20260925-tldr.txt", "next", 0),
            self.main["items"][0]["item_playback"],
        )
        self.assertEqual(
            module.select_playback(self.main, self.reference, "20260925-tldr.txt", "previous", 2),
            self.main["items"][0]["item_playback"],
        )
        self.assertEqual(
            module.select_playback(self.main, self.reference, "20260925-tldr.txt", "repeat", 1),
            self.main["items"][0]["item_playback"],
        )
        self.assertEqual(
            module.select_playback(self.main, self.reference, "20260925-tldr.txt", "jump", 0, 2),
            self.main["items"][1]["item_playback"],
        )
        self.assertEqual(
            module.select_playback(self.main, self.reference, "20260925-tldr.txt", "next", 2),
            "Finished 20260925-tldr.txt.",
        )

    def test_rejects_wrong_file_hash_and_position(self):
        for change in ("filename", "hash", "position"):
            reference = json.loads(json.dumps(self.reference))
            if change == "filename":
                reference["main_filename"] = "other.txt"
            elif change == "hash":
                reference["main_sha256"] = "sha256:" + "0" * 64
            else:
                reference["items"][1]["position"] = 3
            with self.subTest(change=change), self.assertRaises(ValueError):
                module.select_playback(self.main, reference, "20260925-tldr.txt", "jump", 0, 2)
        with self.assertRaises(ValueError):
            module.select_playback(self.main, self.reference, "20260925-tldr.txt", "jump", 0, 3)


if __name__ == "__main__":
    unittest.main()
