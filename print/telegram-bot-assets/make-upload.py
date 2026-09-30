# Build print/telegram-bot-assets/upload/: the 12 images the bot uses, each with a unique (w,h) <= 1280
# so the file_ids can be matched after the owner sends them to the bot.
import json, pathlib, sys
from PIL import Image

A = pathlib.Path(sys.argv[1]) / 'print/telegram-bot-assets'
U = A / 'upload'
U.mkdir(exist_ok=True)
for old in U.glob('*.jpg'):
    old.unlink()
PLAN = [
    ('welcome', 'posters/poster-brand.webp', 1180),
    ('food', 'posters/poster-food.webp', 1170),
    ('host', 'posters/poster-host.webp', 1160),
]
out, seen = [], set()
for i, (key, src, long_side) in enumerate(PLAN, 1):
    im = Image.open(A / src).convert('RGB')
    if long_side:
        k = long_side / max(im.size)
        im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    assert max(im.size) <= 1280 and im.size not in seen, (key, im.size)
    seen.add(im.size)
    name = f'{i:02d}-{key}.jpg'
    im.save(U / name, 'JPEG', quality=86, optimize=True)
    out.append({'file': name, 'key': key, 'width': im.width, 'height': im.height, 'source': f'print/telegram-bot-assets/{src}'})
    print(name, im.size)
json.dump(out, open(U / 'manifest.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
