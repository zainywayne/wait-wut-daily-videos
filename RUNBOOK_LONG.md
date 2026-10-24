# Long-form runbook (3-5 minute landscape video, NOT a Short)

Channel: wait wut daily (UCHdEWN_oWm78deTg2d0Q-Ow). Format: narrated aerial/scenic tour of a HIDDEN-GEM national park, built from free U.S. National Park Service footage. Reference example: `longform/sleeping_bear_dunes.json` (script + metadata) and its video. QUALITY GATES ARE MANDATORY: if you cannot pass them, do NOT publish; report what failed.

## Steps
0. PENDING CHECK FIRST: any `longform/*.mp4` whose name is not in a `LONG` line of `published.md` was rendered but never uploaded (usually a quota failure). If one exists, upload it (step 8, metadata from its matching `.json`, thumbnail `longform/<slug>_thumb.jpg`), log it (step 9) and report. Do not make a new video.
1. Pick the park: first unchecked line in `longform/parks.md`. Never famous parks (list at the top of that file). Never repeat a park.
2. Setup: `bash tools/setup.sh`; `export LONG_DIR=/home/claude/long_<parkCode>`; `mkdir -p $LONG_DIR/out`.
3. FOOTAGE: `python3 tools/nps_clips.py list <parkCode>` (one API request; DEMO_KEY allows only ~30/hour, so don't spam it). Choose 10-18 clips that sound scenic: B-roll, aerials, drone, timelapses, scenery, wildlife, waterfalls, coast, ice, lava. Avoid lectures, interviews, how-to, history talks, anything credited to an outside company. `python3 tools/nps_clips.py get <parkCode> <id> <id> ...` downloads them as c00, c01...
   Then `python3 -I tools/sheet_long.py` and LOOK at every sheet (Read the jpgs). Write down clean windows per clip: real landscape, no people in focus, no on-screen text or titles, no logos, no talking heads, no maps or diagrams, no black frames, no fades to black. You need roughly 50 clean shot windows of 4-5 s from at least 8 different clips. If you can't get there, mark the park `[skip: not enough footage]` in parks.md and go to the next park.
4. RESEARCH: before writing, search the web and read the park's NPS pages (nps.gov/<parkCode>) for facts. Every number and claim in the script must come from a source you read. Hedge anything uncertain. Keep a list of the source URLs.
5. SCRIPT: copy the structure of `longform/sleeping_bear_dunes.json`. ~520-620 words, 18-24 scenes, giving 3.3-4.5 minutes. Voice `bm_george`, speed 0.97.
   - Scene 1 is the HOOK, first 10 seconds: a surprising claim or question ("In 2011, Good Morning America viewers voted this the most beautiful place in America. Most people have never heard of it."). No "welcome to my channel".
   - Then escalate: where it is, what makes it unreal, a story or legend, one danger or surprising fact, seasons or light, wildlife, how few people visit. End with a comment question and "subscribe for more of America's hidden places".
   - Write for the ear: short sentences, numbers spelled out ("four hundred and fifty feet", "nineteen seventy").
   - Each scene's `shots` = list of {"clip": N, "ss": seconds}; scene time is split evenly across its shots. Match footage to narration (water when talking about the lake, etc.). Vary consecutive shots: don't put 3 similar-looking shots in a row.
   - `title` = park name (title card), `subtitle` = short hook line in caps.
   - Dry run: `python3 -I tools/make_long.py script.json $LONG_DIR/out/<slug>.mp4 --dry`. It refuses shots >8.5 s or <3 s, windows past the end of a clip, and any reuse of overlapping footage. Fix until it prints the plan line with no FIX list.
6. PREVIEW: `python3 -I tools/preview_long.py script.json $LONG_DIR/plan.jpg` and LOOK at it. Replace any shot with people, text, logos, dark or blown-out frames, or a cut/fade inside the window. Re-run dry + preview until clean.
7. RENDER: `python3 -I tools/make_long.py script.json $LONG_DIR/out/<slug>.mp4` (takes ~10-15 min; run it in the background and wait for it). Then CHECK: extract ~24 frames evenly to a contact sheet and LOOK (title card readable, no black bars, no bad shots); `ffmpeg -i <mp4> -af volumedetect -vn -f null -` max volume must be below 0 dB; file must be under 95 MB (GitHub limit) - if not, re-render with lower bitrate (edit -maxrate in make_long.py to 2400k).
   THUMBNAIL: `python3 -I tools/thumb_long.py <clip> <sec> "SMALL LINE" "BIG LINE" "Park Name" $LONG_DIR/thumb.jpg` using the most stunning frame; text like "THIS IS IN" / "MICHIGAN?!", or "NOBODY GOES" / "HERE". LOOK at it.
8. PUBLISH:
   - Copy to repo: `longform/<slug>.mp4`, `longform/<slug>_thumb.jpg`, `longform/<slug>.json` (script plus `yt_title`, `yt_description`, `yt_tags`, `categoryId` "19"). Title: curiosity-driven, under 90 chars, include the park name (e.g. "This Is in Michigan?! The Most Beautiful Place in America Nobody Talks About"). Description: 2-3 sentence hook, the comment question, then "Footage: U.S. National Park Service (public domain). This channel is not affiliated with or endorsed by the National Park Service." and "Narration: AI voice.", then 5-6 hashtags. 10-14 tags. `git pull`, commit, push.
   - Composio workbench (get a session via COMPOSIO_SEARCH_TOOLS if needed): curl -sSL the raw GitHub URL `https://raw.githubusercontent.com/zainywayne/wait-wut-daily-videos/main/longform/<slug>.mp4` to /home/user, `upload_local_file` to get an s3key. NEVER render in the workbench.
   - YOUTUBE_MULTIPART_UPLOAD_VIDEO: title, description, tags, categoryId "19", privacyStatus "public", videoFile {name, mimetype video/mp4, s3key}.
   - YOUTUBE_UPDATE_THUMBNAIL: videoId + raw GitHub URL of the thumbnail. A 403 means the channel isn't phone-verified: report it, don't retry.
9. LOG: append `YYYY-MM-DD | LONG | <park> | <videoId>` to `published.md`; move the park to DONE in `longform/parks.md`; commit and push.
10. REPORT to Zain: live or not, link `https://youtube.com/watch?v=<id>`, thumbnail set or not, sources used, any problems.

## Known problems
- 429 "Video Uploads per day": the YouTube quota is shared across Composio users; resets 3:00am Toronto. Do not loop. Leave the rendered video committed in `longform/`; step 0 uploads it next long-form run.
- NPS clips often have baked-in black bars; make_long.py crops them automatically. Some clips are flat/grey (log footage): prefer the colourful ones.
- Never imply NPS endorsement. Never use footage credited to outside companies.
