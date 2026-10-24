# Daily short runbook (channel: wait wut daily, UCHdEWN_oWm78deTg2d0Q-Ow)

Goal: make and publish ONE new vertical short per run, public, using only free tools. Runs happen twice a day. Footage is NASA public domain only (until a Pexels key exists). QUALITY GATES BELOW ARE MANDATORY: if you cannot pass them with reasonable effort, do NOT publish; report what failed instead.

## Steps
0. PENDING CHECK FIRST: list `videos/*.mp4` and compare against `published.md`. Any video in `videos/` NOT logged in `published.md` is rendered-but-not-uploaded (usually a quota failure). If one exists, DO NOT make a new short: skip to step 7 and upload that one (use `yt_title`, `yt_description`, `yt_tags` from its matching .json), log it (step 8) and report. Only if nothing is pending, continue.
1. Read `topics.md` and `published.md`. Take the first unchecked topic in QUEUE. Never repeat a topic.
2. `bash tools/setup.sh` (voice model, font, deps). `export SHORTS_DIR=/home/claude/shorts_work`.
3. GATHER LOTS OF FOOTAGE (this is where past videos failed: too few clips, so shots repeated). Run `python3 tools/get_nasa_clip.py "<query>"` for 6+ different queries (sun/SDO, black hole visualizations, Earth from ISS, night Earth, aurora, Hubble, hurricanes/weather, planets, launches, Moon...) and download 10-14 DIFFERENT clips with `--id <nasa_id> <name>`. Prefer ISS/satellite/SDO real footage. Many NASA videos contain talking heads, charts, text banners and cartoon diagrams: you must reject those windows (step 5).
4. SCRIPT as JSON (see `example_script.json`, copy its structure):
   - CONTENT RULE (Zain's decision): every short is a WHAT IF scenario, never a fact lesson. Dramatic present-tense hook ("Tonight, Earth stops spinning."), escalating consequences, one real twist, comment prompt ending. Facts accurate; hedge speculation ("could", "scientists think"). 30-38 seconds, 9-12 scenes.
   - Each scene uses `"shots": [{"clip","ss"}, ...]`. EVERY SHOT MUST BE <= 3.3 SECONDS (aim 2.2-2.8s): a 6-second sentence needs 2-3 shots. Expect 15-20 shots total.
   - At least 8 different source clips per video. NEVER reuse a clip within 8 seconds of an earlier shot from the same clip, and never repeat the same picture (e.g. the same globe) at the start and end.
   - Optional per shot: `"x":0.3` shifts the crop left/right (0-1, default 0.5, centre), `"mode":"fit"` for the whole frame over a blur (rarely wanted). Default `fill` crops 16:9 to vertical.
5. PREVIEW EVERY SHOT before rendering: `python3 -I tools/preview_shots.py script.json sheet.png`, then LOOK at sheet.png (Read it). Every shot shows 4 frames across its window exactly as cropped. REJECT and replace any shot containing: people/interviews, text banners or lower-thirds, charts/graphs/axes, cartoon or CGI diagrams with labels, NASA logos, black frames, or a scene change mid-shot. Use a denser candidate preview to find clean windows (make a script with many one-shot scenes). Repeat until the whole sheet is clean. (The renderer already refuses to render if shots are too long, clips repeat, or fewer than 5 clips are used.)
6. RENDER: `python3 -I tools/make_short.py script.json out/<slug>.mp4`, then GATES: `python3 -I tools/check_video.py out/<slug>.mp4` must exit 0 (no repeated shots; if it flags a pair, look at both frames, fix the script and re-render unless it is a clear false positive); extract ~18 frames to a contact sheet and LOOK at it (title, captions, flash words, no overlays); `ffmpeg -af volumedetect` max volume should be below 0 dB. Budget: if three preview/render rounds still fail, simplify the idea or switch topics, do not publish junk.
7. PUBLISH:
   - copy mp4 to `videos/<slug>.mp4` and write `videos/<slug>.json` (the script plus `yt_title`, `yt_description` with "Footage: NASA" and hashtags, `yt_tags`). `git pull`, commit, push to main.
   - In the Composio workbench (session_id "what"; if no session, call COMPOSIO_SEARCH_TOOLS first): download `https://raw.githubusercontent.com/zainywayne/wait-wut-daily-videos/main/videos/<slug>.mp4` to local disk, `upload_local_file(path)` to get the s3key. NEVER render in the workbench: ~1GB RAM, it dies.
   - COMPOSIO_MULTI_EXECUTE_TOOL: YOUTUBE_MULTIPART_UPLOAD_VIDEO with title, description, tags, categoryId "28", privacyStatus "public", videoFile {name, mimetype video/mp4, s3key}.
8. Append a line to `published.md` (date | topic | youtube id) and mark the topic [x] in `topics.md`; commit and push.
9. Report plainly to Zain: posted or not, link `https://youtube.com/shorts/<id>`, any problems.

## Known problems
- Composio's YouTube quota is shared; a 429 "Video Uploads per day" means retry later (quota resets 3:00am Toronto). Do not loop. Keep the rendered video in `videos/` and report; step 0 uploads it on the next run.
- Never put anything in the video that implies NASA endorsement.
- Past failures to avoid: same globe at start and end, 5 clips stretched over 11 scenes, shots held 5+ seconds, text banners and graph overlays from NASA clips, talking-head interview windows.
