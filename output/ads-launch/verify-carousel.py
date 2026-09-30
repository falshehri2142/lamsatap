"""Read-only final carousel check: no QR in first two ads, exact site QR in third.

Usage: python verify-carousel.py [path/to/final-carousel-v2]
No image files are changed. Missing images, QR-like detections in the first two,
or a missing/incorrect URL in the final ad produce a nonzero exit status.
"""

import argparse
import hashlib
import importlib.util
import json
import sys
from pathlib import Path

import cv2
import numpy as np

SCRIPT_DIR = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("ad_qr_verifier", SCRIPT_DIR / "verify-ad-qr.py")
QR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(QR)


def detected_qr_regions(path):
    image = cv2.imdecode(np.frombuffer(path.read_bytes(), dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Could not read image")
    detector = cv2.QRCodeDetector()
    counts = []
    for scale in (1.0, 0.5, 2.0):
        if max(image.shape[:2]) * scale > 4096:
            continue
        sample = image if scale == 1 else cv2.resize(
            image, None, fx=scale, fy=scale,
            interpolation=cv2.INTER_AREA if scale < 1 else cv2.INTER_CUBIC,
        )
        ok, corners = detector.detectMulti(sample)
        counts.append(len(corners) if ok and corners is not None else 0)
        ok_single, corners_single = detector.detect(sample)
        counts.append(1 if ok_single and corners_single is not None else 0)
    return max(counts, default=0)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("folder", nargs="?", type=Path, default=SCRIPT_DIR / "final-carousel-v2")
    args = parser.parse_args()
    results = []
    entries = (
        ("01-restaurants.png", False),
        ("02-hosts.png", False),
        ("03-general-qr.png", True),
    )
    for filename, expects_qr in entries:
        path = args.folder / filename
        result = {"file": str(path.resolve()), "expected": QR.TARGET if expects_qr else "no QR", "pass": False}
        try:
            scan = QR.verify(path)
            result["decoded"] = scan["decoded"]
            result["sha256"] = hashlib.sha256(path.read_bytes()).hexdigest()
            if expects_qr:
                result["pass"] = scan["pass"]
            else:
                result["detected_qr_regions"] = detected_qr_regions(path)
                result["pass"] = not scan["decoded"] and result["detected_qr_regions"] == 0
        except (OSError, ValueError, cv2.error) as error:
            result["error"] = str(error)
        results.append(result)
        print(json.dumps(result, ensure_ascii=True), flush=True)
    return 0 if all(item["pass"] for item in results) else 1


if __name__ == "__main__":
    sys.exit(main())
