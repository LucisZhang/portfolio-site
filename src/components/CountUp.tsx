"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
} from "react";
import {
  formatCountUpValue,
  startCountUp,
} from "@/lib/count-up";

type CountUpProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  value: number;
  start?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
};

export default function CountUp({
  value,
  start = 0,
  decimals = 0,
  prefix = "",
  suffix = "",
  ...props
}: CountUpProps) {
  const elementRef = useRef<HTMLSpanElement>(null);
  // The final value is the server and no-JS fallback. Before the first client
  // paint, motion-capable browsers reset to the start value and wait in view.
  const [displayValue, setDisplayValue] = useState(value);

  useLayoutEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const element = elementRef.current;
    const canObserve = element && typeof IntersectionObserver !== "undefined";
    return startCountUp({
      start,
      end: value,
      onValue: setDisplayValue,
      runtime: {
        reducedMotion: reduceMotion,
        observe: canObserve ? (onEnter) => {
          const observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) onEnter();
          }, { threshold: 0.2 });
          observer.observe(element);
          return () => observer.disconnect();
        } : undefined,
        now: () => performance.now(),
        requestFrame: (callback) => window.requestAnimationFrame(callback),
        cancelFrame: (frame) => window.cancelAnimationFrame(frame),
      },
    });
  }, [start, value]);

  return (
    <span ref={elementRef} {...props}>
      {formatCountUpValue(displayValue, { decimals, prefix, suffix })}
    </span>
  );
}
