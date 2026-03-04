#!/usr/bin/env python3
"""
Build a report of failed extractions based on extracted_data/extraction.log.

Outputs JSONL (one JSON object per slug) and optionally CSV.

Why:
  The extractor currently does not create any artifact for failed URLs (only logs).
  This script provides a deterministic "failed list" for follow-up actions.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple


LOG_LINE_RE = re.compile(
    r"^(?P<ts>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) - (?P<level>[A-Z]+) - (?P<msg>.*)$"
)

START_RE = re.compile(r"^Обработка\s+(?P<slug>\S+):\s+(?P<url>\S+)\s*$")
SAVED_RE = re.compile(r"^Сохранено:\s+(?P<path>.+/(?P<slug>[^/]+)\.json)\s*$")
FAILED_RE = re.compile(r"^Не удалось скачать\s+(?P<url>\S+)\s*$")
ERROR_PROCESSING_RE = re.compile(r"^Ошибка при обработке\s+(?P<url>\S+):\s+(?P<err>.+)\s*$")


def parse_ts(s: str) -> Optional[str]:
    """Return ISO timestamp string or None if parsing fails."""
    try:
        dt = datetime.strptime(s, "%Y-%m-%d %H:%M:%S,%f")
        return dt.isoformat()
    except Exception:
        return None


def classify_reason(messages: List[str]) -> str:
    """
    Best-effort classification based on recent WARNING/ERROR messages for a slug.
    Returns a stable reason string.
    """
    hay = "\n".join(messages).lower()

    # Invalid URL / missing scheme
    if "invalid url" in hay or "no scheme supplied" in hay:
        return "invalid_url"

    # DNS / resolution
    if "failed to resolve" in hay or "nameresolutionerror" in hay or "nodename nor servname provided" in hay:
        return "dns"

    # HTTP status codes
    if "403" in hay and ("forbidden" in hay or "client error" in hay):
        return "http_403_forbidden"
    if "404" in hay and ("not found" in hay or "client error" in hay):
        return "http_404_not_found"
    if "429" in hay or "too many requests" in hay:
        return "http_429_rate_limited"

    # Timeouts
    if "read timed out" in hay or "timeout" in hay or "timed out" in hay:
        return "timeout"

    # TLS / SSL
    if "ssl" in hay or "certificate" in hay:
        return "tls_ssl"

    # Playwright environment issues
    if "playwright" in hay and "executable doesn't exist" in hay:
        return "playwright_missing_browser"
    if "playwright" in hay and "sync api inside the asyncio loop" in hay:
        return "playwright_asyncio_loop"

    # Fallback
    return "unknown"


@dataclass
class FailureRecord:
    slug: str
    url: str
    last_seen_at: Optional[str]
    reason: str
    messages: List[str]
    attempts: int


@dataclass
class _CurrentContext:
    slug: str
    url: str
    last_ts_iso: Optional[str]
    messages: List[str]


def iter_log_lines(log_path: Path) -> List[Tuple[Optional[str], str, str]]:
    """
    Returns list of (ts_iso, level, msg). Unparseable lines are skipped.
    """
    rows: List[Tuple[Optional[str], str, str]] = []
    with log_path.open("r", encoding="utf-8", errors="replace") as f:
        for raw in f:
            line = raw.rstrip("\n")
            m = LOG_LINE_RE.match(line)
            if not m:
                continue
            ts_iso = parse_ts(m.group("ts"))
            level = m.group("level")
            msg = m.group("msg")
            rows.append((ts_iso, level, msg))
    return rows


def build_failed_report(
    log_path: Path,
    output_dir: Path,
    only_missing_files: bool,
) -> Dict[str, FailureRecord]:
    """
    Returns dict: slug -> FailureRecord.

    Logic:
      - Track the "current" slug being processed and accumulate WARNING/ERROR messages.
      - When we see "Не удалось скачать ..." or "Ошибка при обработке ...", mark slug as failed (latest wins).
      - When we see "Сохранено: .../{slug}.json", mark slug as success (remove failures).
      - Optionally filter failures to only those whose JSON file is missing in output_dir.
    """
    failures: Dict[str, FailureRecord] = {}
    success_slugs: set[str] = set()
    attempts: Dict[str, int] = {}
    current: Optional[_CurrentContext] = None

    rows = iter_log_lines(log_path)
    for ts_iso, level, msg in rows:
        # Start processing context
        m_start = START_RE.match(msg)
        if m_start:
            current = _CurrentContext(
                slug=m_start.group("slug"),
                url=m_start.group("url"),
                last_ts_iso=ts_iso,
                messages=[],
            )
            continue

        # Track messages within context
        if current is not None and level in ("WARNING", "ERROR"):
            # Keep messages bounded to avoid huge payloads
            current.messages.append(f"{level}: {msg}")
            if len(current.messages) > 50:
                current.messages = current.messages[-50:]
            current.last_ts_iso = ts_iso or current.last_ts_iso

        # Successful save removes failure for that slug
        m_saved = SAVED_RE.match(msg)
        if m_saved:
            slug_saved = m_saved.group("slug")
            success_slugs.add(slug_saved)
            failures.pop(slug_saved, None)
            continue

        # Failure markers depend on having a current context
        if current is None:
            continue

        m_failed = FAILED_RE.match(msg)
        m_proc_err = ERROR_PROCESSING_RE.match(msg)
        if m_failed or m_proc_err:
            slug = current.slug
            url = current.url
            if slug in success_slugs:
                # If it later succeeded, do not record failure.
                continue
            attempts[slug] = attempts.get(slug, 0) + 1

            # include the marker line too
            marker = f"{level}: {msg}"
            messages = list(current.messages)
            if marker not in messages:
                messages.append(marker)

            failures[slug] = FailureRecord(
                slug=slug,
                url=url,
                last_seen_at=current.last_ts_iso,
                reason=classify_reason(messages),
                messages=messages,
                attempts=attempts[slug],
            )

    if only_missing_files:
        missing_only: Dict[str, FailureRecord] = {}
        for slug, rec in failures.items():
            if not (output_dir / f"{slug}.json").exists():
                missing_only[slug] = rec
        failures = missing_only

    return failures


def write_jsonl(path: Path, failures: Dict[str, FailureRecord]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        for slug in sorted(failures.keys()):
            obj = asdict(failures[slug])
            f.write(json.dumps(obj, ensure_ascii=False) + "\n")


def write_csv_file(path: Path, failures: Dict[str, FailureRecord]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["slug", "url", "last_seen_at", "reason", "attempts", "messages"],
        )
        writer.writeheader()
        for slug in sorted(failures.keys()):
            rec = failures[slug]
            writer.writerow(
                {
                    "slug": rec.slug,
                    "url": rec.url,
                    "last_seen_at": rec.last_seen_at or "",
                    "reason": rec.reason,
                    "attempts": rec.attempts,
                    "messages": " | ".join(rec.messages),
                }
            )


def main() -> int:
    parser = argparse.ArgumentParser(description="Build failed extraction report from extraction.log")
    parser.add_argument(
        "--log-file",
        default="extracted_data/extraction.log",
        help="Path to extraction.log",
    )
    parser.add_argument(
        "--output-jsonl",
        default="extracted_data/failed.jsonl",
        help="Where to write JSONL report",
    )
    parser.add_argument(
        "--output-csv",
        default="",
        help="Optional CSV path (leave empty to skip)",
    )
    parser.add_argument(
        "--only-missing-files",
        action="store_true",
        help="Keep only failures whose {slug}.json is missing in output_dir",
    )
    parser.add_argument(
        "--output-dir",
        default="extracted_data",
        help="Directory containing extracted {slug}.json files",
    )
    args = parser.parse_args()

    root = Path(__file__).resolve().parent.parent
    log_path = (root / args.log_file).resolve()
    out_jsonl = (root / args.output_jsonl).resolve()
    out_csv = (root / args.output_csv).resolve() if args.output_csv else None
    output_dir = (root / args.output_dir).resolve()

    if not log_path.exists():
        raise SystemExit(f"Log file not found: {log_path}")

    failures = build_failed_report(
        log_path=log_path,
        output_dir=output_dir,
        only_missing_files=args.only_missing_files,
    )

    write_jsonl(out_jsonl, failures)
    if out_csv is not None:
        write_csv_file(out_csv, failures)

    # Print a concise summary for humans running from CLI.
    by_reason: Dict[str, int] = {}
    for rec in failures.values():
        by_reason[rec.reason] = by_reason.get(rec.reason, 0) + 1

    print(f"Failed slugs: {len(failures)}")
    for reason, cnt in sorted(by_reason.items(), key=lambda x: (-x[1], x[0])):
        print(f"- {reason}: {cnt}")
    print(f"Wrote: {out_jsonl}")
    if out_csv is not None:
        print(f"Wrote: {out_csv}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

