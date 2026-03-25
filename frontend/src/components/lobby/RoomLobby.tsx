'use client';
// ─── NOVA CARDS – Pre-game Room Lobby ─────────────────────────────────────────
import { motion } from 'framer-motion';
import type { GameState } from '@/lib/types';

const AVATARS = ['🦊', '🐯', '🐺', '🦅', '🐉', '🦋', '🌟', '🔮', '⚡', '🎯'];
const BOT_ICONS = ['🤖', '👾', '🎪', '🎭', '🃏', '🎲', '🎮'];

function getAvatar(id: string, isBot: boolean) {
  const idx = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 7;
  return isBot ? BOT_ICONS[idx] : AVATARS[idx];
}

interface RoomLobbyProps {
  gameState: GameState;
  myId: string;
  onStart: () => void;
  onLeave: () => void;
}

/**
 * Compute positions around a circle / geometric layout based on player count.
 * Returns {x, y} as % offset from center (the table center).
 * Positions are for the "other seats" + "my seat" last.
 */
function getSeatPositions(n: number): { x: number; y: number; label?: string }[] {
  if (n === 2) {
    return [
      { x: 0,   y: -44 }, // opponent top
      { x: 0,   y:  44 }, // me bottom
    ];
  }
  if (n === 3) {
    return [
      { x: 0,   y: -46 }, // top
      { x: 42,  y:  28 }, // bottom-right
      { x: -42, y:  28 }, // bottom-left (me)
    ];
  }
  if (n === 4) {
    return [
      { x: 0,   y: -46 }, // top
      { x: 46,  y:   0 }, // right
      { x: 0,   y:  46 }, // bottom (me)
      { x: -46, y:   0 }, // left
    ];
  }
  // 5, 6, 7 — evenly around a circle
  return Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return {
      x: Math.round(Math.cos(angle) * 46),
      y: Math.round(Math.sin(angle) * 42),
    };
  });
}

export function RoomLobby({ gameState, myId, onStart, onLeave }: RoomLobbyProps) {
  const isHost = gameState.hostId === myId;
  const canStart = gameState.players.length >= 2;
  const players = gameState.players;
  const n = players.length;
  const positions = getSeatPositions(Math.max(n, 2));

  // Sort so "me" is always at the bottom position
  const myIdx = players.findIndex(p => p.id === myId);
  const orderedPlayers = myIdx === -1
    ? players
    : [...players.slice(myIdx), ...players.slice(0, myIdx)];

  const copyCode = () => {
    navigator.clipboard.writeText(gameState.roomCode).catch(() => {});
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100dvh', padding: 16, position: 'relative',
      background: 'radial-gradient(ellipse 90% 80% at 50% 50%, #1e0c04 0%, #0a0501 100%)',
      overflow: 'hidden',
    }}>
      {/* Ambient light glows */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(circle 600px at 20% 50%, rgba(180,100,28,0.12) 0%, transparent 70%),
          radial-gradient(circle 500px at 80% 30%, rgba(80,40,8,0.18) 0%, transparent 60%)
        ` }}
      />

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ textAlign: 'center', marginBottom: 24, zIndex: 10 }}
      >
        <h1 style={{
          fontSize: 'clamp(2rem, 6vw, 3rem)', fontWeight: 900,
          background: 'linear-gradient(135deg, #ff3b5c 0%, #ffd426 30%, #06d6a0 60%, #4cc9f0 80%, #7c6dff 100%)',
          backgroundSize: '200% 200%',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          animation: 'title-gradient 4s ease infinite',
        }}>UNO!</h1>
        <p style={{ color: 'rgba(255,200,100,0.5)', fontSize: '0.78rem', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase' }}>
          Waiting for players…
        </p>
      </motion.div>

      {/* Room code */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
        style={{
          background: 'linear-gradient(145deg, rgba(22,13,6,0.97), rgba(12,7,3,0.98))',
          border: '1px solid rgba(255,165,55,0.25)',
          borderRadius: 18, padding: '12px 24px',
          display: 'flex', alignItems: 'center', gap: 20,
          marginBottom: 28, zIndex: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        <div>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,200,100,0.55)', letterSpacing: '0.08em', marginBottom: 3, textTransform: 'uppercase' }}>
            Room Code
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.18em', color: '#f5c842' }}>
            {gameState.roomCode}
          </div>
        </div>
        <button
          onClick={copyCode}
          style={{
            background: 'rgba(245,200,66,0.12)', border: '1px solid rgba(245,200,66,0.3)',
            borderRadius: 10, padding: '8px 16px', color: '#f5c842',
            fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif',
            transition: 'background 150ms',
          }}
          id="btn-copy-code"
        >
          📋 Copy
        </button>
      </motion.div>

      {/* ── Table with dynamic player arrangement ── */}
      <div style={{
        position: 'relative',
        width: 'min(540px, 90vw)',
        height: 'min(320px, 48vw)',
        zIndex: 10,
        marginBottom: 24,
      }}>
        {/* Felt table */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 40% 38%, #3e8f2b 0%, #2d6a1f 42%, #1d4d12 100%)',
          boxShadow: `
            inset 0 0 50px rgba(0,0,0,0.45),
            0 0 0 8px rgba(110,70,14,0.7),
            0 0 0 14px rgba(80,42,8,0.4),
            0 10px 50px rgba(0,0,0,0.7)
          `,
        }} />

        {/* Direction indicator */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'rgba(255,255,255,0.08)',
          fontSize: 'clamp(3rem, 8vw, 5rem)',
          userSelect: 'none', pointerEvents: 'none',
        }}>
          🂠
        </div>

        {/* PLAYERS */}
        {orderedPlayers.map((player, i) => {
          const pos = positions[i] ?? { x: 0, y: 0 };
          const isMe = player.id === myId;
          const isCurrentHost = player.id === gameState.hostId;

          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 300, damping: 22 }}
              style={{
                position: 'absolute',
                top: `calc(50% + ${pos.y}%)`,
                left: `calc(50% + ${pos.x}%)`,
                transform: 'translate(-50%, -50%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                zIndex: 5,
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 'clamp(44px, 7vw, 56px)',
                height: 'clamp(44px, 7vw, 56px)',
                borderRadius: '50%',
                background: isMe
                  ? 'linear-gradient(145deg, rgba(245,200,66,0.22), rgba(245,150,18,0.1))'
                  : 'linear-gradient(145deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))',
                border: isMe
                  ? '2.5px solid rgba(245,200,66,0.7)'
                  : '2px solid rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
                boxShadow: isMe
                  ? '0 0 0 3px rgba(245,200,66,0.2), 0 0 20px rgba(245,200,66,0.4)'
                  : '0 4px 14px rgba(0,0,0,0.5)',
                position: 'relative',
              }}>
                {getAvatar(player.id, player.type === 'bot')}
                {isCurrentHost && (
                  <div style={{
                    position: 'absolute', top: -8, right: -4,
                    fontSize: '0.9rem',
                  }}>👑</div>
                )}
                {player.connected && player.type === 'human' && (
                  <div style={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 10, height: 10, borderRadius: '50%',
                    background: '#00d68f',
                    border: '2px solid rgba(0,0,0,0.5)',
                  }} />
                )}
              </div>
              {/* Name */}
              <div style={{
                fontSize: 'clamp(0.52rem, 1.2vw, 0.7rem)',
                fontWeight: 700,
                color: isMe ? '#f5c842' : 'rgba(255,255,255,0.8)',
                background: 'rgba(0,0,0,0.5)',
                padding: '1px 7px', borderRadius: 6,
                whiteSpace: 'nowrap',
                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {player.name}{isMe ? ' (You)' : ''}
              </div>
              {player.type === 'bot' && (
                <div style={{
                  fontSize: '0.44rem', fontWeight: 800, background: '#4f3ff0',
                  color: 'white', padding: '1px 5px', borderRadius: 4,
                }}>BOT</div>
              )}
            </motion.div>
          );
        })}

        {/* Empty slots */}
        {Array.from({ length: Math.max(0, (gameState.players.length < 5 ? 5 : gameState.players.length) - orderedPlayers.length) }).map((_, i) => {
          const posIdx = orderedPlayers.length + i;
          const maxPositions = Math.max(5, n);
          const allPos = getSeatPositions(maxPositions);
          const pos = allPos[posIdx] ?? { x: 0, y: 0 };
          return (
            <div key={`empty-${i}`}
              style={{
                position: 'absolute',
                top: `calc(50% + ${pos.y}%)`,
                left: `calc(50% + ${pos.x}%)`,
                transform: 'translate(-50%, -50%)',
                width: 'clamp(40px, 6.5vw, 50px)',
                height: 'clamp(40px, 6.5vw, 50px)',
                borderRadius: '50%',
                border: '2px dashed rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.15)', fontSize: '1.2rem',
              }}>
              +
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ display: 'flex', gap: 12, zIndex: 10 }}
      >
        {isHost ? (
          <button
            className={`nova-btn nova-btn--primary ${!canStart ? 'nova-btn--disabled' : ''}`}
            style={{ minWidth: 180 }}
            onClick={onStart}
            id="btn-start-game"
          >
            {canStart ? '🚀 Start Game' : `⏳ Need ${2 - players.length} more`}
          </button>
        ) : (
          <div style={{
            minWidth: 180, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 100, padding: '12px 28px',
          }}>
            ⏳ Waiting for host…
          </div>
        )}
        <button className="nova-btn nova-btn--ghost" onClick={onLeave} id="btn-leave-lobby">
          Leave
        </button>
      </motion.div>
    </div>
  );
}
