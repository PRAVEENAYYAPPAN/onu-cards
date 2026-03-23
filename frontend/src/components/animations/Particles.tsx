'use client';
// ─── NOVA CARDS – Particle Effects Canvas ────────────────────────────────────
import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
  color: string;
  opacity: number;
}

const CELEBRATION_COLORS = ['#7c6dff', '#ff3b5c', '#ffd426', '#00d68f', '#1e8fff', '#f5c842'];

export function ParticleCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  const spawnBurst = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 8;
      particlesRef.current.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        life: 1, maxLife: 1,
        size: 4 + Math.random() * 8,
        color: CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)],
        opacity: 1,
      });
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Burst immediately + a second burst
    spawnBurst();
    const t2 = setTimeout(spawnBurst, 400);
    const t3 = setTimeout(spawnBurst, 800);

    const animate = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.vx *= 0.98; // drag
        p.life -= 0.012;
        p.opacity = p.life;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;

        // Alternate between circles and rectangles
        if (p.size > 8) {
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(t2);
      clearTimeout(t3);
      particlesRef.current = [];
    };
  }, [active, spawnBurst]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 250,
        willChange: 'transform',
      }}
    />
  );
}

// ─── Floating "+2" / "Skip" effect text ──────────────────────────────────────
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export function useFloatingText() {
  const [texts, setTexts] = useState<Array<{ id: number; text: string; x: number; y: number; color: string }>>([]);

  const spawn = useCallback((text: string, x: number, y: number, color = '#7c6dff') => {
    const id = Date.now();
    setTexts(t => [...t, { id, text, x, y, color }]);
    setTimeout(() => setTexts(t => t.filter(i => i.id !== id)), 1200);
  }, []);

  const FloatingTexts = () => (
    <AnimatePresence>
      {texts.map(txt => (
        <motion.div
          key={txt.id}
          style={{
            position: 'fixed',
            left: txt.x,
            top: txt.y,
            transform: 'translate(-50%, -50%)',
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 900,
            fontSize: '1.8rem',
            color: txt.color,
            textShadow: `0 0 20px ${txt.color}`,
            pointerEvents: 'none',
            zIndex: 400,
          }}
          initial={{ opacity: 1, y: 0, scale: 0.5 }}
          animate={{ opacity: 0, y: -80, scale: 1.3 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          {txt.text}
        </motion.div>
      ))}
    </AnimatePresence>
  );

  return { spawn, FloatingTexts };
}
