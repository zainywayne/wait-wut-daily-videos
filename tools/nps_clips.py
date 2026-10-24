#!/usr/bin/env python3
"""Find and download free NPS park footage for long-form videos.
  nps_clips.py list <parkCode>            candidate scenic clips (720p+, <=15 min) with ids
  nps_clips.py get <parkCode> <id> [...]  download chosen clips to $LONG_DIR/clips/c00.mp4, c01.mp4 ... (+ clips.json)
Uses api_key DEMO_KEY (30 requests/hour per IP): 'list' is ONE request, cache is reused by 'get'.
Footage: NPS credits only. Skip anything credited to an outside company (e.g. 'Media', 'Productions', 'Films').
"""
import json, os, re, subprocess, sys, urllib.request
LONG = os.environ.get("LONG_DIR", "/home/claude/longform")
cmd, park = sys.argv[1], sys.argv[2]
cache = f"/tmp/nps_{park}.json"
if not os.path.exists(cache):
    u = f"https://developer.nps.gov/api/v1/multimedia/videos?parkCode={park}&limit=500&api_key={os.environ.get('NPS_KEY','DEMO_KEY')}"
    json.dump(json.load(urllib.request.urlopen(u, timeout=120)), open(cache, "w"))
data = json.load(open(cache))["data"]
BAD = re.compile(r"interview|ranger talk|lecture|webinar|orientation|safety|reservation|podcast|presentation|junior|asl|audio desc|anniversary message|q&a", re.I)
COMPANY = re.compile(r"media|production|films|studios|llc|inc\b", re.I)
def best(v):
    h = sorted([x for x in v["versions"] if 720 <= x["heightPixels"] <= 1080], key=lambda x: x["heightPixels"])
    return h[-1] if h else None
if cmd == "list":
    for v in data:
        b = best(v); dur = (v.get("durationMs") or 0) / 1000
        if not b or dur > 900 or BAD.search(v["title"]) or COMPANY.search(v.get("credit") or ""): continue
        print(f"{v['id']} | {dur:5.0f}s | {b['heightPixels']}p | {'BROLL ' if v.get('isBRoll') else ''}{v['title'][:70]} | {(v.get('credit') or '')[:30]}")
elif cmd == "get":
    os.makedirs(LONG + "/clips", exist_ok=True)
    byid = {v["id"]: v for v in data}; out = []
    for i, vid in enumerate(sys.argv[3:]):
        v = byid[vid]; b = best(v); f = f"{LONG}/clips/c{i:02d}.mp4"
        subprocess.run(["curl", "-sS", "-m", "900", "-o", f, b["url"]], check=True)
        out.append({"file": f"c{i:02d}", "id": vid, "title": v["title"], "credit": v.get("credit")})
        print(f"c{i:02d}", v["title"][:60])
    json.dump(out, open(LONG + "/clips.json", "w"), indent=1)
