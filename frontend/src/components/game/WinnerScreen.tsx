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
  scores?: { playerId: string; name: string; score: number }[];
}

export function WinnerScreen({
  winnerId, winnerName, isMe, onPlayAgain, onLeave, isHost, scores
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
            padding: '40px',
            textAlign: 'center',
            boxShadow: '0 0 80px rgba(245,200,66,0.15), 0 32px 80px rgba(0,0,0,0.8)',
            maxWidth: 480,
            width: '90%',
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <motion.div style={{ fontSize: '3.5rem', marginBottom: 16 }} animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 2, repeat: Infinity }}>
            👑
          </motion.div>

          <h2 className="text-gold" style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 8 }}>
            {isMe ? 'Victory!' : `${winnerName} Wins!`}
          </h2>

          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
            {scores ? 'Match ended by timer. Calculating total hand points...' : 'First player to clear their hand!'}
          </p>

          {scores && (
            <div style={{ marginBottom: 32, background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: '16px' }}>
              <h3 style={{ fontSize: '0.8rem', opacity: 0.5, textTransform: 'uppercase', marginBottom: 12 }}>Detailed Scores (Lowest Wins)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {scores.map((s, i) => (
                  <div key={s.playerId} style={{ 
                    display: 'flex', justifyContent: 'space-between', padding: '8px 12px',
                    borderRadius: 8, background: i === 0 ? 'rgba(245,200,66,0.15)' : 'transparent',
                    border: i === 0 ? '1px solid rgba(245,200,66,0.3)' : 'none'
                  }}>
                    <span style={{ fontWeight: i === 0 ? 700 : 400 }}>{s.name} {s.playerId === winnerId ? '🏆' : ''}</span>
                    <span style={{ fontWeight: 700, color: i === 0 ? '#ffd166' : '#fff' }}>{s.score} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            {isHost && (
              <button className="nova-btn nova-btn--primary" onClick={onPlayAgain}>
                Play Again
              </button>
            )}
            <button className="nova-btn nova-btn--ghost" onClick={onLeave}>
              Leave Room
            </button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
