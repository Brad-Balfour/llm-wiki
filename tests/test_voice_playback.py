import importlib.util
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

    def test_begin_next_previous_repeat_and_jump_use_literal_strings(self):
        self.assertEqual(
            module.select_playback(self.main, "begin"),
            self.main["sweep_playback"],
        )
        self.assertEqual(
            module.select_playback(self.main, "next", 0),
            self.main["items"][0]["item_playback"],
        )
        self.assertEqual(
            module.select_playback(self.main, "previous", 2),
            self.main["items"][0]["item_playback"],
        )
        self.assertEqual(
            module.select_playback(self.main, "repeat", 1),
            self.main["items"][0]["item_playback"],
        )
        self.assertEqual(
            module.select_playback(self.main, "jump", 0, 2),
            self.main["items"][1]["item_playback"],
        )
        self.assertEqual(
            module.select_playback(self.main, "next", 2),
            "Finished.",
        )

    def test_rejects_invalid_navigation(self):
        with self.assertRaises(ValueError):
            module.select_playback(self.main, "jump", 0, 3)
        with self.assertRaises(ValueError):
            module.select_playback(self.main, "jump", 0, 0)
        with self.assertRaises(ValueError):
            module.select_playback(self.main, "next", 3)
        with self.assertRaises(ValueError):
            module.select_playback(self.main, "unknown")


if __name__ == "__main__":
    unittest.main()
