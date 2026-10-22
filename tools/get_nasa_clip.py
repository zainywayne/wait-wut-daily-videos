#!/usr/bin/env python3
"""usage: get_nasa_clip.py "<search query>" [name]  -> lists matches; with a nasa_id as name arg 2 form: get_nasa_clip.py --id <nasa_id> <out_name>
Downloads NASA (public domain) video to $SHORTS_DIR/clips/<out_name>.mp4"""
import json, os, sys, urllib.parse, urllib.request
WORK = os.environ.get("SHORTS_DIR", "/home/claude/shorts_work")
def get(u): return json.load(urllib.request.urlopen(u, timeout=30))
if sys.argv[1] == "--id":
    nid, name = sys.argv[2], sys.argv[3]
    d = get("https://images-api.nasa.gov/asset/" + urllib.parse.quote(nid))
    urls = [i["href"] for i in d["collection"]["items"] if i["href"].lower().endswith(".mp4")]
    pick = next((u for u in urls if "medium" in u), None) or next((u for u in urls if "mobile" in u), None) or urls[0]
    u = urllib.parse.quote(pick.replace("http://", "https://"), safe=":/%")
    out = f"{WORK}/clips/{name}.mp4"
    with urllib.request.urlopen(u, timeout=300) as r, open(out, "wb") as f:
        while (b := r.read(1 << 20)): f.write(b)
    print("saved", out, os.path.getsize(out))
else:
    d = get("https://images-api.nasa.gov/search?media_type=video&q=" + urllib.parse.quote(sys.argv[1]))
    for it in d["collection"]["items"][:15]:
        m = it["data"][0]; print(m["nasa_id"], "|", m["title"][:80], "|", m.get("date_created", "")[:10])
