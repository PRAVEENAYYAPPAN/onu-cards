'use client';
// ─── UNO – Sound Engine (Web Audio API) ─────────────────────────────────
// Synthesized sounds — no audio files needed
import { useCallback, useRef, useEffect } from 'react';

type SoundType =
  | 'cardPlay' | 'cardDraw' | 'attack' | 'heavyImpact'
  | 'whoosh' | 'rewind' | 'magic' | 'unoCall'
  | 'tick' | 'timerWarning' | 'victory' | 'fail'
  | 'trollDraw' | 'turnChange' | 'buttonClick' | 'shuffle'
  | 'cardPick' | 'cardRelease';

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', vol = 0.15) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration: number, vol = 0.08) {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  source.connect(gain).connect(ctx.destination);
  source.start();
}

const sounds: Record<SoundType, () => void> = {
  cardPick: () => {
    playTone(600, 0.05, 'triangle', 0.1);
  },
  cardRelease: () => {
    playTone(400, 0.05, 'triangle', 0.05);
  },
  cardPlay: () => {
    // Bouncy plop
    playTone(900, 0.04, 'sine', 0.15);
    setTimeout(() => playTone(1400, 0.04, 'sine', 0.1), 30);
  },
  cardDraw: () => {
    // Swoosh up
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.15);
  },
  attack: () => {
    // +2 attack sound — aggressive
    playTone(200, 0.3, 'sawtooth', 0.12);
    setTimeout(() => playTone(150, 0.2, 'sawtooth', 0.1), 100);
    playNoise(0.15, 0.1);
  },
  heavyImpact: () => {
    // +4 heavy impact
    playTone(80, 0.5, 'sawtooth', 0.15);
    setTimeout(() => playTone(60, 0.3, 'square', 0.12), 100);
    playNoise(0.3, 0.12);
    setTimeout(() => playTone(40, 0.4, 'sawtooth', 0.08), 200);
  },
  whoosh: () => {
    // Skip whoosh
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.3);
  },
  rewind: () => {
    // Reverse rewind
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.25);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.5);
  },
  magic: () => {
    // Wild magic
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => playTone(f, 0.2, 'sine', 0.08), i * 80);
    });
  },
  unoCall: () => {
    // UNO! voice-like
    playTone(440, 0.15, 'square', 0.12);
    setTimeout(() => playTone(660, 0.15, 'square', 0.12), 120);
    setTimeout(() => playTone(880, 0.25, 'square', 0.15), 240);
  },
  tick: () => {
    playTone(1000, 0.03, 'square', 0.06);
  },
  timerWarning: () => {
    playTone(880, 0.08, 'square', 0.12);
    setTimeout(() => playTone(880, 0.08, 'square', 0.12), 120);
  },
  victory: () => {
    [523, 659, 784, 1047, 1319].forEach((f, i) => {
      setTimeout(() => playTone(f, 0.3, 'sine', 0.1), i * 120);
    });
  },
  fail: () => {
    [400, 350, 300, 200].forEach((f, i) => {
      setTimeout(() => playTone(f, 0.2, 'sawtooth', 0.06), i * 150);
    });
  },
  trollDraw: () => {
    // Drawing many cards — troll sound
    [200, 250, 200, 250, 300, 350, 400].forEach((f, i) => {
      setTimeout(() => playTone(f, 0.1, 'square', 0.06), i * 70);
    });
  },
  turnChange: () => {
    playTone(600, 0.06, 'triangle', 0.06);
    setTimeout(() => playTone(800, 0.06, 'triangle', 0.06), 60);
  },
  buttonClick: () => {
    playTone(1200, 0.03, 'sine', 0.05);
  },
  shuffle: () => {
    for (let i = 0; i < 6; i++) {
      setTimeout(() => playNoise(0.04, 0.06), i * 40);
    }
  },
};

export function useSoundEngine() {
  const enabledRef = useRef(true);

  const play = useCallback((sound: SoundType) => {
    if (!enabledRef.current) return;
    try { sounds[sound](); } catch { /* ignore audio errors */ }
  }, []);

  const toggle = useCallback(() => {
    enabledRef.current = !enabledRef.current;
    return enabledRef.current;
  }, []);

  return { play, toggle, isEnabled: () => enabledRef.current };
}

// Sound for specific card values
export function getSoundForCard(value: string): SoundType {
  switch (value) {
    case 'draw2': return 'attack';
    case 'wild4': return 'heavyImpact';
    case 'skip': return 'whoosh';
    case 'reverse': return 'rewind';
    case 'wild': return 'magic';
    default: return 'cardPlay';
  }
}
