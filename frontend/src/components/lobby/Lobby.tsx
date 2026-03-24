'use client';
// ─── ONU Cards – Lobby / Home Screen ──────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RoomOptions } from '@/lib/types';

interface LobbyProps {
  playerName: string;
  onNameChange: (name: string) => void;
  onCreate: (opts: RoomOptions) => Promise<string>;
  onJoin: (code: string) => Promise<void>;
  isConnecting: boolean;
  error: string | null;
}

// ── Animated floating cards background ────────────────────────────────────────

function FloatingCards() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    let width = 0, height = 0;

    const colors = ['#ff4d6d', '#4cc9f0', '#06d6a0', '#ffd166', '#7c6dff'];
    const symbols = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '⊘', '↺', '+2', '★', '+4'];

    interface FloatingCard {
      x: number; y: number; vx: number; vy: number;
      rot: number; vr: number; scale: number;
      color: string; symbol: string; opacity: number;
    }

    let cards: FloatingCard[] = [];

    function resize() {
      width = canvas!.width = window.innerWidth;
      height = canvas!.height = window.innerHeight;
      // Create cards based on screen size
      const count = Math.max(12, Math.floor((width * height) / 40000));
      cards = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.3 - 0.2,
        rot: Math.random() * 360,
        vr: (Math.random() - 0.5) * 0.5,
        scale: 0.4 + Math.random() * 0.6,
        color: colors[Math.floor(Math.random() * colors.length)],
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        opacity: 0.05 + Math.random() * 0.1,
      }));
    }

    function drawCard(c: FloatingCard) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate((c.rot * Math.PI) / 180);
      ctx.scale(c.scale, c.scale);
      ctx.globalAlpha = c.opacity;

      // Card body
      const w = 48, h = 72, r = 8;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, r);
      ctx.fillStyle = c.color;
      ctx.fill();

      // Inner oval
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 28, -0.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fill();

      // Symbol
      ctx.globalAlpha = c.opacity * 2;
      ctx.fillStyle = 'white';
      ctx.font = 'bold 18px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(c.symbol, 0, 0);

      ctx.restore();
    }

    function frame() {
      ctx.clearRect(0, 0, width, height);
      for (const c of cards) {
        c.x += c.vx;
        c.y += c.vy;
        c.rot += c.vr;
        // Wrap around
        if (c.x < -60) c.x = width + 60;
        if (c.x > width + 60) c.x = -60;
        if (c.y < -100) c.y = height + 100;
        if (c.y > height + 100) c.y = -100;
        drawCard(c);
      }
      animId = requestAnimationFrame(frame);
    }

    resize();
    frame();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  );
}

// ── Main Lobby ────────────────────────────────────────────────────────────────

export function Lobby({ playerName, onNameChange, onCreate, onJoin, isConnecting, error }: LobbyProps) {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [totalPlayers, setTotalPlayers] = useState(5);
  const [botCount, setBotCount] = useState(4);
  const [isPublic, setIsPublic] = useState(false);
  const [matchDuration, setMatchDuration] = useState<number>(0);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  const humanCount = totalPlayers - botCount;

  const handleCreate = async () => {
    await onCreate({ mode: 'classic', maxPlayers: totalPlayers, botCount, isPublic, matchDuration });
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 6) {
      setJoinError('Please enter a 6-character room code');
      return;
    }
    setJoinError(null);
    try { await onJoin(code); } catch { setJoinError('Room not found.'); }
  };

  return (
    <div className="onu-lobby">
      {/* Full-screen animated background */}
      <FloatingCards />

      {/* Centered modal */}
      <motion.div
        className="onu-lobby__modal"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      >
        {/* Title */}
        <div className="onu-lobby__header">
          <motion.div
            className="onu-lobby__logo"
            animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="onu-lobby__logo-cards">
              <div className="onu-logo-card" style={{ background: '#ff4d6d', transform: 'rotate(-15deg)' }} />
              <div className="onu-logo-card" style={{ background: '#ffd166', transform: 'rotate(0deg)' }} />
              <div className="onu-logo-card" style={{ background: '#06d6a0', transform: 'rotate(15deg)' }} />
              <div className="onu-logo-card" style={{ background: '#4cc9f0', transform: 'rotate(28deg)' }} />
            </div>
          </motion.div>
          <h1 className="onu-lobby__title">ONU Cards</h1>
        </div>

        {/* Name */}
        <div className="onu-lobby__field">
          <label className="onu-label">YOUR NAME</label>
          <input
            className="nova-input"
            value={playerName}
            onChange={e => onNameChange(e.target.value)}
            placeholder="Enter your name…"
            maxLength={18}
            id="input-player-name"
          />
        </div>

        {/* Tabs */}
        <div className="onu-tabs">
          {(['create', 'join'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`onu-tabs__btn ${tab === t ? 'onu-tabs__btn--active' : ''}`}
              id={`tab-${t}`}
            >
              {t === 'create' ? '✨ Create Room' : '🔗 Join Room'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'create' ? (
            <motion.div key="create"
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.15 }}
            >
              {/* Total players */}
              <div className="onu-lobby__field">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label className="onu-label">TOTAL PLAYERS</label>
                  <span className="onu-value">{totalPlayers}</span>
                </div>
                <input
                  className="nova-slider" type="range" min={2} max={7}
                  value={totalPlayers}
                  onChange={e => {
                    const v = Number(e.target.value);
                    setTotalPlayers(v);
                    setBotCount(Math.min(botCount, v - 1));
                  }}
                  id="slider-total-players"
                />
              </div>

              {/* Bot count */}
              <div className="onu-lobby__field">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label className="onu-label">BOTS</label>
                  <span className="onu-value">
                    {botCount} bots · {humanCount} human{humanCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <input
                  className="nova-slider" type="range" min={0} max={totalPlayers - 1}
                  value={botCount}
                  onChange={e => setBotCount(Number(e.target.value))}
                  id="slider-bot-count"
                />
              </div>

              {/* Match Timer */}
              <div className="onu-lobby__field" style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label className="onu-label">MATCH TIMER</label>
                  <span className="onu-value">{matchDuration === 0 ? 'Unlimited' : `${matchDuration} min`}</span>
                </div>
                <select
                  className="nova-input"
                  value={matchDuration}
                  onChange={e => setMatchDuration(Number(e.target.value))}
                  style={{ width: '100%', opacity: 0.9, backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
                >
                  <option value={0} style={{ color: 'black' }}>Unlimited</option>
                  <option value={3} style={{ color: 'black' }}>3 Minutes</option>
                  <option value={5} style={{ color: 'black' }}>5 Minutes</option>
                </select>
              </div>

              {/* Public toggle */}
              <div className="onu-lobby__toggle" style={{ marginTop: 16 }}>
                <label className="onu-label">PUBLIC ROOM</label>
                <button
                  onClick={() => setIsPublic(!isPublic)}
                  className="onu-toggle"
                  style={{ background: isPublic ? 'rgba(124,109,255,0.8)' : 'rgba(255,255,255,0.1)' }}
                  id="toggle-public-room"
                >
                  <div className="onu-toggle__knob" style={{ left: isPublic ? 22 : 2 }} />
                </button>
              </div>

              <button
                className={`nova-btn nova-btn--primary ${isConnecting ? 'nova-btn--disabled' : ''}`}
                style={{ width: '100%' }}
                onClick={handleCreate}
                id="btn-create-room"
              >
                {isConnecting ? '⏳ Connecting…' : '🚀 Create Game'}
              </button>
            </motion.div>
          ) : (
            <motion.div key="join"
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}
            >
              <div className="onu-lobby__field">
                <label className="onu-label">ROOM CODE</label>
                <input
                  className="nova-input"
                  value={joinCode}
                  onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError(null); }}
                  placeholder="Enter 6-letter code"
                  maxLength={6}
                  style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, textAlign: 'center', fontSize: '1.2rem' }}
                  id="input-room-code"
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                />
              </div>
              {joinError && (
                <p style={{ color: '#ff6680', fontSize: '0.78rem', marginBottom: 12, textAlign: 'center' }}>⚠️ {joinError}</p>
              )}
              <button
                className={`nova-btn nova-btn--primary ${isConnecting ? 'nova-btn--disabled' : ''}`}
                style={{ width: '100%' }}
                onClick={handleJoin}
                id="btn-join-room"
              >
                {isConnecting ? '⏳ Joining…' : '🔗 Join Game'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="onu-lobby__error"
            >
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
