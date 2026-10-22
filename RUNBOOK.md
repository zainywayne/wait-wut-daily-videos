# Daily short runbook (channel: wait wut daily, UCHdEWN_oWm78deTg2d0Q-Ow)

Goal: make and publish ONE new vertical short per run, public, using only free tools. Footage is NASA public domain only (until a Pexels key exists). Do not post if quality checks fail; report instead.

## Steps
1. Read `topics.md` (backlog) and `published.md` (log). Pick the first unused topic. Never repeat a topic.
2. `bash tools/setup.sh` (installs voice model, font). Set `export SHORTS_DIR=/home/claude/shorts_work`.
3. Find footage: `python3 tools/get_nasa_clip.py "<query>"` lists NASA videos; download 4-6 with `--id <nasa_id> <name>`. Build a contact sheet (ffmpeg frames every few seconds, PIL grid), LOOK at it, and choose clean segments: no baked-in text banners, no logos, no black frames. Clips can be reused within a video via `ss` offsets.
4. Write the script as JSON (see `example_moon.json`): title (hook, max ~6 words), voice "am_michael", 8-11 scenes, one sentence each, a new clip or offset per scene (cut every ~3s), `flash` punch word on 2-3 dramatic scenes. Style: open with a dramatic statement (not "What if"), short punchy beats, one twist, end with a loop or comment prompt. FACTS MUST BE ACCURATE; hedge anything uncertain ("could", "scientists think"). Target 28-40 seconds.
5. Render: `python3 -I tools/make_short.py script.json out/<slug>.mp4`. Check duration, extract ~6 frames and view them, check audio loudness with ffmpeg volumedetect. Fix problems before posting.
6. Publish:
   - copy mp4 to `videos/<slug>.mp4` in this repo, `git pull`, commit, push to main.
   - In the Composio workbench (session_id "what"; if no session, call COMPOSIO_SEARCH_TOOLS first for a new one): download `https://raw.githubusercontent.com/zainywayne/wait-wut-daily-videos/main/videos/<slug>.mp4` to local disk, `upload_local_file(path)` to get the s3key (render nothing heavy there; the workbench has ~1GB RAM and dies on rendering).
   - COMPOSIO_MULTI_EXECUTE_TOOL: YOUTUBE_MULTIPART_UPLOAD_VIDEO with title `<title> #shorts`, description (one line hook + "Footage: NASA" + hashtags), tags, categoryId "28", privacyStatus "public", videoFile {name, mimetype video/mp4, s3key}.
7. Append a line to `published.md` (date, topic, youtube id) and mark the topic used in `topics.md`; commit and push.
8. Report plainly to Zain: posted or not, link `https://youtube.com/shorts/<id>`, any problems.

## Known problems
- Composio's YouTube quota is shared; a 429 "Video Uploads per day" means retry tomorrow. Do not loop. Report it and keep the rendered video in `videos/` for the next run.
- Do not attempt to render in the Composio workbench.
- Never put anything in the video that implies NASA endorsement.
