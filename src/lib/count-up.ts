export const COUNT_UP_DURATION_MS = 400;

export function countUpValueAtElapsed(
  start: number,
  end: number,
  elapsedMs: number,
  durationMs = COUNT_UP_DURATION_MS,
) {
  if (durationMs <= 0) return end;
  const progress = Math.min(1, Math.max(0, elapsedMs / durationMs));
  return start + (end - start) * progress;
}

export type CountUpRuntime = {
  reducedMotion: boolean;
  observe?: (onEnter: () => void) => () => void;
  now: () => number;
  requestFrame: (callback: (now: number) => void) => number;
  cancelFrame: (frame: number) => void;
};

export function startCountUp({
  start,
  end,
  onValue,
  runtime,
}: {
  start: number;
  end: number;
  onValue: (value: number) => void;
  runtime: CountUpRuntime;
}) {
  if (runtime.reducedMotion || !runtime.observe) {
    onValue(end);
    return () => {};
  }

  let stopped = false;
  let played = false;
  let frame: number | null = null;
  let stopObserving = () => {};
  onValue(start);

  stopObserving = runtime.observe(() => {
    if (stopped || played) return;
    played = true;
    stopObserving();
    stopObserving = () => {};
    const startedAt = runtime.now();

    const tick = (now: number) => {
      if (stopped) return;
      const elapsed = now - startedAt;
      onValue(countUpValueAtElapsed(start, end, elapsed));
      if (elapsed < COUNT_UP_DURATION_MS) {
        frame = runtime.requestFrame(tick);
      } else {
        frame = null;
      }
    };

    frame = runtime.requestFrame(tick);
  });

  return () => {
    if (stopped) return;
    stopped = true;
    stopObserving();
    if (frame !== null) runtime.cancelFrame(frame);
    frame = null;
  };
}

export type CountUpFormatOptions = {
  decimals?: number;
  prefix?: string;
  suffix?: string;
};

export function formatCountUpValue(
  value: number,
  { decimals = 0, prefix = "", suffix = "" }: CountUpFormatOptions = {},
) {
  return `${prefix}${value.toFixed(Math.max(0, decimals))}${suffix}`;
}
