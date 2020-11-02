#!/usr/bin/python3
import argparse
import json

import gpxpy


def main():
    p = argparse.ArgumentParser()
    p.add_argument('-i', '--in-file', type=argparse.FileType('rb'), default='-')
    p.add_argument('-o', '--out-file', type=argparse.FileType('w', encoding='utf-8'), default='-')
    args = p.parse_args()

    gpx = gpxpy.parse(args.in_file)
    points = [{'name': wp.name, 'lat': wp.latitude, 'lon': wp.longitude} for wp in gpx.waypoints]

    json.dump(points, args.out_file, indent=2, separators=(',', ': '), ensure_ascii=False)


if __name__ == "__main__":
    main()
