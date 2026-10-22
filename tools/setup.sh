#!/bin/bash
# one-time setup per fresh session: installs deps, downloads voice model + font
set -e
export SHORTS_DIR=${SHORTS_DIR:-/home/claude/shorts_work}
mkdir -p $SHORTS_DIR/tts $SHORTS_DIR/clips $SHORTS_DIR/out
pip install -q --break-system-packages kokoro-onnx soundfile pillow numpy
cd $SHORTS_DIR/tts
[ -s kokoro-v1.0.onnx ] || curl -fsSL -o kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
[ -s voices-v1.0.bin ] || curl -fsSL -o voices-v1.0.bin https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
[ -s $SHORTS_DIR/Poppins-Bold.ttf ] || curl -fsSL -o $SHORTS_DIR/Poppins-Bold.ttf https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Bold.ttf
which ffmpeg >/dev/null && echo "setup ok"
