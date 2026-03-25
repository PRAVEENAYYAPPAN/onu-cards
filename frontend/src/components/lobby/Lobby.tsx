'use client';
// ─── UNO – Lobby / Home Screen ──────────────────────────────────────────
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
    <div className="uno-lobby" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100dvh', padding: 16, position: 'relative',
      background: 'radial-gradient(ellipse 90% 80% at 50% 50%, #1e0c04 0%, #0a0501 100%)',
      overflow: 'hidden',
    }}>
      {/* Ambient background glows */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(circle 600px at 20% 50%, rgba(180,100,28,0.12) 0%, transparent 70%),
          radial-gradient(circle 500px at 80% 30%, rgba(80,40,8,0.18) 0%, transparent 60%)
        ` }}
      />

      <FloatingCards />

      {/* Centered glassmorphism modal */}
      <motion.div
        style={{
          background: 'linear-gradient(155deg, rgba(22,13,6,0.94), rgba(12,7,3,0.96))',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255,165,55,0.25)',
          borderRadius: 28,
          padding: 'clamp(24px, 5vw, 40px)',
          maxWidth: 480, width: '92%',
          boxShadow: '0 36px 110px rgba(0,0,0,0.95), inset 0 2px 4px rgba(255,255,255,0.06)',
          position: 'relative', zIndex: 10,
        }}
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      >
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <motion.div
            animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}
          >
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="uno-logo-card" style={{ background: '#ff4d6d', transform: 'rotate(-15deg)', boxShadow: '0 8px 24px rgba(255,77,109,0.5)' }} />
              <div className="uno-logo-card" style={{ background: '#ffd166', transform: 'rotate(0deg)', boxShadow: '0 8px 24px rgba(255,209,102,0.5)' }} />
              <div className="uno-logo-card" style={{ background: '#06d6a0', transform: 'rotate(15deg)', boxShadow: '0 8px 24px rgba(6,214,160,0.5)' }} />
              <div className="uno-logo-card" style={{ background: '#4cc9f0', transform: 'rotate(28deg)', boxShadow: '0 8px 24px rgba(76,201,240,0.5)' }} />
            </div>
          </motion.div>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 8vw, 3.8rem)', fontWeight: 900, letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #ff3b5c 0%, #ffd426 30%, #06d6a0 60%, #4cc9f0 80%, #7c6dff 100%)',
            backgroundSize: '200% 200%',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text', animation: 'title-gradient 4s ease infinite',
            lineHeight: 1.1
          }}>UNO!</h1>
          <p style={{ color: 'rgba(255,200,80,0.5)', fontSize: '0.8rem', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase', marginTop: 4 }}>
            Multiplayer Card Game
          </p>
        </div>

        {/* Global Input style inside modal */}
        <style>{`.lobby-input { background: rgba(0,0,0,0.3) !important; border: 1px solid rgba(255,255,255,0.08) !important; } .lobby-input:focus { border-color: rgba(245,200,66,0.5) !important; box-shadow: 0 0 0 3px rgba(245,200,66,0.15) !important; }`}</style>

        {/* Name */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,200,100,0.6)', letterSpacing: '0.08em', marginBottom: 6 }}>YOUR NAME</label>
          <input
            className="nova-input lobby-input"
            value={playerName}
            onChange={e => onNameChange(e.target.value)}
            placeholder="Enter your name…"
            maxLength={18}
            id="input-player-name"
          />
        </div>

        {/* Mode Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <motion.div
            onClick={() => setTab('create')}
            whileHover={{ scale: 1.04, y: -4 }}
            whileTap={{ scale: 0.96 }}
            style={{
              background: tab === 'create' ? 'linear-gradient(135deg, #1e8fff, #0052cc)' : 'rgba(255,255,255,0.03)',
              border: `2px solid ${tab === 'create' ? '#4cc9f0' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 18, padding: '20px 12px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              boxShadow: tab === 'create' ? '0 12px 32px rgba(30,143,255,0.4)' : 'none',
              transition: 'all 200ms ease',
            }}
          >
            <div style={{ fontSize: '2.2rem', filter: tab === 'create' ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' : 'none' }}>✨</div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: tab === 'create' ? 'white' : 'rgba(255,255,255,0.4)' }}>CREATE ROOM</div>
          </motion.div>
          
          <motion.div
            onClick={() => setTab('join')}
            whileHover={{ scale: 1.04, y: -4 }}
            whileTap={{ scale: 0.96 }}
            style={{
              background: tab === 'join' ? 'linear-gradient(135deg, #00d68f, #007a52)' : 'rgba(255,255,255,0.03)',
              border: `2px solid ${tab === 'join' ? '#80ffcc' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 18, padding: '20px 12px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              boxShadow: tab === 'join' ? '0 12px 32px rgba(0,214,143,0.4)' : 'none',
              transition: 'all 200ms ease',
            }}
          >
            <div style={{ fontSize: '2.2rem', filter: tab === 'join' ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' : 'none' }}>🔗</div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: tab === 'join' ? 'white' : 'rgba(255,255,255,0.4)' }}>JOIN ROOM</div>
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {tab === 'create' ? (
            <motion.div key="create"
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.15 }}
            >
              <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 16, padding: '16px', marginBottom: 20 }}>
                {/* Total players */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,200,100,0.6)', letterSpacing: '0.08em' }}>TOTAL PLAYERS</label>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f5c842' }}>{totalPlayers}</span>
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
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,200,100,0.6)', letterSpacing: '0.08em' }}>BOTS</label>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f5c842' }}>
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
              </div>

              {/* Match Timer */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,200,100,0.6)', letterSpacing: '0.08em' }}>MATCH TIMER</label>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f5c842' }}>{matchDuration === 0 ? 'Unlimited' : `${matchDuration} min`}</span>
                </div>
                <select
                  className="nova-input lobby-input"
                  value={matchDuration}
                  onChange={e => setMatchDuration(Number(e.target.value))}
                  style={{ width: '100%' }}
                >
                  <option value={0} style={{ color: 'black' }}>Unlimited</option>
                  <option value={3} style={{ color: 'black' }}>3 Minutes</option>
                  <option value={5} style={{ color: 'black' }}>5 Minutes</option>
                </select>
              </div>

              {/* Public toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,200,100,0.6)', letterSpacing: '0.08em' }}>PUBLIC ROOM</label>
                <button
                  onClick={() => setIsPublic(!isPublic)}
                  className="uno-toggle"
                  style={{ background: isPublic ? 'rgba(124,109,255,0.8)' : 'rgba(255,255,255,0.1)' }}
                  id="toggle-public-room"
                >
                  <div className="uno-toggle__knob" style={{ left: isPublic ? 22 : 2 }} />
                </button>
              </div>

              <button
                className={`nova-btn nova-btn--primary ${isConnecting ? 'nova-btn--disabled' : ''}`}
                style={{ width: '100%', padding: '16px', borderRadius: 16, fontSize: '1.1rem', letterSpacing: '0.05em', boxShadow: '0 8px 32px rgba(204,51,0,0.5)' }}
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
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,200,100,0.6)', letterSpacing: '0.08em', marginBottom: 6 }}>ROOM CODE</label>
                <input
                  className="nova-input lobby-input"
                  value={joinCode}
                  onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError(null); }}
                  placeholder="Enter 6-letter code"
                  maxLength={6}
                  style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 800, textAlign: 'center', fontSize: '1.4rem', padding: '16px' }}
                  id="input-room-code"
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                />
              </div>
              {joinError && (
                <p style={{ color: '#ff6680', fontSize: '0.85rem', marginBottom: 16, textAlign: 'center', fontWeight: 600 }}>⚠️ {joinError}</p>
              )}
              <button
                className={`nova-btn nova-btn--primary ${isConnecting ? 'nova-btn--disabled' : ''}`}
                style={{ 
                  width: '100%', padding: '16px', borderRadius: 16, fontSize: '1.1rem', letterSpacing: '0.05em', 
                  background: 'linear-gradient(135deg, #00d68f 0%, #007a52 100%)', boxShadow: '0 8px 32px rgba(0,214,143,0.4)' 
                }}
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
              style={{
                marginTop: 16, padding: '12px 16px', background: 'rgba(255,59,92,0.15)',
                border: '1px solid rgba(255,59,92,0.38)', borderRadius: 12,
                fontSize: '0.85rem', color: '#ff6680', fontWeight: 600, textAlign: 'center'
              }}
            >
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

