# -*- coding: utf-8 -*-
"""Load/save content for admin-editable data."""
import json
import os

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
CONTENT_FILE = os.path.join(DATA_DIR, "content.json")


def _ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)


def load_content():
    """Load full content dict. Returns defaults if file missing."""
    if not os.path.isfile(CONTENT_FILE):
        return _default_content()
    try:
        with open(CONTENT_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return _default_content()


def save_content(data):
    """Save full content dict to JSON."""
    _ensure_data_dir()
    with open(CONTENT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def _default_content():
    return {
        "about": "",
        "documents": [],
        "programs": [],
        "requisites": {},
    }
