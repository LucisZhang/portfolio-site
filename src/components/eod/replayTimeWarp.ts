// Replay time-warp for the EOD instrument (task F3, spec §2.4).
//
// The recorded drills are wildly non-uniform in real time: broker-restart's
// inject->detect burst is 198ms, followed by a 5m19s quiet stretch to
// recovery, then 49s to verify. Played back linearly (the old rAF loop)
// every event lands in the first frame and the rest is dead air — or, with
// a short fixed span, the replay reads as four disconnected slides.
//
// This module warps recorded drill time into a fixed replay duration so
// quiet stretches compress and event moments breathe: each inter-event
// segment's replay duration is proportional to the square root of its real
// duration (long silences compress hard, short bursts stay legible), with
// a floor per segment so no event crossing is ever instantaneous. Each
// segment is played with a slow-in/slow-out ease (Heer & Robertson,
// "Animated Transitions in Statistical Data Graphics", InfoVis 2007:
// slow-in slow-out timing improves spatial and temporal predictability),
// which means the clock decelerates INTO each recorded event and
// accelerates out of it — the easing itself communicates "something
// happened here".
//
// Honesty rule: the warp only remaps WHEN recorded moments are shown,
// never what they contain. Anchors are the drill file's real offsets; the
// clock readout always displays true recorded T+ time.

// The instrument-wide replay state machine. "idle" = never engaged (the
// resting exhibit: everything visible, exactly the SSR state). "armed" =
// the choreography is live — element visibility derives from the replay
// clock. "done" = a completed pass: everything revealed, REPLAY offered.
export type ReplayState = "idle" | "armed" | "done";

export type ReplaySegment = {
  fromT: number;
  toT: number;
  /** Replay-clock duration for this segment, ms. */
  durationMs: number;
  /** Replay-clock start of this segment, ms (cumulative). */
  startMs: number;
};

// Total replay duration targets. Rich drills (>=3 real anchors) get the
// full choreography window; sparse drills (only a start anchor) get a
// short, quiet pass — there is nothing recorded mid-flight to dwell on.
const RICH_TOTAL_MS = 8500;
const SPARSE_TOTAL_MS = 3200;
const MIN_SEGMENT_MS = 700;

export function buildReplaySegments(stageOffsets: number[], min: number, max: number): ReplaySegment[] {
  const anchors = Array.from(new Set([min, ...stageOffsets.filter((v) => v >= min && v <= max), max])).sort((a, b) => a - b);
  if (anchors.length < 2) return [{ fromT: min, toT: Math.max(max, min + 1), durationMs: SPARSE_TOTAL_MS, startMs: 0 }];

  const realDurations = anchors.slice(1).map((t, i) => Math.max(1, t - anchors[i]));
  const weights = realDurations.map((d) => Math.sqrt(d));
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const totalMs = anchors.length >= 4 ? RICH_TOTAL_MS : SPARSE_TOTAL_MS;
  const distributable = Math.max(0, totalMs - MIN_SEGMENT_MS * realDurations.length);

  let cursor = 0;
  return realDurations.map((_, i) => {
    const durationMs = MIN_SEGMENT_MS + (weights[i] / weightSum) * distributable;
    const segment: ReplaySegment = { fromT: anchors[i], toT: anchors[i + 1], durationMs, startMs: cursor };
    cursor += durationMs;
    return segment;
  });
}

export function totalReplayMs(segments: ReplaySegment[]): number {
  const last = segments[segments.length - 1];
  return last ? last.startMs + last.durationMs : 0;
}

// Inverse mapping: given a drill-time position (e.g. after the user drags
// the range input), find the replay-clock time to resume the GSAP timeline
// from. Linear within a segment — the per-segment ease makes this resume
// point off by at most a fraction of one segment, which is imperceptible
// for a resume seek and keeps the inverse trivially correct at every
// anchor.
export function replayTimeForPosition(segments: ReplaySegment[], t: number): number {
  if (segments.length === 0) return 0;
  if (t <= segments[0].fromT) return 0;
  for (const segment of segments) {
    if (t <= segment.toT) {
      const span = Math.max(1, segment.toT - segment.fromT);
      return segment.startMs + ((t - segment.fromT) / span) * segment.durationMs;
    }
  }
  return totalReplayMs(segments);
}
