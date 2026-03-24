import type { Metadata } from 'next';
import { Outfit, Space_Grotesk } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-outfit',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'UNO – Multiplayer Card Game',
  description: 'Fast, smooth, and colorful multiplayer card game. Play with friends or bots. No downloads required.',
  keywords: ['card game', 'multiplayer', 'online', 'free', 'browser game', 'UNO'],
  openGraph: {
    title: 'UNO',
    description: 'The ultimate multiplayer card game in your browser',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${outfit.variable} ${spaceGrotesk.variable}`}>
      <body suppressHydrationWarning>
        <div className="nova-bg" />
        <main style={{ position: 'relative', zIndex: 1, height: '100dvh' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
