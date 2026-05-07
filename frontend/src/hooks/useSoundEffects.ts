import { useCallback, useEffect, useRef, useState } from 'react';
import type { MultiplierStatus } from '../components/MultiplierDisplay/MultiplierDisplay';

// Lazy singleton AudioContext — only created after a user gesture.
let sharedCtx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedCtx) {
    try {
      sharedCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (sharedCtx.state === 'suspended') {
    sharedCtx.resume().catch(() => {});
  }
  return sharedCtx;
}

function master(ctx: AudioContext, vol = 0.6): GainNode {
  const g = ctx.createGain();
  g.gain.value = vol;
  g.connect(ctx.destination);
  return g;
}

// Short rising "ping" — played when a bet is placed
function playBetSound() {
  const ctx = getCtx();
  if (!ctx) return;
  const g = master(ctx, 0.45);
  const t = ctx.currentTime;

  [440, 523, 659].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t + i * 0.06);
    gain.gain.linearRampToValueAtTime(0.4, t + i * 0.06 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.15);
    osc.connect(gain);
    gain.connect(g);
    osc.start(t + i * 0.06);
    osc.stop(t + i * 0.06 + 0.18);
  });
}

// Ascending coin arpeggio — played on successful cashout
function playCashoutSound() {
  const ctx = getCtx();
  if (!ctx) return;
  const g = master(ctx, 0.5);
  const t = ctx.currentTime;

  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = i < 2 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, t + i * 0.08);
    osc.frequency.linearRampToValueAtTime(freq * 1.02, t + i * 0.08 + 0.12);
    gain.gain.setValueAtTime(0, t + i * 0.08);
    gain.gain.linearRampToValueAtTime(0.5, t + i * 0.08 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.35);
    osc.connect(gain);
    gain.connect(g);
    osc.start(t + i * 0.08);
    osc.stop(t + i * 0.08 + 0.4);
  });
}

// Impact noise + descending tone — played on crash
function playCrashSound() {
  const ctx = getCtx();
  if (!ctx) return;
  const g = master(ctx, 0.55);
  const t = ctx.currentTime;

  // White noise burst
  const bufferSize = ctx.sampleRate * 0.3;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.6, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  noise.connect(noiseGain);
  noiseGain.connect(g);
  noise.start(t);

  // Falling sine
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(440, t);
  osc.frequency.exponentialRampToValueAtTime(60, t + 0.5);
  oscGain.gain.setValueAtTime(0.4, t);
  oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  osc.connect(oscGain);
  oscGain.connect(g);
  osc.start(t);
  osc.stop(t + 0.55);
}

// Short high beep — for last 3 seconds of betting window
function playUrgentBeep() {
  const ctx = getCtx();
  if (!ctx) return;
  const g = master(ctx, 0.3);
  const t = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.35, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  osc.connect(gain);
  gain.connect(g);
  osc.start(t);
  osc.stop(t + 0.12);
}

// ---- hook ----

interface SoundEffects {
  playBet: () => void;
  playCashout: () => void;
  playUrgentBeep: () => void;
  muted: boolean;
  toggleMute: () => void;
}

export function useSoundEffects(status: MultiplierStatus): SoundEffects {
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem('crash:muted') === 'true';
    } catch {
      return false;
    }
  });

  const prevStatus = useRef<MultiplierStatus>(status);

  // Auto-play crash sound on status → crashed transition
  useEffect(() => {
    if (prevStatus.current !== 'crashed' && status === 'crashed') {
      if (!muted) playCrashSound();
    }
    prevStatus.current = status;
  }, [status, muted]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      try { localStorage.setItem('crash:muted', String(next)); } catch {}
      return next;
    });
  }, []);

  const safeBet = useCallback(() => { if (!muted) playBetSound(); }, [muted]);
  const safeCashout = useCallback(() => { if (!muted) playCashoutSound(); }, [muted]);
  const safeUrgent = useCallback(() => { if (!muted) playUrgentBeep(); }, [muted]);

  return { playBet: safeBet, playCashout: safeCashout, playUrgentBeep: safeUrgent, muted, toggleMute };
}
