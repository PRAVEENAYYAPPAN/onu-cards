// ─── NOVA CARDS – Colyseus Server Entry ──────────────────────────────────────
import { Server } from 'colyseus';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import { monitor } from '@colyseus/monitor';
import { NovaRoom } from './rooms/NovaRoom';

const port = Number(process.env.PORT ?? 2567);
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Colyseus monitor panel (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use('/colyseus', monitor());
}

app.get('/health', (_req, res) => res.json({ status: 'ok', time: Date.now() }));

const httpServer = createServer(app);
const gameServer = new Server({ server: httpServer });

// Register game rooms
gameServer.define('nova_classic', NovaRoom).filterBy(['isPublic']);

gameServer.listen(port).then(() => {
  console.log(`🚀 NOVA CARDS server running on ws://localhost:${port}`);
});
