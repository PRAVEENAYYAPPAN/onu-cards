'use client';
// ─── NOVA CARDS – Winner Screen ───────────────────────────────────────────────
import { motion } from 'framer-motion';
import { ParticleCanvas } from '@/components/animations/Particles';

const AVATARS = ['🦊', '🐯', '🐺', '🦅', '🐉', '🦋', '🌟', '🔮', '⚡', '🎯'];
function getAvatar(id: string) {
  const idx = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATARS.length;
  return AVATARS[idx];
}

interface WinnerScreenProps {
  winnerId: string;
  winnerName: string;
  isMe: boolean;
  onPlayAgain: () => void;
  onLeave: () => void;
  isHost: boolean;
}

export function WinnerScreen({
  winnerId, winnerName, isMe, onPlayAgain, onLeave, isHost
}: WinnerScreenProps) {
  return (
    <>
      <ParticleCanvas active />
      <motion.div
        className="winner-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          style={{
            background: 'linear-gradient(145deg, rgba(22,24,40,0.95), rgba(15,17,32,0.98))',
            border: '1px solid rgba(245,200,66,0.3)',
            borderRadius: 32,
            padding: '48px 56px',
            textAlign: 'center',
            boxShadow: '0 0 80px rgba(245,200,66,0.15), 0 32px 80px rgba(0,0,0,0.8)',
            maxWidth: 420,
            width: '90%',
          }}
          initial={{ scale: 0.6, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
        >
          {/* Crown */}
          <motion.div
            style={{ fontSize: '4rem', marginBottom: 16 }}
            animate={{ rotate: [-5, 5, -5], y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            👑
          </motion.div>

          {/* Avatar */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(245,200,66,0.15)',
            border: '3px solid rgba(245,200,66,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.5rem',
            margin: '0 auto 20px',
            boxShadow: '0 0 30px rgba(245,200,66,0.3)',
          }}>
            {getAvatar(winnerId)}
          </div>

          <h2 className="text-gold" style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 8 }}>
            {isMe ? 'You Won!' : `${winnerName} Won!`}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: 32 }}>
            {isMe
              ? 'Incredible! You cleared your hand first! 🎉'
              : `${winnerName} played all their cards first.`}
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {isHost && (
              <button className="nova-btn nova-btn--primary" onClick={onPlayAgain} id="btn-play-again">
                🔄 Play Again
              </button>
            )}
            <button className="nova-btn nova-btn--ghost" onClick={onLeave} id="btn-leave-game">
              🚪 Leave
            </button>
          </div>

          {!isHost && (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: 16 }}>
              Waiting for host to start a new game…
            </p>
          )}
        </motion.div>
      </motion.div>
    </>
  );
}
