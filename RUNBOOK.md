# Daily short runbook (channel: wait wut daily, UCHdEWN_oWm78deTg2d0Q-Ow)

Goal: make and publish ONE new vertical short per run, public, using only free tools. Runs happen twice a day. Footage is NASA public domain only (until a Pexels key exists). QUALITY GATES BELOW ARE MANDATORY: if you cannot pass them with reasonable effort, do NOT publish; report what failed instead.

## Steps
0. (Posting is done separately by the 3:30am run using tools/next_post.py. This runbook only PRODUCES a short for the buffer.)
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
7. ADD TO BUFFER (do NOT upload here): copy mp4 to `videos/<slug>.mp4` and write `videos/<slug>.json` (the script plus `yt_title`, `yt_description` with "Footage: NASA" and hashtags, `yt_tags`). Mark the topic [x] in `topics.md`. `git pull`, commit, push. The next 3:30am run posts it.
8. LEAN: keep usage low. At most 2 preview rounds and 2 render rounds; read each contact sheet once; no narration between steps; final report is 2 lines.

## QUALITY RULES v2 (Zain asked for much better shorts, 2026-10-30) - mandatory
- FOOTAGE MUST SHOW WHAT IS BEING SAID. preview_shots.py prints the spoken line under every shot: go through the sheet line by line and replace any shot whose picture does not match its words (Zain rejected a short for this). Every scene gets its own NASA search for its subject (satellites -> "satellite orbit", power grid/blackout -> "city lights night ISS", auroras -> "aurora ISS", oceans -> "ocean from space", ice -> "Antarctica ice", storms -> "hurricane from space"). Never fill more than 40% of a short with the same subject (e.g. close-ups of the Sun). Download 10-14 clips covering the different subjects in the script.
- 25-32 seconds, 8-10 scenes. Every sentence under 12 words. Cut anything that sounds like a lecture.
- HOOK: scene 1 is one shocking present-tense line, under 8 words, with a `flash` word.
- `flash` on 3-4 scenes total (hook, the turn, the twist, the biggest number). One word or a number, max 10 characters.
- LOOP ENDING: the last line must flow back into the first so the replay feels seamless (e.g. last: "...and that is exactly what happens when" -> first: "Tonight, the Sun becomes a black hole."). No "comment what should vanish next".
- Title for YouTube: the hook line + #shorts, under 60 chars. Description: one line + "Footage: NASA" + 4 hashtags.

## Known problems
- Composio's YouTube quota is shared; a 429 "Video Uploads per day" means retry later (quota resets 3:00am Toronto). Do not loop. Keep the rendered video in `videos/` and report; step 0 uploads it on the next run.
- Never put anything in the video that implies NASA endorsement.
- Past failures to avoid: same globe at start and end, 5 clips stretched over 11 scenes, shots held 5+ seconds, text banners and graph overlays from NASA clips, talking-head interview windows.
