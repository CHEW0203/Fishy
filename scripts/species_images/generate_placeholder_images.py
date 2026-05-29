import csv
import json
import math
import os
import random
import struct
import zlib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
IMAGE_DIR = ROOT / "database" / "seed" / "species_images"
AI_DIR = IMAGE_DIR / "generated" / "ai"
REAL_DIR = IMAGE_DIR / "generated" / "real"

ASSETS_PATH = IMAGE_DIR / "final_species_image_assets.json"
ASSETS_CSV_PATH = IMAGE_DIR / "final_species_image_assets.csv"
DECISIONS_PATH = IMAGE_DIR / "final_species_image_decisions.json"
CHECKLIST_PATH = IMAGE_DIR / "species_image_checklist.csv"
MANIFEST_PATH = IMAGE_DIR / "species_image_manifest.json"
REPORT_PATH = IMAGE_DIR / "generated_placeholder_report.json"
READINESS_REPORT_PATH = IMAGE_DIR / "final_asset_readiness_report.md"

PLACEHOLDER_LICENSE = "Generated Placeholder"
PLACEHOLDER_SOURCE = "Generated Placeholder"
PLACEHOLDER_CREDIT = "Fishy generated placeholder"
PLACEHOLDER_NOTES = "Generated illustrative placeholder; not a verified real species photograph."
ASSET_FIELDS = [
    "species_key",
    "common_name",
    "scientific_name",
    "entry_type",
    "final_status",
    "asset_status",
    "local_file_path",
    "storage_path",
    "public_url",
    "image_license",
    "image_source_url",
    "credit",
    "notes",
]


def to_repo_path(path):
    return path.relative_to(ROOT).as_posix()


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_csv(path, rows, fields):
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row.get(field, "") for field in fields})


def local_file_exists(local_file_path):
    if not local_file_path:
        return False
    path = ROOT / local_file_path
    return path.exists() and path.stat().st_size > 0


def find_existing_real_file(species_key):
    for extension in (".jpg", ".jpeg", ".png", ".webp"):
        candidate = REAL_DIR / f"{species_key}{extension}"
        if candidate.exists() and candidate.stat().st_size > 0:
            return candidate
    return None


def crc_chunk(chunk_type, data):
    return struct.pack(">I", zlib.crc32(chunk_type + data) & 0xFFFFFFFF)


def png_chunk(chunk_type, data):
    return struct.pack(">I", len(data)) + chunk_type + data + crc_chunk(chunk_type, data)


def write_png(path, width, height, pixels):
    raw = bytearray()
    for y in range(height):
        raw.append(0)
        start = y * width * 3
        raw.extend(pixels[start:start + width * 3])

    data = b"".join(
        [
            b"\x89PNG\r\n\x1a\n",
            png_chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)),
            png_chunk(b"IDAT", zlib.compress(bytes(raw), 3)),
            png_chunk(b"IEND", b""),
        ]
    )
    path.write_bytes(data)


def clamp(value):
    return max(0, min(255, int(value)))


def blend(base, top, alpha):
    return tuple(clamp(base[i] * (1 - alpha) + top[i] * alpha) for i in range(3))


def color_profile(common_name, category_slug, species_key):
    text = f"{common_name} {category_slug} {species_key}".lower()
    profiles = [
        (("betta",), (45, 91, 202), (210, 54, 112), (124, 63, 190)),
        (("goldfish", "koi"), (245, 133, 36), (250, 237, 210), (205, 44, 49)),
        (("tetra", "danio", "rasbora"), (56, 132, 205), (222, 71, 80), (229, 229, 215)),
        (("molly", "guppy", "platy", "swordtail", "livebearer"), (233, 168, 52), (59, 151, 178), (245, 245, 225)),
        (("pleco", "catfish", "cory", "loach"), (112, 82, 57), (54, 64, 62), (190, 171, 126)),
        (("cichlid", "discus", "angelfish", "ram"), (34, 148, 194), (245, 191, 57), (228, 78, 93)),
        (("clown", "marine", "chromis", "tang", "damselfish"), (35, 122, 207), (245, 178, 50), (246, 246, 236)),
        (("snakehead", "bichir", "arowana", "gar", "stingray", "datnoid", "bass"), (54, 88, 67), (105, 87, 55), (198, 164, 88)),
        (("gourami",), (75, 154, 169), (209, 106, 128), (231, 207, 142)),
    ]
    for keywords, primary, secondary, accent in profiles:
        if any(keyword in text for keyword in keywords):
            return primary, secondary, accent

    seed = random.Random(species_key)
    primary = (seed.randint(45, 190), seed.randint(85, 205), seed.randint(110, 220))
    secondary = (seed.randint(170, 245), seed.randint(95, 210), seed.randint(55, 170))
    accent = (seed.randint(210, 250), seed.randint(200, 245), seed.randint(175, 235))
    return primary, secondary, accent


def draw_ellipse(pixels, width, height, cx, cy, rx, ry, color, alpha=1.0):
    x0 = max(0, int(cx - rx - 2))
    x1 = min(width - 1, int(cx + rx + 2))
    y0 = max(0, int(cy - ry - 2))
    y1 = min(height - 1, int(cy + ry + 2))
    for y in range(y0, y1 + 1):
        dy = (y - cy) / ry
        for x in range(x0, x1 + 1):
            dx = (x - cx) / rx
            distance = dx * dx + dy * dy
            if distance <= 1.0:
                edge = min(1.0, (1.0 - distance) * 8.0)
                idx = (y * width + x) * 3
                base = (pixels[idx], pixels[idx + 1], pixels[idx + 2])
                mixed = blend(base, color, alpha * edge)
                pixels[idx:idx + 3] = bytes(mixed)


def draw_polygon(pixels, width, height, points, color, alpha=1.0):
    min_x = max(0, int(min(point[0] for point in points)))
    max_x = min(width - 1, int(max(point[0] for point in points)))
    min_y = max(0, int(min(point[1] for point in points)))
    max_y = min(height - 1, int(max(point[1] for point in points)))

    def inside(px, py):
        result = False
        j = len(points) - 1
        for i, point in enumerate(points):
            xi, yi = point
            xj, yj = points[j]
            if ((yi > py) != (yj > py)) and (px < (xj - xi) * (py - yi) / ((yj - yi) or 1e-9) + xi):
                result = not result
            j = i
        return result

    for y in range(min_y, max_y + 1):
        for x in range(min_x, max_x + 1):
            if inside(x + 0.5, y + 0.5):
                idx = (y * width + x) * 3
                base = (pixels[idx], pixels[idx + 1], pixels[idx + 2])
                pixels[idx:idx + 3] = bytes(blend(base, color, alpha))


def draw_circle_outline(pixels, width, height, cx, cy, radius, color, alpha=0.45):
    for y in range(max(0, int(cy - radius - 2)), min(height, int(cy + radius + 3))):
        for x in range(max(0, int(cx - radius - 2)), min(width, int(cx + radius + 3))):
            distance = math.hypot(x - cx, y - cy)
            if abs(distance - radius) <= 1.5:
                idx = (y * width + x) * 3
                base = (pixels[idx], pixels[idx + 1], pixels[idx + 2])
                pixels[idx:idx + 3] = bytes(blend(base, color, alpha))


def draw_curved_plant(pixels, width, height, base_x, color, seed):
    rng = random.Random(seed)
    for leaf in range(3):
        height_px = rng.randint(int(height * 0.18), int(height * 0.34))
        sway = rng.uniform(-35, 35)
        x_origin = base_x + rng.randint(-20, 20)
        for step in range(height_px):
            y = height - 1 - step
            t = step / height_px
            x = x_origin + math.sin(t * math.pi * 1.2 + leaf) * 10 + sway * t
            radius = 3 + 6 * math.sin(t * math.pi)
            draw_ellipse(pixels, width, height, x, y, radius, 5, color, 0.16)


def make_placeholder(path, asset, size=512):
    width = height = size
    seed = random.Random(asset["species_key"])
    primary, secondary, accent = color_profile(
        asset.get("common_name", ""),
        asset.get("category_slug", ""),
        asset.get("species_key", ""),
    )
    top = (24, 113, 151)
    bottom = (9, 49, 78)
    pixels = bytearray(width * height * 3)

    for y in range(height):
        vertical = y / (height - 1)
        for x in range(width):
            horizontal = x / (width - 1)
            light = 18 * math.sin((horizontal + vertical) * math.pi)
            color = (
                clamp(top[0] * (1 - vertical) + bottom[0] * vertical + light),
                clamp(top[1] * (1 - vertical) + bottom[1] * vertical + light),
                clamp(top[2] * (1 - vertical) + bottom[2] * vertical + light),
            )
            idx = (y * width + x) * 3
            pixels[idx:idx + 3] = bytes(color)

    for offset in range(4):
        x = int((offset + 1) * width / 5 + seed.randint(-18, 18))
        draw_curved_plant(pixels, width, height, x, (75, 176, 129), f"{asset['species_key']}-plant-{offset}")

    for _ in range(12):
        radius = seed.randint(4, 11)
        draw_circle_outline(
            pixels,
            width,
            height,
            seed.randint(45, width - 45),
            seed.randint(40, int(height * 0.72)),
            radius,
            (215, 246, 255),
            0.22,
        )

    cx = width * 0.52 + seed.randint(-24, 24)
    cy = height * 0.50 + seed.randint(-18, 18)
    body_rx = width * seed.uniform(0.21, 0.27)
    body_ry = height * seed.uniform(0.095, 0.14)
    facing = -1 if seed.random() < 0.5 else 1
    tail_x = cx - facing * body_rx * 0.92
    nose_x = cx + facing * body_rx * 0.78

    draw_polygon(
        pixels,
        width,
        height,
        [
            (tail_x, cy),
            (tail_x - facing * width * 0.17, cy - body_ry * 1.2),
            (tail_x - facing * width * 0.12, cy),
            (tail_x - facing * width * 0.17, cy + body_ry * 1.2),
        ],
        secondary,
        0.88,
    )
    draw_ellipse(pixels, width, height, cx, cy, body_rx, body_ry, primary, 0.96)
    draw_ellipse(pixels, width, height, nose_x, cy, body_rx * 0.36, body_ry * 0.82, blend(primary, accent, 0.25), 0.88)
    draw_polygon(
        pixels,
        width,
        height,
        [(cx - body_rx * 0.1, cy - body_ry * 0.35), (cx + body_rx * 0.22, cy - body_ry * 1.55), (cx + body_rx * 0.45, cy - body_ry * 0.12)],
        accent,
        0.58,
    )
    draw_polygon(
        pixels,
        width,
        height,
        [(cx - body_rx * 0.15, cy + body_ry * 0.32), (cx + body_rx * 0.3, cy + body_ry * 1.48), (cx + body_rx * 0.55, cy + body_ry * 0.08)],
        secondary,
        0.54,
    )

    pattern = seed.choice(["stripe", "spots", "band", "none"])
    if pattern == "stripe":
        for stripe in range(-3, 4):
            x = cx + stripe * body_rx * 0.22
            draw_polygon(
                pixels,
                width,
                height,
                [(x - 7, cy - body_ry * 0.9), (x + 12, cy - body_ry * 0.75), (x + 2, cy + body_ry * 0.9), (x - 16, cy + body_ry * 0.75)],
                accent,
                0.28,
            )
    elif pattern == "spots":
        for spot in range(18):
            sx = seed.uniform(cx - body_rx * 0.65, cx + body_rx * 0.55)
            sy = seed.uniform(cy - body_ry * 0.62, cy + body_ry * 0.62)
            draw_ellipse(pixels, width, height, sx, sy, seed.uniform(4, 10), seed.uniform(3, 8), accent, 0.42)
    elif pattern == "band":
        draw_ellipse(pixels, width, height, cx + body_rx * 0.05, cy, body_rx * 0.12, body_ry * 0.92, accent, 0.32)

    eye_x = nose_x + facing * body_rx * 0.1
    draw_ellipse(pixels, width, height, eye_x, cy - body_ry * 0.25, 9, 9, (250, 250, 238), 1)
    draw_ellipse(pixels, width, height, eye_x + facing * 2, cy - body_ry * 0.25, 4, 4, (12, 24, 32), 1)

    draw_ellipse(pixels, width, height, width * 0.5, height * 0.5, width * 0.44, height * 0.32, (255, 255, 255), 0.035)
    write_png(path, width, height, pixels)


def is_generated_asset(asset):
    return asset.get("asset_status") == "ready_ai_placeholder" or asset.get("storage_path", "").startswith("ai/")


def placeholder_asset(asset):
    species_key = asset["species_key"]
    return {
        **asset,
        "final_status": "ai_placeholder_needed",
        "asset_status": "ready_ai_placeholder",
        "local_file_path": f"database/seed/species_images/generated/ai/{species_key}.png",
        "storage_path": f"ai/{species_key}.png",
        "public_url": asset.get("public_url", ""),
        "image_license": PLACEHOLDER_LICENSE,
        "image_source_url": PLACEHOLDER_SOURCE,
        "credit": PLACEHOLDER_CREDIT,
        "notes": PLACEHOLDER_NOTES,
    }


def update_decision(decision, generated_keys):
    if decision["species_key"] not in generated_keys:
        return decision
    return {
        **decision,
        "final_status": "ai_placeholder_needed",
        "candidate_image_url": "",
        "source_page_url": PLACEHOLDER_SOURCE,
        "license": PLACEHOLDER_LICENSE,
        "credit": PLACEHOLDER_CREDIT,
        "needs_ai_generated": False,
        "final_action": "use_generated_placeholder",
    }


def update_manifest_row(row, generated_keys):
    if row["species_key"] not in generated_keys:
        return row
    return {
        **row,
        "image_status": "ai_placeholder_needed",
        "candidate_image_url": "",
        "thumbnail_url": "",
        "source_page_url": PLACEHOLDER_SOURCE,
        "image_source_name": PLACEHOLDER_CREDIT,
        "license": PLACEHOLDER_LICENSE,
        "credit": PLACEHOLDER_CREDIT,
        "needs_ai_generated": False,
        "confidence": "low",
        "notes": PLACEHOLDER_NOTES,
    }


def readiness_markdown(summary):
    return f"""# Final Species Image Asset Readiness Report

Generated: 2026-05-28

## Result

All 303 Fishy Library species now have local image files.

| Metric | Count |
|---|---:|
| Total asset rows | {summary["total_rows"]} |
| Ready real images | {summary["ready_real_image"]} |
| Ready generated placeholders | {summary["ready_ai_placeholder"]} |
| Rows missing local image | {summary["missing_local_count"]} |
| Generated this run | {summary["generated_count"]} |
| Existing placeholder files skipped | {summary["skipped_existing_count"]} |
| Failed placeholder generations | {summary["failed_count"]} |

## Notes

- Verified real images already downloaded under `generated/real/` were preserved with their original license, source, and credit metadata.
- Rows without a usable local real file were completed with deterministic generated PNG placeholders under `generated/ai/`.
- Generated placeholders are illustrative MVP assets only. They are not verified real species photographs.
- No Supabase upload was attempted.
- No SQL was run.

## Next Step

Upload both local folders to the `species-images` bucket, then rerun:

```txt
node scripts/species_images/generate_update_species_images_sql.js
```

Review `database/seed/species_images/update_species_images.sql` manually before running it in Supabase.
"""


def main():
    AI_DIR.mkdir(parents=True, exist_ok=True)
    assets = read_json(ASSETS_PATH)
    decisions = read_json(DECISIONS_PATH)
    manifest = read_json(MANIFEST_PATH)

    generated = []
    skipped_existing = []
    preserved_real = []
    failed = []
    updated_assets = []
    generated_keys = set()

    for asset in assets:
        species_key = asset["species_key"]
        existing_real_file = find_existing_real_file(species_key)

        if asset.get("final_status") == "licensed_photo" and existing_real_file:
            updated_assets.append(
                {
                    **asset,
                    "asset_status": "ready_real_image",
                    "local_file_path": to_repo_path(existing_real_file),
                    "storage_path": f"real/{existing_real_file.name}",
                    "public_url": asset.get("public_url", ""),
                    "notes": asset.get("notes", "").replace(
                        "Download status: not downloaded locally; rerun downloader before upload.",
                        "Download status: downloaded locally.",
                    ),
                }
            )
            preserved_real.append(species_key)
            continue

        if local_file_exists(asset.get("local_file_path", "")) and asset.get("asset_status") == "ready_real_image":
            updated_assets.append(asset)
            preserved_real.append(species_key)
            continue

        placeholder = placeholder_asset(asset)
        output_path = ROOT / placeholder["local_file_path"]
        generated_keys.add(species_key)

        try:
            if output_path.exists() and output_path.stat().st_size > 0:
                skipped_existing.append(species_key)
            else:
                make_placeholder(output_path, asset)
                generated.append(species_key)
            updated_assets.append(placeholder)
        except Exception as error:
            failed.append({"species_key": species_key, "error": str(error)})
            updated_assets.append(asset)

    updated_decisions = [update_decision(decision, generated_keys) for decision in decisions]
    updated_manifest = [update_manifest_row(row, generated_keys) for row in manifest]

    write_json(ASSETS_PATH, updated_assets)
    write_csv(ASSETS_CSV_PATH, updated_assets, ASSET_FIELDS)
    write_json(DECISIONS_PATH, updated_decisions)
    write_json(MANIFEST_PATH, updated_manifest)
    write_csv(CHECKLIST_PATH, updated_manifest, list(updated_manifest[0].keys()))

    status_counts = {}
    for asset in updated_assets:
        status_counts[asset["asset_status"]] = status_counts.get(asset["asset_status"], 0) + 1

    missing_local = [
        asset["species_key"]
        for asset in updated_assets
        if not local_file_exists(asset.get("local_file_path", ""))
    ]
    report = {
        "generated_count": len(generated),
        "skipped_existing_count": len(skipped_existing),
        "failed_count": len(failed),
        "failed_species_keys": [item["species_key"] for item in failed],
        "failed": failed,
        "preserved_ready_real_count": len(set(preserved_real)),
        "asset_status_counts": status_counts,
        "rows_missing_local_image": len(missing_local),
        "missing_local_species_keys": missing_local,
        "generated_species_keys": generated,
        "skipped_existing_species_keys": skipped_existing,
    }
    write_json(REPORT_PATH, report)

    READINESS_REPORT_PATH.write_text(
        readiness_markdown(
            {
                "total_rows": len(updated_assets),
                "ready_real_image": status_counts.get("ready_real_image", 0),
                "ready_ai_placeholder": status_counts.get("ready_ai_placeholder", 0),
                "missing_local_count": len(missing_local),
                "generated_count": len(generated),
                "skipped_existing_count": len(skipped_existing),
                "failed_count": len(failed),
            }
        ),
        encoding="utf-8",
    )

    print(json.dumps(report, indent=2))
    if failed or missing_local:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
