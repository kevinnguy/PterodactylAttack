#!/bin/sh

for i in $(seq 0 17)
do
	j=$(printf '%02d' $i)
	./colorblend.py $j.svg FFFFFF 0.7 > $j.white.svg
	./colorblend.py $j.svg FF0000 0.7 > $j.red.svg
	cp $j.svg.json $j.white.svg.json
	cp $j.svg.json $j.red.svg.json
done
