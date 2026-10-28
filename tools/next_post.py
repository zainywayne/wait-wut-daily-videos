#!/usr/bin/env python3
"""Decide tonight's post and what (if anything) to produce for the buffer. Prints JSON.
Schedule (Zain): 3:30am Toronto, LONG on even days since 2026-10-25, SHORT on odd days.
Buffer = rendered files in videos/ (shorts) and longform/ (long) not listed in posted.txt."""
import datetime, glob, json, os, zoneinfo
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
posted = set(open(f"{R}/posted.txt").read().split())
today = datetime.datetime.now(zoneinfo.ZoneInfo("America/Toronto")).date()
want = "long" if (today - datetime.date(2026, 10, 25)).days % 2 == 0 else "short"
other = {"long": "short", "short": "long"}
buf = {"short": sorted(f for f in (os.path.relpath(p, R) for p in glob.glob(f"{R}/videos/*.mp4")) if f not in posted),
       "long": sorted(f for f in (os.path.relpath(p, R) for p in glob.glob(f"{R}/longform/*.mp4")) if f not in posted)}
post = None
for t in (want, other[want]):
    if buf[t]:
        f = buf[t].pop(0); slug = os.path.splitext(f)[0]
        meta = json.load(open(f"{R}/{slug}.json")) if os.path.exists(f"{R}/{slug}.json") else {}
        post = {"type": t, "file": f, "raw_url": f"https://raw.githubusercontent.com/zainywayne/wait-wut-daily-videos/main/{f}",
                "title": meta.get("yt_title"), "description": meta.get("yt_description"), "tags": meta.get("yt_tags", []),
                "categoryId": meta.get("categoryId", "19" if t == "long" else "28"),
                "thumbnail_url": f"https://raw.githubusercontent.com/zainywayne/wait-wut-daily-videos/main/{slug}_thumb.jpg" if t == "long" else None,
                "off_schedule": t != want}
        break
tomorrow = other[want]
make = tomorrow if not buf[tomorrow] else (want if not buf[want] else None)
post_after_make = False
if post is None:  # nothing ready tonight: make tonight's type and post it straight away
    make, post_after_make = want, True
print(json.dumps({"date": str(today), "scheduled_type": want, "post": post, "make": make, "post_after_make": post_after_make,
                  "buffer_after_post": {k: len(v) for k, v in buf.items()}}, indent=1))
