set -e
S=/home/claude/wait-wut-daily-videos/stored
seg() { # in out start dur
ffmpeg -loglevel error -y -ss $3 -t $4 -i $1 -filter_complex "[0:v]split[a][b];[a]scale=1920:-2,crop=1920:1080,boxblur=40:5,eq=brightness=-0.25[bg];[b]scale=-2:1080[fg];[bg][fg]overlay=(W-w)/2:0,fps=60,format=yuv420p[v];[0:a]aresample=48000,aformat=channel_layouts=stereo[a2]" -map "[v]" -map "[a2]" -c:v libx264 -preset veryfast -crf 20 -c:a aac -b:a 192k $2
}
cardv() { # png out dur
ffmpeg -loglevel error -y -loop 1 -t $3 -i $1 -f lavfi -t $3 -i anullsrc=r=48000:cl=stereo -vf "fps=60,format=yuv420p,fade=in:0:15,fade=out:st=$(python3 -c "print($3-0.25)"):d=0.25" -c:v libx264 -preset veryfast -crf 20 -c:a aac -b:a 192k -shortest $2
}
cardv c_intro.png v00.mp4 3.5
seg $S/bunker_part1.mp4 v01.mp4 0 55.6
cardv c_vote1.png v02.mp4 2.5
seg $S/bunker_part2_farm.mp4 v03.mp4 0 73.2
cardv c_vote2.png v04.mp4 2.5
seg $S/bunker_part3.mp4 v05.mp4 0 41.5
cardv c_vote3.png v06.mp4 2.5
seg $S/bunker_part4.mp4 v07.mp4 0 56.9
cardv c_vote4.png v08.mp4 2.5
seg $S/bunker_part5.mp4 v09.mp4 0 58.0
cardv c_vote5.png v10.mp4 2.5
seg $S/bunker_part6_finale.mp4 v11.mp4 0 76.3
cardv c_outro.png v12.mp4 6
ls v*.mp4 | sed "s/^/file '/;s/$/'/" > list.txt
ffmpeg -loglevel error -y -f concat -safe 0 -i list.txt -c copy still_down_there_full.mp4
ffprobe -v error -show_entries format=duration -of csv=p=0 still_down_there_full.mp4
