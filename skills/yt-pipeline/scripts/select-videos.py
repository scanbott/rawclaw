#!/usr/bin/env python3
"""
select-videos.py — Score and select top YouTube videos from yt-search JSON output.

Scoring weights:
  - Relevance (yt-dlp rank position): 30%
  - Engagement (VSR - views/subs ratio): 30%
  - Recency (days since upload): 20%
  - Source diversity (penalize duplicate channels): 20%

Usage:
    python3 ~/tools/scripts/yt-search.py "topic" -n 20 --json | python3 select-videos.py
    python3 select-videos.py --file results.json
    python3 select-videos.py --file results.json --count 6
"""

import argparse
import json
import sys
from datetime import datetime


def score_videos(videos, count=8):
    """Score and select top videos based on multi-factor ranking."""
    if not videos:
        return []

    # Normalize helper
    def normalize(values):
        min_v = min(values) if values else 0
        max_v = max(values) if values else 1
        rng = max_v - min_v if max_v != min_v else 1
        return [(v - min_v) / rng for v in values]

    # 1. Relevance score (inverse of position — first result = highest)
    relevance_raw = [1.0 - (i / len(videos)) for i in range(len(videos))]

    # 2. Engagement score (VSR)
    vsr_raw = [v.get("vsr") or 0 for v in videos]
    vsr_norm = normalize(vsr_raw)

    # 3. Recency score (fewer days ago = higher)
    now = datetime.now()
    days_raw = []
    for v in videos:
        ud = v.get("upload_date", "")
        if ud:
            try:
                dt = datetime.strptime(str(ud)[:8], "%Y%m%d")
                days_raw.append((now - dt).days)
            except ValueError:
                days_raw.append(365)
        else:
            days_raw.append(365)
    # Invert: fewer days = higher score
    max_days = max(days_raw) if days_raw else 365
    recency_norm = [1.0 - (d / max_days) if max_days > 0 else 0.5 for d in days_raw]

    # 4. Source diversity (penalize channels already selected)
    # Computed during selection, not pre-scored

    # Composite score (without diversity, added during selection)
    base_scores = []
    for i in range(len(videos)):
        score = (
            0.30 * relevance_raw[i]
            + 0.30 * vsr_norm[i]
            + 0.20 * recency_norm[i]
        )
        base_scores.append(score)

    # Greedy selection with diversity penalty
    selected = []
    used_channels = {}
    remaining = list(range(len(videos)))

    while len(selected) < count and remaining:
        best_idx = None
        best_score = -1

        for idx in remaining:
            channel = videos[idx].get("channel", "Unknown")
            # Diversity: penalize 2nd video from same channel by 50%, 3rd by 75%, etc.
            channel_count = used_channels.get(channel, 0)
            diversity = 0.20 * (1.0 / (1 + channel_count))
            final_score = base_scores[idx] + diversity

            if final_score > best_score:
                best_score = final_score
                best_idx = idx

        if best_idx is not None:
            remaining.remove(best_idx)
            channel = videos[best_idx].get("channel", "Unknown")
            used_channels[channel] = used_channels.get(channel, 0) + 1
            videos[best_idx]["_score"] = round(best_score, 3)
            videos[best_idx]["_rank"] = len(selected) + 1
            selected.append(videos[best_idx])

    return selected


def main():
    parser = argparse.ArgumentParser(description="Select top YouTube videos from yt-search JSON")
    parser.add_argument("--file", "-f", help="Read JSON from file instead of stdin")
    parser.add_argument("--count", "-c", type=int, default=8, help="Number of videos to select (default: 8)")
    args = parser.parse_args()

    if args.file:
        with open(args.file) as f:
            videos = json.load(f)
    else:
        videos = json.load(sys.stdin)

    selected = score_videos(videos, count=args.count)

    # Output selected videos as JSON
    print(json.dumps(selected, indent=2, default=str))

    # Also print summary to stderr
    print(f"\n  Selected {len(selected)} videos from {len(videos)} candidates:", file=sys.stderr)
    for v in selected:
        vsr = f"{v['vsr']:.2f}x" if v.get("vsr") else "N/A"
        print(f"    #{v['_rank']} [{v['_score']}] {v['title'][:60]}  ({v['channel']}, VSR: {vsr})", file=sys.stderr)


if __name__ == "__main__":
    main()
