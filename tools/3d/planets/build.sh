set -e
O=/home/claude/shorts_work/out/planets
mkdir -p $O
(cd segA && node render.js $O/a.mp4)
(cd segC && node render.js $O/c.mp4)
(cd segD && node render.js $O/d.mp4)
(cd segB && node render.js $O/b.mp4)
printf "file '$O/a.mp4'\nfile '$O/c.mp4'\nfile '$O/d.mp4'\nfile '$O/b.mp4'\n" > $O/list.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i $O/list.txt -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -b:a 160k /home/claude/shorts_work/out/choose_planet.mp4
echo DONE
