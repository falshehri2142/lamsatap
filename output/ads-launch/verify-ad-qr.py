"""Read-only verification: each of exactly three ads must decode the real site URL.

Usage: python verify-ad-qr.py general.png restaurants.png hosts.png
No image files are written or changed. Resampling/crops exist only in memory.
Exit 1 means an unreadable QR, wrong URL, or missing image; exit 0 requires all 3.
"""

import argparse
import json
import sys
from pathlib import Path

import cv2
import numpy as np

TARGET = "https://lamsatap.com"


def decode(detector, image):
    found = set()
    try:
        ok, values, *_ = detector.detectAndDecodeMulti(image)
        if ok:
            found.update(value for value in values if value)
    except cv2.error:
        pass
    try:
        value, *_ = detector.detectAndDecode(image)
        if value:
            found.add(value)
    except cv2.error:
        pass
    return found


def verify(path):
    image = cv2.imdecode(np.frombuffer(path.read_bytes(), dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Could not read image")
    detector = cv2.QRCodeDetector()
    found = set()
    height, width = image.shape[:2]
    for scale in (1.0, 0.5, 2.0):
        if max(height, width) * scale > 4096:
            continue
        sample = image if scale == 1 else cv2.resize(
            image, None, fx=scale, fy=scale,
            interpolation=cv2.INTER_AREA if scale < 1 else cv2.INTER_CUBIC,
        )
        found.update(decode(detector, sample))
    if TARGET not in found:
        # A phone scan isolates the QR from surrounding text and photographs.
        # Overlapping third-sized regions approximate that without changing a file.
        crop_width, crop_height = width // 3, height // 3
        for y in range(0, height - crop_height + 1, max(1, crop_height // 2)):
            for x in range(0, width - crop_width + 1, max(1, crop_width // 2)):
                sample = image[y:y + crop_height, x:x + crop_width]
                scale = max(1.0, 720 / min(sample.shape[:2]))
                if scale > 1:
                    sample = cv2.resize(sample, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
                found.update(decode(detector, sample))
    return {
        "file": str(path.resolve()),
        "expected": TARGET,
        "decoded": sorted(found),
        "pass": found == {TARGET},
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("images", nargs=3, type=Path)
    args = parser.parse_args()
    results = []
    for path in args.images:
        try:
            result = verify(path)
        except (OSError, ValueError, cv2.error) as error:
            result = {"file": str(path), "expected": TARGET, "decoded": [], "pass": False, "error": str(error)}
        results.append(result)
        print(json.dumps(result, ensure_ascii=True), flush=True)
    return 0 if all(result["pass"] for result in results) else 1


if __name__ == "__main__":
    sys.exit(main())
