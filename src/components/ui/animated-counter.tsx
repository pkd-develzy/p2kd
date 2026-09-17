"use client";

import React, { useState, useEffect, useRef } from "react";

export interface AnimatedCounterProps {
  from?: number;
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  decimals?: number;
  formatter?: (val: number) => string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  from = 1,
  to,
  duration = 1800,
  prefix = "",
  suffix = "",
  className = "",
  decimals = 0,
  formatter,
}) => {
  const [count, setCount] = useState<number>(from);
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (to === undefined || to === null || isNaN(to)) {
      return;
    }

    const startVal = Math.min(from, to);
    const endVal = to;
    startTimeRef.current = null;

    const easeOutCubic = (x: number): number => {
      return 1 - Math.pow(1 - x, 3);
    };

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const currentVal = startVal + (endVal - startVal) * easedProgress;

      if (decimals > 0) {
        setCount(Number(currentVal.toFixed(decimals)));
      } else {
        setCount(Math.round(currentVal));
      }

      if (progress < 1) {
        frameRef.current = window.requestAnimationFrame(animate);
      } else {
        setCount(endVal);
      }
    };

    frameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [to, from, duration, decimals]);

  const formatNumber = (val: number): string => {
    if (formatter) return formatter(val);
    if (decimals > 0) {
      return val.toLocaleString("id-ID", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }
    return val.toLocaleString("id-ID");
  };

  return (
    <span className={className}>
      {prefix}
      {formatNumber(count)}
      {suffix}
    </span>
  );
};
