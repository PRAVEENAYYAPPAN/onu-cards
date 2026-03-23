'use client';
// ─── NOVA CARDS – Player Seat ─────────────────────────────────────────────────
import { motion } from 'framer-motion';
import type { Player } from '@/lib/types';
import { NovaCard } from './Card';

const AVATARS = ['🦊', '🐯', '🐺', '🦅', '🐉', '🦋', '🌟', '🔮', '⚡', '🎯'];

function getAvatar(id: string): string {
  const idx = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATARS.length;
  return AVATARS[idx];
}

interface PlayerSeatProps {
  player: Player;
  isActive: boolean;
  isMe: boolean;
  position: 'top' | 'left' | 'right' | 'top-left' | 'top-right';
}

export function PlayerSeat({ player, isActive, isMe, position }: PlayerSeatProps) {
  const avatar = getAvatar(player.id);
  const isHorizontal = position === 'left' || position === 'right';

  return (
    <motion.div
      className={`player-seat ${isActive ? 'player-seat--active' : ''}`}
      style={{
        flexDirection: isHorizontal ? 'column' : 'column',
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Avatar */}
      <div style={{ position: 'relative' }}>
        <motion.div
          className="player-avatar"
          animate={isActive ? {
            borderColor: ['rgba(124,109,255,0.4)', 'rgba(124,109,255,1)', 'rgba(124,109,255,0.4)'],
          } : {}}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {avatar}
        </motion.div>
        {/* Bot badge */}
        {player.type === 'bot' && (
          <div style={{
            position: 'absolute', bottom: -4, right: -4,
            background: 'rgba(124,109,255,0.9)',
            borderRadius: '100px',
            padding: '1px 4px',
            fontSize: '0.55rem',
            fontWeight: 700,
            color: 'white',
            letterSpacing: '0.04em',
          }}>
            BOT
          </div>
        )}
        {/* Nova indicator */}
        {player.saidNova && (
          <motion.div
            style={{
              position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #ff3b5c, #ffd426)',
              borderRadius: '100px',
              padding: '2px 8px',
              fontSize: '0.6rem',
              fontWeight: 900,
              color: 'white',
              whiteSpace: 'nowrap',
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          >
            NOVA!
          </motion.div>
        )}
      </div>

      {/* Name */}
      <div style={{ textAlign: 'center' }}>
        <div className="player-name">{isMe ? `${player.name} (You)` : player.name}</div>
        <div className="player-card-count">{player.handCount} cards</div>
      </div>

      {/* Fan of face-down cards for opponents */}
      {!isMe && player.handCount > 0 && (
        <div style={{ display: 'flex', position: 'relative', height: 36, width: Math.min(player.handCount * 10, 80) }}>
          {Array.from({ length: Math.min(player.handCount, 7) }).map((_, i) => {
            const angle = (i - Math.min(player.handCount, 7) / 2) * 8;
            const offset = i * 8;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: offset,
                  transform: `rotate(${angle}deg)`,
                  transformOrigin: 'bottom center',
                  width: 24,
                  height: 36,
                  borderRadius: 4,
                  background: 'linear-gradient(145deg, #1a1d3a 0%, #0d0f1e 100%)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                }}
              />
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
