"""Compares two folders of captures made by capture-windows.cjs: per window, the number of pixels
that differ and the box around them, the most changed first.

    python3 compare-captures.py <before> <after> [folder for the images of the differences]

With a third folder, each window that differs is saved there as it is after, what differs in
magenta over it. Needs Pillow (`pip install pillow`).
"""
import pathlib
import sys

from PIL import Image, ImageChops


def main():
    before, after = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
    marks = pathlib.Path(sys.argv[3]) if len(sys.argv) > 3 else None
    if marks:
        marks.mkdir(parents=True, exist_ok=True)
    rows = []
    for path in sorted(before.glob("*.png")):
        other = after / path.name
        if not other.exists():
            rows.append((float("inf"), path.name, "missing after"))
            continue
        one, two = Image.open(path).convert("RGB"), Image.open(other).convert("RGB")
        if one.size != two.size:
            rows.append((float("inf"), path.name, f"size {one.size} -> {two.size}"))
            continue
        difference = ImageChops.difference(one, two).convert("L").point(lambda value: 255 if value else 0)
        box = difference.getbbox()
        if not box:
            rows.append((0, path.name, ""))
            continue
        rows.append((difference.histogram()[255], path.name, str(box)))
        if marks:
            marked = two.copy()
            marked.paste((255, 0, 255), mask=difference)
            Image.blend(two, marked, 0.6).save(marks / path.name)
    added = sorted(path.name for path in after.glob("*.png") if not (before / path.name).exists())
    same = sum(1 for count, _, _ in rows if count == 0)
    print(f"{same} of {len(rows)} windows are the same")
    for count, name, note in sorted(rows, reverse=True):
        if count:
            print(f"{count:>9}  {name}  {note}")
    for name in added:
        print(f"      new  {name}")


main()
