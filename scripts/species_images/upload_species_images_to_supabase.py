import json
import mimetypes
import os
import time
import urllib.error
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
IMAGE_DIR = ROOT / "database" / "seed" / "species_images"
INPUT_PATH = IMAGE_DIR / "final_species_image_assets.json"
OUTPUT_PATH = IMAGE_DIR / "final_species_image_assets_uploaded.json"
PROGRESS_PATH = IMAGE_DIR / "python_upload_progress.json"
REPORT_PATH = IMAGE_DIR / "python_upload_report.json"
BUCKET = "species-images"
DEFAULT_DELAY_MS = 250


def read_json(path, fallback):
    if not path.exists():
        return fallback
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path, value):
    temp_path = path.with_suffix(path.suffix + ".tmp")
    with temp_path.open("w", encoding="utf-8") as handle:
        json.dump(value, handle, indent=2)
        handle.write("\n")
    temp_path.replace(path)


def get_env_config():
    supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("EXPO_PUBLIC_SUPABASE_URL")
    service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not service_role_key:
        raise RuntimeError(
            "Missing Supabase config. Set SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL, plus SUPABASE_SERVICE_ROLE_KEY."
        )

    return {
        "supabase_url": supabase_url.rstrip("/"),
        "service_role_key": service_role_key,
    }


def parse_positive_int(value, fallback=None):
    if value is None or value == "":
        return fallback
    try:
        parsed = int(value)
    except ValueError:
        return fallback
    return parsed if parsed > 0 else fallback


def upload_delay_seconds():
    delay_ms = parse_positive_int(os.environ.get("SPECIES_UPLOAD_DELAY_MS"), DEFAULT_DELAY_MS)
    return delay_ms / 1000


def upload_limit():
    return parse_positive_int(os.environ.get("SPECIES_UPLOAD_LIMIT"))


def request_json(url, method, config, body=None):
    headers = {
        "Authorization": f"Bearer {config['service_role_key']}",
        "apikey": config["service_role_key"],
    }
    data = None
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"

    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            response.read()
            return {"ok": True, "status": response.status, "body": ""}
    except urllib.error.HTTPError as error:
        body_text = error.read().decode("utf-8", errors="replace")
        return {"ok": False, "status": error.code, "body": body_text[:500]}
    except urllib.error.URLError as error:
        return {"ok": False, "status": None, "body": str(error.reason)}


def ensure_bucket(config):
    bucket_url = f"{config['supabase_url']}/storage/v1/bucket/{BUCKET}"
    check = request_json(bucket_url, "GET", config)
    if check["ok"]:
        return {"bucket_status": "exists"}

    bucket_not_found = check["status"] == 404 or "Bucket not found" in check["body"]
    if not bucket_not_found:
        return {
            "bucket_status": "check_failed",
            "bucket_error": f"HTTP {check['status']}: {check['body']}",
        }

    create_url = f"{config['supabase_url']}/storage/v1/bucket"
    create = request_json(
        create_url,
        "POST",
        config,
        {"id": BUCKET, "name": BUCKET, "public": True},
    )
    if create["ok"]:
        return {"bucket_status": "created"}

    return {
        "bucket_status": "create_failed",
        "bucket_error": f"HTTP {create['status']}: {create['body']}",
    }


def progress_key(asset):
    return asset.get("species_key") or asset.get("storage_path")


def load_assets():
    source_assets = read_json(INPUT_PATH, [])
    uploaded_assets = read_json(OUTPUT_PATH, [])
    progress_rows = read_json(PROGRESS_PATH, [])
    uploaded_by_key = {}

    for row in uploaded_assets + progress_rows:
        if row.get("public_url"):
            uploaded_by_key[progress_key(row)] = row

    merged_assets = []
    for asset in source_assets:
        merged_assets.append({**asset, **uploaded_by_key.get(progress_key(asset), {})})

    return source_assets, merged_assets


def save_uploaded_manifest(source_assets, uploaded_by_key):
    merged_assets = []
    for asset in source_assets:
        merged_assets.append({**asset, **uploaded_by_key.get(progress_key(asset), {})})

    progress_rows = sorted(uploaded_by_key.values(), key=lambda row: str(progress_key(row)))
    write_json(OUTPUT_PATH, merged_assets)
    write_json(PROGRESS_PATH, progress_rows)


def object_path_for(asset):
    species_key = asset.get("species_key", "")
    asset_status = asset.get("asset_status")
    local_path = asset.get("local_file_path") or ""
    extension = Path(local_path).suffix.lower() or ".jpg"

    if asset_status == "ready_ai_placeholder":
        return f"ai/{species_key}.png"
    if asset_status == "ready_real_image":
        return f"real/{species_key}{extension}"

    return asset.get("storage_path") or f"ai/{species_key}.png"


def content_type_for(file_path):
    guessed, _ = mimetypes.guess_type(str(file_path))
    if guessed:
        return guessed
    if file_path.suffix.lower() == ".png":
        return "image/png"
    return "image/jpeg"


def public_url_for(config, object_path):
    return f"{config['supabase_url']}/storage/v1/object/public/{BUCKET}/{object_path}"


def upload_file(config, asset, object_path, file_path):
    upload_url = f"{config['supabase_url']}/storage/v1/object/{BUCKET}/{object_path}"
    headers = {
        "Authorization": f"Bearer {config['service_role_key']}",
        "apikey": config["service_role_key"],
        "Content-Type": content_type_for(file_path),
        "x-upsert": "true",
    }

    with file_path.open("rb") as handle:
        body = handle.read()

    request = urllib.request.Request(upload_url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            response.read()
            return {"ok": True, "status": response.status, "body": ""}
    except urllib.error.HTTPError as error:
        body_text = error.read().decode("utf-8", errors="replace")
        return {"ok": False, "status": error.code, "body": body_text[:500]}
    except urllib.error.URLError as error:
        return {"ok": False, "status": None, "body": str(error.reason)}


def failure_row(asset, object_path, message):
    return {
        "species_key": asset.get("species_key"),
        "storage_path": object_path,
        "upload_status": "failed",
        "upload_error": message,
    }


def build_report(started_at, finished_at, bucket_result, total_rows, uploaded_this_run, skipped, failures, public_url_count):
    failed_keys = [row["species_key"] for row in failures]
    return {
        "startedAt": started_at,
        "finishedAt": finished_at,
        "bucket": BUCKET,
        **bucket_result,
        "totalRows": total_rows,
        "uploadedThisRun": uploaded_this_run,
        "skippedAlreadyUploaded": skipped,
        "failedThisRun": len(failures),
        "publicUrlCount": public_url_count,
        "pendingCount": total_rows - public_url_count,
        "failedSpeciesKeys": failed_keys,
        "failures": failures,
    }


def main():
    config = get_env_config()
    delay_seconds = upload_delay_seconds()
    limit = upload_limit()
    started_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    source_assets, current_assets = load_assets()
    uploaded_by_key = {
        progress_key(row): row
        for row in current_assets
        if row.get("public_url")
    }
    failures = []
    uploaded_this_run = 0
    skipped = 0
    attempted = 0

    bucket_result = ensure_bucket(config)
    if bucket_result["bucket_status"].endswith("failed"):
        report = build_report(
            started_at,
            time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            bucket_result,
            len(source_assets),
            0,
            0,
            [
                failure_row(asset, object_path_for(asset), "Bucket unavailable; upload not attempted.")
                for asset in current_assets
                if not asset.get("public_url")
            ],
            len(uploaded_by_key),
        )
        write_json(REPORT_PATH, report)
        print(json.dumps(report, indent=2))
        raise SystemExit(1)

    print(
        f"Uploading {len(source_assets)} species image assets sequentially "
        f"with {int(delay_seconds * 1000)}ms delay."
    )
    if limit:
        print(f"SPECIES_UPLOAD_LIMIT active: at most {limit} new upload attempts.")

    for index, asset in enumerate(current_assets, start=1):
        key = progress_key(asset)
        if asset.get("public_url") or uploaded_by_key.get(key, {}).get("public_url"):
            skipped += 1
            print(f"[{index}/{len(current_assets)}] skipped already uploaded {asset.get('species_key')}")
            continue

        if limit and attempted >= limit:
            break

        attempted += 1
        object_path = object_path_for(asset)
        local_file_path = asset.get("local_file_path") or ""
        file_path = ROOT / local_file_path

        if not file_path.exists() or file_path.stat().st_size == 0:
            failures.append(failure_row(asset, object_path, f"Missing or empty local file: {local_file_path}"))
            print(f"[{index}/{len(current_assets)}] failed {asset.get('species_key')}")
            time.sleep(delay_seconds)
            continue

        result = upload_file(config, asset, object_path, file_path)
        if result["ok"]:
            uploaded_asset = {
                **asset,
                "storage_path": object_path,
                "storage_bucket": BUCKET,
                "public_url": public_url_for(config, object_path),
                "upload_status": "uploaded",
                "uploaded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }
            uploaded_by_key[key] = uploaded_asset
            uploaded_this_run += 1
            save_uploaded_manifest(source_assets, uploaded_by_key)
            print(f"[{index}/{len(current_assets)}] uploaded {asset.get('species_key')}")
        else:
            failures.append(
                failure_row(
                    asset,
                    object_path,
                    f"HTTP {result['status']}: {result['body']}",
                )
            )
            print(f"[{index}/{len(current_assets)}] failed {asset.get('species_key')}")

        time.sleep(delay_seconds)

    save_uploaded_manifest(source_assets, uploaded_by_key)
    public_url_count = len(uploaded_by_key)
    report = build_report(
        started_at,
        time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        bucket_result,
        len(source_assets),
        uploaded_this_run,
        skipped,
        failures,
        public_url_count,
    )
    write_json(REPORT_PATH, report)
    print(json.dumps(report, indent=2))

    if failures or public_url_count != len(source_assets):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
