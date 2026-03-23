'use client';
// ─── NOVA CARDS – Color Picker overlay ───────────────────────────────────────
import { motion, AnimatePresence } from 'framer-motion';
import type { CardColor } from '@/lib/types';

const COLORS: { color: CardColor; label: string; bg: string }[] = [
  { color: 'red',    label: '🔴 Red',    bg: 'linear-gradient(135deg, #ff3b5c, #c41e3a)' },
  { color: 'blue',   label: '🔵 Blue',   bg: 'linear-gradient(135deg, #1e8fff, #0052cc)' },
  { color: 'green',  label: '🟢 Green',  bg: 'linear-gradient(135deg, #00d68f, #007a52)' },
  { color: 'yellow', label: '🟡 Yellow', bg: 'linear-gradient(135deg, #ffd426, #c99b00)' },
];

interface ColorPickerProps {
  open: boolean;
  onSelect: (color: CardColor) => void;
}

export function ColorPicker({ open, onSelect }: ColorPickerProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="color-picker"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="color-picker__panel"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>
              Choose a color
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginBottom: 16 }}>
              Your wild card — pick wisely
            </p>
            <div className="color-options">
              {COLORS.map(({ color, label, bg }) => (
                <motion.button
                  key={color}
                  onClick={() => onSelect(color)}
                  style={{
                    background: bg,
                    border: 'none',
                    borderRadius: 16,
                    padding: '16px 24px',
                    cursor: 'pointer',
                    color: 'white',
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    minWidth: 120,
                  }}
                  whileHover={{ scale: 1.06, y: -3 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  {label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
