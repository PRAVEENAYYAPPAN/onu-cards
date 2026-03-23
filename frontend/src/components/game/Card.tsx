'use client';
// ─── NOVA CARDS – Card Component ─────────────────────────────────────────────
import { motion } from 'framer-motion';
import type { Card, CardColor } from '@/lib/types';

const CARD_SYMBOLS: Record<string, string> = {
  skip: '⊘',
  reverse: '↺',
  draw2: '+2',
  wild: '★',
  wild4: '+4',
};

const COLOR_GLOW: Record<CardColor, string> = {
  red: 'rgba(255,59,92,0.6)',
  blue: 'rgba(30,143,255,0.6)',
  green: 'rgba(0,214,143,0.6)',
  yellow: 'rgba(255,212,38,0.6)',
  wild: 'rgba(124,109,255,0.6)',
};

interface CardProps {
  card: Card;
  isPlayable?: boolean;
  isSelected?: boolean;
  faceDown?: boolean;
  onClick?: () => void;
  layoutId?: string;
  style?: React.CSSProperties;
  small?: boolean;
}

export function NovaCard({
  card,
  isPlayable = false,
  isSelected = false,
  faceDown = false,
  onClick,
  layoutId,
  style,
  small,
}: CardProps) {
  const displayValue = CARD_SYMBOLS[card.value] ?? card.value;
  const colorClass = faceDown ? 'nova-card--back' : `nova-card--${card.color}`;

  return (
    <motion.div
      layoutId={layoutId}
      className={[
        'nova-card gpu',
        colorClass,
        isPlayable && !faceDown ? 'nova-card--playable' : '',
        !isPlayable && !faceDown && onClick ? 'nova-card--disabled' : '',
        isSelected ? 'nova-card--selected' : '',
        small ? 'nova-card--small' : '',
      ].join(' ')}
      style={{ ...style }}
      onClick={isPlayable || faceDown ? onClick : undefined}
      whileHover={isPlayable && !faceDown ? { y: -14, scale: 1.05, rotate: -1 } : {}}
      whileTap={isPlayable && !faceDown ? { scale: 0.95 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {!faceDown && (
        <>
          <span className="nova-card__corner nova-card__corner--tl">{displayValue}</span>
          <div className="nova-card__inner">
            <span
              className="nova-card__value"
              style={{ fontSize: card.color === 'wild' ? '1.1rem' : undefined }}
            >
              {displayValue}
            </span>
          </div>
          <span className="nova-card__corner nova-card__corner--br">{displayValue}</span>

          {/* Playable glow ring */}
          {isPlayable && (
            <motion.div
              style={{
                position: 'absolute', inset: -3,
                borderRadius: 15,
                border: `2px solid ${COLOR_GLOW[card.color]}`,
                boxShadow: `0 0 12px ${COLOR_GLOW[card.color]}`,
                pointerEvents: 'none',
              }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </>
      )}
    </motion.div>
  );
}

// ─── Stack of face-down cards (draw pile visual) ──────────────────────────────
export function CardStack({ count }: { count: number }) {
  const visible = Math.min(count, 4);
  return (
    <div style={{ position: 'relative', width: 72, height: 108 }}>
      {Array.from({ length: visible }).map((_, i) => (
        <div
          key={i}
          className="nova-card nova-card--back gpu"
          style={{
            position: 'absolute',
            top: -(i * 2),
            left: i * 1.5,
            zIndex: i,
          }}
        />
      ))}
      {/* draw count badge */}
      <div style={{
        position: 'absolute', bottom: -12, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(124,109,255,0.3)',
        border: '1px solid rgba(124,109,255,0.4)',
        borderRadius: '100px',
        padding: '2px 8px',
        fontSize: '0.65rem',
        fontWeight: 700,
        color: '#a79eff',
        whiteSpace: 'nowrap',
      }}>
        {count} left
      </div>
    </div>
  );
}
