#!/usr/bin/python3
import argparse
import json

def main():
    p = argparse.ArgumentParser()
    p.add_argument('-i', '--in-file', type=argparse.FileType('rb'), default='-')
    p.add_argument('-o', '--out-file', type=argparse.FileType('w', encoding='utf-8'), default='-')
    args = p.parse_args()

    points = json.load(args.in_file)
    for p in points:
        print(f'"{p["name"]}",{p["lat"]},{p["lon"]}', file=args.out_file)


if __name__ == "__main__":
    main()
