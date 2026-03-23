'use client';
// ─── NOVA CARDS – Room Page ───────────────────────────────────────────────────
import { useEffect, Component, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { RoomLobby } from '@/components/lobby/RoomLobby';
import { GameTable } from '@/components/game/GameTable';
import { motion } from 'framer-motion';

// ── Error Boundary (prevents animation crashes from showing black screen) ──────
class GameErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; msg: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, msg: '' };
  }
  static getDerivedStateFromError(err: unknown) {
    return { hasError: true, msg: err instanceof Error ? err.message : String(err) };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: '2rem' }}>⚠️</div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Something went wrong. Please reload.</p>
          <button className="nova-btn nova-btn--primary" onClick={() => window.location.reload()}>Reload Game</button>
        </div>
      );
    }
    return this.props.children;
  }
}


export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string ?? '').toUpperCase();

  const {
    gameState, myId, myHand,
    joinGame, startGame, playCard, drawCard, sayNova, playAgain, leaveGame,
    isConnecting, error, room,
  } = useGameStore();

  // Auto-rejoin if we navigated directly to this URL
  useEffect(() => {
    if (!room && !isConnecting && code) {
      joinGame(code).catch(() => router.push('/'));
    }
  }, []); // eslint-disable-line

  const handleLeave = async () => {
    await leaveGame();
    router.push('/');
  };

  if (isConnecting) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', flexDirection: 'column', gap: 20 }}>
        <motion.div style={{ fontSize: '3rem' }} animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
          🃏
        </motion.div>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Connecting…</p>
      </div>
    );
  }

  if (error && !gameState) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: '0.9rem', color: '#ff6680' }}>⚠️ {error}</div>
        <button className="nova-btn nova-btn--primary" onClick={() => router.push('/')}>← Back to Lobby</button>
      </div>
    );
  }

  if (!gameState) return null;

  // Pre-game lobby
  if (gameState.phase === 'lobby') {
    return (
      <RoomLobby
        gameState={gameState}
        myId={myId}
        onStart={startGame}
        onLeave={handleLeave}
      />
    );
  }

  // In-game
  return (
    <GameErrorBoundary>
      <GameTable
        gameState={gameState}
        myId={myId}
        myHand={myHand}
        onPlayCard={playCard}
        onDrawCard={drawCard}
        onSayNova={sayNova}
        onPlayAgain={playAgain}
        onLeave={handleLeave}
      />
    </GameErrorBoundary>
  );
}
