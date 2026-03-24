'use client';
// ─── UNO – Game Table (Enhanced) ────────────────────────────────────────
import { useState, useCallback, useRef, useEffect } from 'react';
import type { Card, CardColor, GameState } from '@/lib/types';
import { ColorPicker } from './ColorPicker';
import { WinnerScreen } from './WinnerScreen';
import { TurnTimer } from './TurnTimer';
import { useSoundEngine, getSoundForCard } from '@/hooks/useSoundEngine';

// ─── Constants ────────────────────────────────────────────────────────────────

const TURN_DURATION = 10; // seconds

function isPlayable(card: Card, state: GameState): boolean {
  const top = state.discardPile[state.discardPile.length - 1];
  if (!top) return true;

  if (state.pendingDraw > 0) {
    if (state.activeStackType === 'wild4') return card.value === 'wild4';
    if (state.activeStackType === 'draw2') return card.value === 'draw2' || card.value === 'wild4';
    return false;
  }

  if (card.color === 'wild') return true;
  if (card.value === 'discard_all') return card.color === state.currentColor;

  return card.color === state.currentColor || card.value === top.value;
}

const SYMBOLS: Record<string, string> = {
  skip: '⊘', reverse: '↺', draw2: '+2', wild: '★', wild4: '+4', discard_all: '✹',
};

const EXACT_UNO_COLORS: Record<string, string> = {
  red: '#ff2828',
  blue: '#0055aa',
  green: '#33aa33',
  yellow: '#ffaa00',
  wild: '#111111',
};

// ─── UNO-Style Card Component ─────────────────────────────────────────────────

interface UnoCardProps {
  card: Card;
  playable?: boolean;
  faceDown?: boolean;
  onClick?: () => void;
  isDragging?: boolean;
  animate?: string | null;
}

import { motion, AnimatePresence } from 'framer-motion';

function UnoCard({ card, playable = false, faceDown = false, onClick, isDragging, animate }: UnoCardProps) {
  const label = SYMBOLS[card.value] ?? card.value;
  const bgColor = faceDown ? '#1a1a2e' : (EXACT_UNO_COLORS[card.color] ?? '#111');
  const glow = faceDown ? '#000' : (EXACT_UNO_COLORS[card.color] ?? '#fff');
  const isWild = card.color === 'wild';
  const isAction = ['skip', 'reverse', 'draw2', 'wild', 'wild4', 'discard_all'].includes(card.value);

  // Exact UNO template style with Framer Motion layout support
  return (
    <motion.div
      layoutId={`card-${card.id}`}
      className="uno-card"
      onClick={onClick}
      data-playable={playable || undefined}
      data-dragging={isDragging || undefined}
      data-animate={animate || undefined}
      style={{
        '--card-glow': glow,
        '--card-bg': bgColor,
        position: 'relative',
        borderRadius: 'clamp(6px, 1.2vw, 10px)',
        background: '#ffffff', // White border of UNO card
        border: playable ? `2px solid ${glow}` : '2px solid rgba(0,0,0,0.2)',
        padding: 'clamp(4px, 0.8vw, 6px)', // Creates the white margin
        boxShadow: playable
          ? `0 0 15px ${glow}99, 0 6px 16px rgba(0,0,0,0.5)`
          : '0 4px 12px rgba(0,0,0,0.3)',
        cursor: playable ? 'grab' : 'default',
        userSelect: 'none',
        overflow: 'hidden',
        flexShrink: 0,
        x: 0, y: 0,
      } as React.CSSProperties}
      whileHover={playable ? { y: -24, scale: 1.1, rotate: Math.random() * 4 - 2 } : {}}
      whileTap={playable ? { scale: 0.95 } : {}}
    >
      <div style={{
        position: 'relative',
        width: '100%', height: '100%',
        background: isWild ? 'conic-gradient(from 45deg, #ff2828 25%, #0055aa 25% 50%, #ffaa00 50% 75%, #33aa33 75%)' : bgColor,
        borderRadius: '4px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column',
      }}>
        {!faceDown && (
          <>
            {/* White/Yellowish Oval center — Exact UNO style */}
            <div style={{
              position: 'absolute', inset: '10%',
              borderRadius: '50%',
              background: '#ffffff',
              transform: 'rotate(-25deg)',
              boxShadow: 'inset 0 0 4px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.4)',
            }} />
            
            {/* Inner swoosh for wild cards */}
            {isWild && (
              <div style={{
                position: 'absolute', inset: '15%',
                borderRadius: '50%',
                background: '#111',
                transform: 'rotate(-25deg)',
              }} />
            )}

            {/* Top-left corner */}
            <span className="uno-card__corner" style={{ top: '4%', left: '8%' }}>
              {label}
            </span>
            {/* Center value */}
            <span style={{
              position: 'relative', zIndex: 2,
              fontSize: isAction ? 'clamp(1.4rem, 4vw, 2.2rem)' : 'clamp(2rem, 5.5vw, 3.5rem)',
              fontWeight: 900, 
              color: isWild ? '#ffffff' : bgColor, // Center text matches card color
              textShadow: isWild 
                 ? '0 2px 4px rgba(0,0,0,0.5)'
                 : '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 3px 4px 6px rgba(0,0,0,0.6)',
              lineHeight: 1,
            }}>
              {label}
            </span>
            {/* Bottom-right corner */}
            <span className="uno-card__corner" style={{ bottom: '4%', right: '8%', transform: 'rotate(180deg)' }}>
              {label}
            </span>
          </>
        )}
        {faceDown && (
          <div style={{
            position: 'absolute', inset: '12%',
            borderRadius: '50%', transform: 'rotate(-25deg)',
            background: '#ff2828', // Classic red back
            border: '2px solid #fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
          }}>
            <span style={{
              fontSize: 'clamp(0.7rem, 1.8vw, 1.2rem)', fontWeight: 900,
              color: '#ffe000',
              textShadow: '1px 1px 0 #000',
              letterSpacing: '0.05em',
              transform: 'rotate(25deg)',
            }}>UNO</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Floating Background Cards ────────────────────────────────────────────────
function FloatingCards() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    let width = 0, height = 0;
    const colors = ['rgba(255,77,109,0.1)', 'rgba(76,201,240,0.1)', 'rgba(6,214,160,0.1)', 'rgba(255,209,102,0.1)', 'rgba(124,109,255,0.1)'];
    interface FloatingCard { x: number; y: number; vx: number; vy: number; rot: number; vr: number; scale: number; color: string; }
    let cards: FloatingCard[] = [];

    const resize = () => {
      width = window.innerWidth; height = window.innerHeight;
      canvas.width = width; canvas.height = height;
      if (cards.length === 0) {
        cards = Array.from({ length: 15 }).map(() => ({
          x: Math.random() * width, y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
          rot: Math.random() * 360, vr: (Math.random() - 0.5) * 0.5,
          scale: Math.random() * 0.5 + 0.3,
          color: colors[Math.floor(Math.random() * colors.length)],
        }));
      }
    };

    const frame = () => {
      ctx.clearRect(0, 0, width, height);
      for (const c of cards) {
        c.x += c.vx; c.y += c.vy; c.rot += c.vr;
        if (c.x < -100) c.x = width + 100; if (c.x > width + 100) c.x = -100;
        if (c.y < -100) c.y = height + 100; if (c.y > height + 100) c.y = -100;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot * Math.PI / 180);
        ctx.scale(c.scale, c.scale);
        ctx.fillStyle = c.color;
        ctx.beginPath(); ctx.roundRect(-40, -60, 80, 120, 8); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.beginPath(); ctx.ellipse(0, 0, 30, 50, -25 * Math.PI / 180, 0, 2 * Math.PI); ctx.fill();
        ctx.restore();
      }
      animId = requestAnimationFrame(frame);
    };

    resize(); frame();
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}

// ─── Draw Pile ────────────────────────────────────────────────────────────────

function DrawPile({ count, onClick }: { count: number; onClick?: () => void }) {
  return (
    <div
      id="draw-pile" onClick={onClick}
      className="uno-draw-pile"
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {[3, 2, 1, 0].map(i => (
        <div key={i} className="uno-draw-pile__layer" style={{
          top: -(i * 2), left: i * 1.5, zIndex: i,
        }}>
          {i === 0 && (
            <span style={{
              fontSize: 'clamp(0.5rem, 1.2vw, 0.8rem)', fontWeight: 900,
              color: 'rgba(255,255,255,0.12)',
            }}>UNO</span>
          )}
        </div>
      ))}
      <div className="uno-draw-pile__badge">{count}</div>
    </div>
  );
}

// ─── Player Seat ──────────────────────────────────────────────────────────────

const BOT_ICONS = ['🦊', '🐺', '🦅', '🐉', '🦋', '🌟', '🎯'];
const HUMAN_ICONS = ['⚡', '🔥', '💫', '🌙', '🎮', '👑', '🚀'];

interface PlayerSeatProps {
  name: string; isBot: boolean; isActive: boolean;
  cardCount: number; isMe: boolean;
  timerActive?: boolean;
  timerDuration?: number;
  onTimerTick?: (remaining: number) => void;
  onTimerTimeout?: () => void;
}

function PlayerSeat({
  name, isBot, isActive, cardCount, isMe,
  timerActive, timerDuration = TURN_DURATION,
  onTimerTick, onTimerTimeout,
  direction, // Added to orient the arrow
}: PlayerSeatProps & { direction: 'cw' | 'ccw' }) {
  const seed = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 7;
  const emoji = isBot ? BOT_ICONS[seed] : HUMAN_ICONS[seed];

  return (
    <div className={`uno-seat ${isActive ? 'uno-seat--active' : ''} ${isMe ? 'uno-seat--me' : ''}`}>
      {/* Timer ring wraps avatar */}
      <div style={{ position: 'relative' }}>
        {isActive && (
          <motion.div
            layoutId="active-turn-indicator"
            className="uno-turn-indicator-linear"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          >
            {/* The arrow points in the current play direction */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{
              transform: `rotate(${direction === 'cw' ? '0' : '180'}deg)`
            }}>
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </motion.div>
        )}
        {timerActive && (
          <div style={{ position: 'absolute', top: -4, left: -4, zIndex: 5 }}>
            <TurnTimer
              duration={timerDuration}
              isActive={timerActive}
              onTick={onTimerTick}
              onTimeout={onTimerTimeout}
              size={60}
            />
          </div>
        )}
        <div className="uno-seat__avatar">
          {emoji}
          {isBot && <div className="uno-seat__bot-badge">BOT</div>}
        </div>
      </div>
      <span className="uno-seat__name">
        {name}{isMe ? ' (You)' : ''}
      </span>
      <span className="uno-seat__count">
        {cardCount} card{cardCount !== 1 ? 's' : ''}
      </span>
      {/* Mini card fan */}
      <div className="uno-seat__cards">
        {Array.from({ length: Math.min(cardCount, 20) }).map((_, i) => (
          <div key={i} className="uno-seat__mini-card" style={{
            marginLeft: i > 0 ? 'clamp(-20px, -2vw, -12px)' : 0, zIndex: i,
          }} />
        ))}
      </div>
    </div>
  );
}

// ─── GameTable ────────────────────────────────────────────────────────────────

interface GameTableProps {
  gameState: GameState;
  myId: string;
  myHand: Card[];
  onPlayCard: (cardId: string, chosenColor?: CardColor) => void;
  onDrawCard: () => void;
  onSayNova: () => void;
  onPlayAgain: () => void;
  onLeave: () => void;
}

export function GameTable({
  gameState, myId, myHand, onPlayCard, onDrawCard, onSayNova, onPlayAgain, onLeave,
}: GameTableProps) {
  const [pendingWild, setPendingWild] = useState<string | null>(null);
  const [playingCard, setPlayingCard] = useState<{ id: string, type: string } | null>(null);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [animTrigger, setAnimTrigger] = useState<{ type: 'play' | 'draw', card?: Card } | null>(null);
  const [saidUno, setSaidUno] = useState(false);
  const { play: playSound } = useSoundEngine();
  const lastTurnIndexRef = useRef(gameState.currentPlayerIndex);
  const lastTopCardIdRef = useRef<string | null>(null);
  const lastDrawCountRef = useRef(gameState.drawPileCount ?? 108);
  const touchStartRef = useRef<{ id: string; y: number; card: Card } | null>(null);

  const me = gameState.players.find(p => p.id === myId);
  const others = gameState.players.filter(p => p.id !== myId);
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === myId;
  const isBotTurn = currentPlayer?.type === 'bot';
  const topCard = gameState.discardPile[gameState.discardPile.length - 1];
  const isHost = gameState.hostId === myId;
  const shouldShowUno = myHand.length === 2 && isMyTurn;

  // Turn change & remote animation checks
  useEffect(() => {
    // Check for opponent play
    const topCard = gameState.discardPile[gameState.discardPile.length - 1];
    if (topCard && lastTopCardIdRef.current && topCard.id !== lastTopCardIdRef.current) {
        // Did *I* play it? (I set playingCard during my animation)
        if (!playingCard) {
          setAnimTrigger({ type: 'play', card: topCard });
          playSound(getSoundForCard(topCard.value));
          setTimeout(() => setAnimTrigger(null), 400);
        }
    }
    lastTopCardIdRef.current = topCard?.id;

    // Check for draw
    const newDrawCount = gameState.drawPileCount ?? 108;
    if (newDrawCount < lastDrawCountRef.current && !playingCard) {
        setAnimTrigger({ type: 'draw' });
        playSound('cardDraw');
        setTimeout(() => setAnimTrigger(null), 400);
    }
    lastDrawCountRef.current = newDrawCount;

    if (gameState.currentPlayerIndex !== lastTurnIndexRef.current) {
      lastTurnIndexRef.current = gameState.currentPlayerIndex;
      playSound('turnChange');
    }
  }, [gameState.discardPile, gameState.currentPlayerIndex, gameState.drawPileCount, playSound, playingCard]);

  // Reset UNO state when hand changes
  useEffect(() => {
    if (myHand.length > 2) setSaidUno(false);
  }, [myHand.length]);

  // ── Play card with animation ──────────────────────────────────────────────
  const handlePlayCardAnimated = useCallback((card: Card) => {
    // UNO penalty checked by server, but we allow play
    const animType = card.value === 'draw2' ? 'attack' :
                     card.value === 'wild4' ? 'impact' :
                     card.value === 'skip' ? 'swipe' :
                     card.value === 'reverse' ? 'rotate' :
                     card.color === 'wild' ? 'burst' : 'normal';

    setPlayingCard({ id: card.id, type: animType });
    playSound('cardRelease');
    setTimeout(() => playSound(getSoundForCard(card.value)), 100);

    // Bounce effect delay to match landing
    setTimeout(() => {
      const discard = document.querySelector('.uno-discard');
      if (discard) {
        discard.classList.remove('bounce');
        void (discard as HTMLElement).offsetWidth; // trigger reflow
        discard.classList.add('bounce');
      }
    }, 350);

    // Animate card → center, then play
    setTimeout(() => {
      setPlayingCard(null);
      if (card.color === 'wild') {
        setPendingWild(card.id);
      } else {
        onPlayCard(card.id);
      }
    }, 450); // increased timeout to allow visual landing
  }, [onPlayCard, playSound]);

  // ── Click to play ─────────────────────────────────────────────────────────
  const handleCardClick = useCallback((card: Card) => {
    if (!isMyTurn) return;
    if (!isPlayable(card, gameState)) return;
    handlePlayCardAnimated(card);
  }, [isMyTurn, gameState, handlePlayCardAnimated]);

  const handleColorChosen = useCallback((color: CardColor) => {
    if (!pendingWild) return;
    playSound('magic');
    onPlayCard(pendingWild, color);
    setPendingWild(null);
  }, [pendingWild, onPlayCard, playSound]);

  // ── Swipe to play (touch/mouse) ─────────────────────────────────────────
  const handleDragStart = useCallback((card: Card, e: React.TouchEvent | React.MouseEvent) => {
    if (!isMyTurn || !isPlayable(card, gameState)) return;
    playSound('cardPick');
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
    touchStartRef.current = { id: card.id, y, card };
    setDraggedCardId(card.id);
  }, [isMyTurn, gameState, playSound]);

  const handleDragEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    setDraggedCardId(null);
    if (!touchStartRef.current) return;
    const y = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;
    const deltaY = touchStartRef.current.y - y;
    if (deltaY > 40) { // Swiped up gently — auto play
      handlePlayCardAnimated(touchStartRef.current.card);
    } else {
      playSound('cardRelease'); // just put it back
    }
    touchStartRef.current = null;
  }, [handlePlayCardAnimated, playSound]);

  // ── Draw card ─────────────────────────────────────────────────────────────
  const handleDrawCard = useCallback(() => {
    playSound('cardDraw');
    onDrawCard();
  }, [onDrawCard, playSound]);

  // ── Timer timeout — auto play or draw ─────────────────────────────────────
  const handleTimerTimeout = useCallback(() => {
    if (!isMyTurn) return;
    // Try to play any valid card
    const playableCard = myHand.find(c => isPlayable(c, gameState));
    if (playableCard) {
      handlePlayCardAnimated(playableCard);
    } else {
      handleDrawCard();
    }
  }, [isMyTurn, myHand, gameState, handlePlayCardAnimated, handleDrawCard]);

  // ── Timer tick — sound at 3 seconds ───────────────────────────────────────
  const handleTimerTick = useCallback((remaining: number) => {
    if (remaining <= 3 && remaining > 0 && Math.ceil(remaining) === Math.ceil(remaining + 0.05)) {
      playSound('tick');
    }
  }, [playSound]);

  // ── UNO button ────────────────────────────────────────────────────────────
  const handleSayUno = useCallback(() => {
    setSaidUno(true);
    playSound('unoCall');
    onSayNova();
  }, [onSayNova, playSound]);

  // ── Match Timer ───────────────────────────────────────────────────────────
  const [matchTimeLeft, setMatchTimeLeft] = useState<string>('');
  useEffect(() => {
    if (!gameState.matchDurationInMinutes || !gameState.matchStartedAt) return;
    const endMs = gameState.matchStartedAt + gameState.matchDurationInMinutes * 60000;
    
    const interval = setInterval(() => {
      const remain = Math.max(0, endMs - Date.now());
      if (remain === 0) {
        setMatchTimeLeft('00:00');
        clearInterval(interval);
      } else {
        const m = Math.floor(remain / 60000);
        const s = Math.floor((remain % 60000) / 1000);
        setMatchTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState.matchDurationInMinutes, gameState.matchStartedAt]);

  return (
    <div className="uno-table">
      {/* ── Background Animations ──────────────────────────────────────────── */}
      <FloatingCards />

      {/* ── HUD ────────────────────────────────────────────────────────────── */}
      <div className="uno-hud" style={{ zIndex: 2 }}>
        <span className="uno-hud__label">ROOM</span>
        <span className="uno-hud__code">{gameState.roomCode}</span>
        <div className="uno-hud__sep" />
        <span style={{ fontSize: '0.9rem' }}>{gameState.direction === 'cw' ? '🔄' : '🔃'}</span>
        <div className="uno-hud__color">
          <div className="uno-hud__dot" style={{
            background: EXACT_UNO_COLORS[gameState.currentColor] ?? EXACT_UNO_COLORS.wild,
            boxShadow: `0 0 8px ${EXACT_UNO_COLORS[gameState.currentColor] ?? '#fff'}`,
          }} />
          <span>{gameState.currentColor}</span>
        </div>
        {gameState.pendingDraw > 0 && (
          <span style={{ color: '#ff3b5c', fontWeight: 800 }}>+{gameState.pendingDraw}💥</span>
        )}
        {matchTimeLeft && (
          <>
            <div className="uno-hud__sep" />
            <span style={{ color: '#ffd166', fontWeight: 800 }}>⏱ {matchTimeLeft}</span>
          </>
        )}
      </div>

      {/* ── Opponents ──────────────────────────────────────────────────────── */}
      <div className="uno-opponents" style={{ zIndex: 10 }}>
        {others.map(player => (
          <PlayerSeat
            key={player.id} name={player.name} isBot={player.type === 'bot'}
            isActive={currentPlayer?.id === player.id}
            cardCount={player.handCount} isMe={false}
            timerActive={currentPlayer?.id === player.id && gameState.phase === 'playing'}
            timerDuration={TURN_DURATION}
            direction={gameState.direction}
          />
        ))}
      </div>

      {/* ── Side Pending Draw Stack ───────────────────────────────────────── */}
      <div className="uno-side-stack-area">
        <div style={{ position: 'relative' }}>
          <AnimatePresence>
            {gameState.pendingDraw > 0 && Array.from({ length: Math.min(gameState.pendingDraw, 12) }).map((_, i) => (
              <motion.div
                key={`p-stack-${i}`}
                initial={{ opacity: 0, scale: 0.2, x: 200 }}
                animate={{ opacity: 1, scale: 1, x: 0, y: -(i * 4), rotate: (i % 3) * 3 }}
                exit={{ 
                   opacity: 0, 
                   y: currentPlayer?.id === myId ? 600 : -600, // Fly to target player
                   scale: 0.5,
                   transition: { duration: 0.6, delay: i * 0.05, ease: "anticipate" }
                }}
                transition={{ type: 'spring', stiffness: 100, damping: 15, delay: i * 0.05 }}
                className="uno-pending-card-visual"
              >
                <div className="uno-mini-card-back" />
              </motion.div>
            ))}
          </AnimatePresence>
          {gameState.pendingDraw > 0 && (
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="uno-stack-label"
             >
               +{gameState.pendingDraw} PENALTY
             </motion.div>
          )}
        </div>
      </div>

      {/* ── Center: Draw + Discard ─────────────────────────────────────────── */}
      <div className="uno-center" style={{ zIndex: 5, position: 'relative' }}>
        
        {/* Draw Pile */}
        <div id="deck-root">
           <DrawPile count={gameState.drawPileCount ?? 108} onClick={isMyTurn ? handleDrawCard : undefined} />
        </div>

        {/* Discard Pile */}
        <div className="uno-discard">
          {topCard && <UnoCard card={topCard} />}
        </div>
      </div>

      {/* ── Opponent Animation Overlays ────────────────────────────────────── */}
      {animTrigger?.type === 'play' && animTrigger.card && (
        <div style={{
          position: 'absolute', top: '15%', left: '50%', zIndex: 999,
          animation: 'opponent-play-drop 400ms cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        }}>
          <UnoCard card={animTrigger.card} />
        </div>
      )}
      {animTrigger?.type === 'draw' && (
        <div 
          className={isMyTurn ? "uno-draw-fly-to-hand" : "uno-draw-fly-to-opp"}
          style={{
            position: 'absolute', top: '50%', left: '50%', zIndex: 999,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <UnoCard card={{ id: 'anim-draw', value: '0', color: 'red' } as Card} faceDown />
        </div>
      )}

      {/* ── Status overlays ────────────────────────────────────────────────── */}
      {isBotTurn && (
        <div className="uno-bot-thinking">
          🤖 {currentPlayer?.name} is thinking…
        </div>
      )}

      {/* ── Bottom section ─────────────────────────────────────────────────── */}
      <div className="uno-bottom">

        {/* YOUR TURN */}
        {isMyTurn && (
          <div className="uno-turn-banner">✨ YOUR TURN</div>
        )}

        {/* Hint */}
        {isMyTurn && (
          <div className="uno-hint">Tap a card or swipe up to play ↑</div>
        )}

        {/* Action bar */}
        <div className="uno-actions">
          <div className="uno-actions__left">
            {me && (
              <PlayerSeat
                name={me.name} isBot={false} isActive={isMyTurn}
                cardCount={myHand.length} isMe
                timerActive={isMyTurn}
                timerDuration={TURN_DURATION}
                onTimerTick={handleTimerTick}
                onTimerTimeout={handleTimerTimeout}
                direction={gameState.direction}
              />
            )}
          </div>

          <div className="uno-actions__center">
            {/* UNO Button (show when 2 cards) */}
            {shouldShowUno && !saidUno && (
              <button className="uno-btn uno-btn--uno" onClick={handleSayUno} id="btn-say-uno">
                🔥 UNO!
              </button>
            )}
            {saidUno && shouldShowUno && (
              <span className="uno-uno-said">✓ UNO called!</span>
            )}
            {isMyTurn && (
              <button className="uno-btn uno-btn--draw" onClick={handleDrawCard} id="btn-draw-action">
                📥 Draw
              </button>
            )}
          </div>

          <div className="uno-actions__right">
            <button className="uno-btn uno-btn--leave" onClick={onLeave}>Leave</button>
          </div>
        </div>

        {/* ── Hand ──────────────────────────────────────────────────────────── */}
        <div className="uno-hand" id="player-hand">
          {myHand.map((card, i) => {
            const playable = isMyTurn && isPlayable(card, gameState);
            const isPlaying = playingCard?.id === card.id;
            const isDragged = draggedCardId === card.id;
            return (
              <div
                key={card.id}
                className={`uno-hand__slot ${playable ? 'uno-hand__slot--playable' : ''} ${isPlaying ? `uno-hand__slot--playing-${playingCard.type}` : ''} ${isDragged ? 'uno-hand__slot--dragged' : ''}`}
                style={{
                  marginLeft: i === 0 ? 0 : 'clamp(-22px, -3vw, -12px)',
                  zIndex: isPlaying ? 1000 : playable ? 10 + i : i,
                }}
                onTouchStart={e => handleDragStart(card, e)}
                onTouchEnd={handleDragEnd}
                onMouseDown={e => handleDragStart(card, e)}
                onMouseUp={handleDragEnd}
                onMouseLeave={e => { if (draggedCardId === card.id) handleDragEnd(e); }}
              >
                <UnoCard
                  card={card}
                  playable={playable}
                  isDragging={isDragged}
                  animate={isPlaying ? playingCard.type : null}
                  onClick={() => {
                    if (!draggedCardId) handleCardClick(card); // Click play fallback
                  }}
                />
              </div>
            );
          })}
          {myHand.length === 0 && (
            <p className="uno-hand__empty">No cards — you won! 🎉</p>
          )}
        </div>
      </div>

      {/* ── Overlays ───────────────────────────────────────────────────────── */}
      <ColorPicker open={!!pendingWild} onSelect={handleColorChosen} />

      {gameState.phase === 'ended' && gameState.winnerId && (
        <WinnerScreen
          winnerId={gameState.winnerId}
          winnerName={gameState.players.find(p => p.id === gameState.winnerId)?.name ?? 'Unknown'}
          isMe={gameState.winnerId === myId}
          scores={gameState.lastMatchScores}
          onPlayAgain={onPlayAgain} onLeave={onLeave} isHost={isHost}
        />
      )}
    </div>
  );
}
