#!/bin/bash

# Converts all .wav files in the ./assets directory into .mp3 and .ogg files, for use on the web.

cd ./assets
FILES=./*.wav
for f in $FILES
do
  echo "Processing $f file..."
  filename="${f%.*}"
  # take action on each file. $f store current file name
  avconv -i $f -map 0:a $filename.ogg $filename.mp3
done