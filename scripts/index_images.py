import os, json
from pathlib import Path

assets_dir = Path("assets")
image_map = {}
for f in assets_dir.iterdir():
    if f.is_file() and f.suffix.lower() in [".webp", ".jpg", ".jpeg", ".png", ".avif", ".jfif"]:
        name = f.stem
        image_map[name] = f.name

with open("public/player_images.json", "w", encoding="utf-8") as f:
    json.dump(image_map, f, indent=2, ensure_ascii=False)

print(f"Mapped {len(image_map)} player images to public/player_images.json")
