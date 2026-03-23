'use client';
// ─── NOVA CARDS – Pre-game Room Lobby ────────────────────────────────────────
import { motion } from 'framer-motion';
import type { GameState } from '@/lib/types';

const AVATARS = ['🦊', '🐯', '🐺', '🦅', '🐉', '🦋', '🌟', '🔮', '⚡', '🎯'];
function getAvatar(id: string) {
  const idx = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATARS.length;
  return AVATARS[idx];
}

interface RoomLobbyProps {
  gameState: GameState;
  myId: string;
  onStart: () => void;
  onLeave: () => void;
}

export function RoomLobby({ gameState, myId, onStart, onLeave }: RoomLobbyProps) {
  const isHost = gameState.hostId === myId;
  const canStart = gameState.players.length >= 2;

  const copyCode = () => {
    navigator.clipboard.writeText(gameState.roomCode);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', padding: 16 }}>
      <motion.div
        className="nova-modal"
        style={{ maxWidth: 520 }}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 className="text-gradient" style={{ fontSize: '1.8rem', fontWeight: 900 }}>ONU Cards</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', marginTop: 4 }}>
            Waiting for players…
          </p>
        </div>

        {/* Room code */}
        <div style={{
          background: 'rgba(124,109,255,0.1)',
          border: '1px solid rgba(124,109,255,0.25)',
          borderRadius: 16,
          padding: '16px 20px',
          marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginBottom: 4 }}>
              ROOM CODE
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.15em', color: '#a79eff' }}>
              {gameState.roomCode}
            </div>
          </div>
          <button
            onClick={copyCode}
            className="nova-btn nova-btn--ghost nova-btn--sm"
            id="btn-copy-code"
          >
            📋 Copy
          </button>
        </div>

        {/* Player list */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginBottom: 12 }}>
            PLAYERS ({gameState.players.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {gameState.players.map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${player.id === myId ? 'rgba(124,109,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 12,
                }}
              >
                <div style={{ fontSize: '1.4rem' }}>{getAvatar(player.id)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'white' }}>
                    {player.name}
                    {player.id === myId && <span style={{ color: '#a79eff', marginLeft: 6, fontSize: '0.75rem' }}>You</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {player.type === 'bot' && <span className="nova-badge nova-badge--bot">BOT</span>}
                  {player.id === gameState.hostId && <span className="nova-badge nova-badge--host">HOST</span>}
                  {player.connected && player.type === 'human' && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00d68f', marginTop: 4 }} />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          {isHost ? (
            <button
              className={`nova-btn nova-btn--primary ${!canStart ? 'nova-btn--disabled' : ''}`}
              style={{ flex: 1 }}
              onClick={onStart}
              id="btn-start-game"
            >
              {canStart ? '🚀 Start Game' : `Need ${2 - gameState.players.length} more player`}
            </button>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
              ⏳ Waiting for host to start…
            </div>
          )}
          <button className="nova-btn nova-btn--ghost" onClick={onLeave} id="btn-leave-lobby">
            Leave
          </button>
        </div>
      </motion.div>
    </div>
  );
}
