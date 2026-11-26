#!/usr/bin/env python3
"""Append news items to data/news.json, skipping URLs already present.

Usage: python3 scripts/add_news.py new_items.json
new_items.json is a JSON array of objects with:
  date (YYYY-MM-DD), category (ai|world|tech|economy), title, summary, source, url
"""
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data" / "news.json"
CATEGORIES = {"ai", "world", "tech", "economy"}
REQUIRED = ("date", "category", "title", "summary", "source", "url")


def load():
    if DATA.exists():
        return json.loads(DATA.read_text(encoding="utf-8"))
    return {"updatedAt": None, "items": []}


def validate(item):
    missing = [k for k in REQUIRED if not str(item.get(k, "")).strip()]
    if missing:
        raise ValueError(f"missing {missing}: {item.get('title')}")
    if item["category"] not in CATEGORIES:
        raise ValueError(f"bad category {item['category']}: {item['title']}")
    item["date"] = datetime.strptime(item["date"], "%Y-%m-%d").strftime("%Y-%m-%d")
    if not item["url"].startswith(("http://", "https://")):
        raise ValueError(f"bad url: {item['url']}")


def main(path):
    new_items = json.loads(Path(path).read_text(encoding="utf-8"))
    db = load()
    seen = {i["url"] for i in db["items"]}
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    added = 0
    for item in new_items:
        item = {k: v.strip() if isinstance(v := item.get(k), str) else "" for k in REQUIRED}
        validate(item)
        if item["url"] in seen:
            continue
        seen.add(item["url"])
        db["items"].append({
            "id": hashlib.sha1(item["url"].encode()).hexdigest()[:12],
            **item,
            "addedAt": now,
        })
        added += 1
    db["items"].sort(key=lambda i: (i["date"], i["addedAt"]), reverse=True)
    db["updatedAt"] = now
    DATA.parent.mkdir(exist_ok=True)
    tmp = DATA.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(db, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    tmp.replace(DATA)
    print(f"added {added}, skipped {len(new_items) - added}, total {len(db['items'])}")


if __name__ == "__main__":
    main(sys.argv[1])
