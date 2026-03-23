'use client';
// ─── ONU Cards – Turn Timer (circular countdown) ──────────────────────────────
import { useEffect, useState, useRef } from 'react';

interface TurnTimerProps {
  duration: number;        // total seconds (10)
  isActive: boolean;       // show timer only when active
  onTick?: (remaining: number) => void;
  onTimeout?: () => void;
  size?: number;
}

export function TurnTimer({ duration, isActive, onTick, onTimeout, size = 56 }: TurnTimerProps) {
  const [remaining, setRemaining] = useState(duration);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (!isActive) {
      setRemaining(duration);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    startTimeRef.current = Date.now();
    setRemaining(duration);

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const left = Math.max(0, duration - elapsed);
      setRemaining(left);
      onTick?.(left);

      if (left <= 0) {
        if (intervalRef.current !== null) clearInterval(intervalRef.current);
        onTimeout?.();
      }
    }, 100);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive, duration, onTick, onTimeout]);

  if (!isActive) return null;

  const progress = remaining / duration;
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  // Color transitions: green→yellow→red
  const color = progress > 0.5
    ? `hsl(${120 * (progress - 0.5) * 2 + 60}, 80%, 55%)`  // green to yellow
    : `hsl(${progress * 120}, 85%, 50%)`;                    // yellow to red

  const secondsLeft = Math.ceil(remaining);

  return (
    <div style={{
      position: 'relative', width: size, height: size,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width={size} height={size} style={{
        position: 'absolute', transform: 'rotate(-90deg)',
        filter: remaining < 3 ? `drop-shadow(0 0 8px ${color})` : 'none',
      }}>
        {/* Background circle */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.08)"
          strokeWidth={3}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 100ms linear, stroke 200ms ease' }}
        />
      </svg>
      {/* Countdown number */}
      <span style={{
        fontSize: size * 0.28, fontWeight: 900,
        color: remaining < 3 ? color : 'rgba(255,255,255,0.7)',
        fontVariantNumeric: 'tabular-nums',
        animation: remaining < 3 ? 'timer-pulse 0.5s ease-in-out infinite' : 'none',
      }}>
        {secondsLeft}
      </span>
      <style>{`
        @keyframes timer-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
