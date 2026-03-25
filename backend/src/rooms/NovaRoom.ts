// ─── NOVA CARDS – Colyseus Room ───────────────────────────────────────────────
import { Room, Client } from 'colyseus';
import type { Card, CardColor, Player, RoomOptions } from '../../../shared/src/types/index';
import { buildClassicDeck, shuffle } from '../../../shared/src/engine/Deck';
import { isPlayable, resolvePlay, nextIndex, checkWin } from '../../../shared/src/engine/Rules';
import { botDecide, botDelay } from '../bots/BotPlayer';

function calculateUnoScores(players: Player[]) {
  const scores = players.map(p => {
     let score = 0;
     for (const c of p.hand) {
        const val = parseInt(c.value);
        if (!isNaN(val)) score += val;
        else if (['skip', 'reverse', 'draw2'].includes(c.value)) score += 20;
        else if (['wild', 'wild4', 'discard_all'].includes(c.value)) score += 50;
     }
     return { playerId: p.id, name: p.name, score };
  });
  scores.sort((a, b) => a.score - b.score);
  return scores;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ServerGameState {
  roomCode: string;
  mode: 'classic';
  players: Player[];
  currentPlayerIndex: number;
  direction: 'cw' | 'ccw';
  drawPile: Card[];
  discardPile: Card[];
  currentColor: CardColor;
  pendingDraw: number;
  activeStackType: 'draw2' | 'wild4' | null;
  phase: 'lobby' | 'dealing' | 'playing' | 'ended';
  winnerId: string | null;
  hostId: string;
  isPublic: boolean;
  turnStartedAt: number;
  matchDurationInMinutes: number;
  matchStartedAt: number;
}

const BOT_NAMES = ['Aria', 'Blaze', 'Cipher', 'Dusk', 'Echo', 'Flux', 'Ghost'];

// ─────────────────────────────────────────────────────────────────────────────

export class NovaRoom extends Room {
  maxClients = 7;
  private gs!: ServerGameState;
  private botTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private watchdog?: ReturnType<typeof setInterval>;
  private actionTimer?: ReturnType<typeof setTimeout>;

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  onCreate(options: RoomOptions & { name?: string }) {
    const code = options.roomCode ?? this.generateCode();
    this.roomId = code;

    this.gs = {
      roomCode: code,
      mode: 'classic',
      players: [],
      currentPlayerIndex: 0,
      direction: 'cw',
      drawPile: [],
      discardPile: [],
      currentColor: 'red',
      pendingDraw: 0,
      activeStackType: null,
      phase: 'lobby',
      winnerId: null,
      hostId: '',
      isPublic: options.isPublic ?? false,
      turnStartedAt: Date.now(),
      matchDurationInMinutes: options.matchDuration ?? 0,
      matchStartedAt: 0,
    };

    const maxPlayers = options.maxPlayers ?? 5;
    this.maxClients = maxPlayers;

    // Pre-add bots (leave at least 1 slot for the human host)
    const botCount = Math.min(options.botCount ?? 0, maxPlayers - 1);
    for (let i = 0; i < botCount; i++) {
      this.addBot(i);
    }

    // Message handlers — wrapped in try/catch to survive parse errors
    this.onMessage('START_GAME', (client) => {
      try { this.handleStartGame(client); } catch (e) { console.error('START_GAME error:', e); }
    });
    this.onMessage('PLAY_CARD', (client, msg) => {
      try { this.handlePlayCard(client, msg); } catch (e) { console.error('PLAY_CARD error:', e); }
    });
    this.onMessage('DRAW_CARD', (client) => {
      try { this.handleDrawCard(client); } catch (e) { console.error('DRAW_CARD error:', e); }
    });
    this.onMessage('SAY_NOVA', (client) => {
      try { this.handleSayNova(client); } catch (e) { console.error('SAY_NOVA error:', e); }
    });
    this.onMessage('KEEP_CARD', (client) => {
      try { this.handleKeepCard(client); } catch (e) { console.error('KEEP_CARD error:', e); }
    });
    this.onMessage('PLAY_AGAIN', (client) => {
      try { this.handlePlayAgain(client); } catch (e) { console.error('PLAY_AGAIN error:', e); }
    });

    // Watchdog: match timer check and re-trigger stuck bot every 4s
    this.watchdog = setInterval(() => {
      if (this.gs.phase !== 'playing') return;

      // Check Match Timer
      if (this.gs.matchDurationInMinutes > 0 && this.gs.matchStartedAt > 0) {
        const elapsedMinutes = (Date.now() - this.gs.matchStartedAt) / 60000;
        if (elapsedMinutes >= this.gs.matchDurationInMinutes) {
          // Timer ended! Calculate UNO points for each player
          const scores = calculateUnoScores(this.gs.players as any);
          const winnerId = scores[0].playerId;

          this.gs.winnerId = winnerId;
          this.gs.phase = 'ended';
          this.gs.pendingDraw = 0;
          (this.gs as any).lastMatchScores = scores;
          this.broadcast('GAME_OVER', { winnerId, scores });
          this.broadcastState();
          return; // Skip rest of watchdog
        }
      }

      const current = this.gs.players[this.gs.currentPlayerIndex];
      if (!current) return;
      if ((current.type === 'bot' || !current.connected) && !this.botTimers.has(current.id)) {
        console.log(`[watchdog] Re-triggering stuck turn: ${current.name}`);
        this.scheduleBotTurn(current.id);
      }
    }, 4000);
  }

  onJoin(client: Client, options: { name?: string }) {
    // Reconnect path
    if (this.gs.phase !== 'lobby') {
      const slot = this.gs.players.find(p => !p.connected && p.type === 'human');
      if (slot) {
        slot.connected = true;
        slot.id = client.sessionId;
        this.broadcastState();
        return;
      }
    }

    const humanPlayers = this.gs.players.filter(p => p.type === 'human');
    const isFirst = humanPlayers.length === 0;

    const player: Player = {
      id: client.sessionId,
      name: options?.name ?? `Player${humanPlayers.length + 1}`,
      type: 'human',
      hand: [],
      handCount: 0,
      connected: true,
      saidNova: false,
    };
    this.gs.players.push(player);

    if (isFirst) this.gs.hostId = client.sessionId;
    this.broadcastState();
  }

  onLeave(client: Client, consented: boolean) {
    const player = this.gs.players.find(p => p.id === client.sessionId);
    if (!player) return;

    if (this.gs.phase === 'playing') {
      if (consented) {
        player.type = 'bot';
        player.name = `${player.name} (Bot)`;
        this.scheduleNextTurn();
      } else {
        player.connected = false;
      }
    } else {
      this.gs.players = this.gs.players.filter(p => p.id !== client.sessionId);
    }

    this.broadcastState();
  }

  onDispose() {
    this.botTimers.forEach(t => clearTimeout(t));
    this.botTimers.clear();
    if (this.watchdog) clearInterval(this.watchdog);
    if (this.actionTimer) clearTimeout(this.actionTimer);
  }

  // ── Game Logic ────────────────────────────────────────────────────────────

  private handleStartGame(client: Client) {
    if (this.gs.hostId !== client.sessionId) return;
    if (this.gs.phase !== 'lobby') return;
    this.dealGame();
  }

  private dealGame() {
    this.gs.phase = 'dealing';
    this.broadcastState();

    const deck = buildClassicDeck();
    this.gs.drawPile = deck;

    for (const player of this.gs.players) {
      player.hand = [];
      for (let i = 0; i < 7; i++) {
        const card = this.gs.drawPile.pop();
        if (card) player.hand.push(card);
      }
      player.handCount = player.hand.length;
    }

    let firstCard!: Card;
    do {
      const c = this.gs.drawPile.pop();
      if (!c) break;
      firstCard = c;
    } while (firstCard.color === 'wild');

    this.gs.discardPile = [firstCard];
    this.gs.currentColor = firstCard.color;
    this.gs.currentPlayerIndex = 0;
    this.gs.direction = 'cw';
    this.gs.pendingDraw = 0;
    this.gs.activeStackType = null;
    this.gs.matchStartedAt = Date.now();
    this.gs.turnStartedAt = Date.now();
    this.gs.phase = 'playing';

    this.broadcastState();
    this.scheduleNextTurn();
  }

  private handlePlayCard(client: Client, msg: { cardId: string; chosenColor?: CardColor }) {
    if (this.gs.phase !== 'playing') return;

    const player = this.gs.players[this.gs.currentPlayerIndex];
    if (!player || player.id !== client.sessionId) return;

    const cardIdx = player.hand.findIndex(c => c.id === msg.cardId);
    if (cardIdx === -1) return;

    const card = player.hand[cardIdx];
    if (!isPlayable(card, this.gs as any)) return;

    if (this.actionTimer) { clearTimeout(this.actionTimer); this.actionTimer = undefined; }

    // UNO Penalty Check!
    if (player.hand.length === 2 && !player.saidNova) {
      // Penalty: +2 cards for forgetting to say UNO (Nova)
      this.forceDraw(player, 2);
    }

    // Now remove the card from player hand
    player.hand.splice(player.hand.findIndex(c => c.id === card.id), 1);

    // Discard All logic
    if (card.value === 'discard_all') {
      const remainingHand = player.hand.filter(c => c.color !== card.color);
      const discarded = player.hand.filter(c => c.color === card.color);
      player.hand = remainingHand;
      this.gs.discardPile.push(...discarded);
    }

    player.handCount = player.hand.length;
    this.gs.discardPile.push(card);

    const result = resolvePlay(card, msg.chosenColor, this.gs as any, this.gs.players.length);
    this.gs.currentColor = result.newColor;
    this.gs.activeStackType = result.activeStackType;
    this.gs.turnStartedAt = Date.now();

    if (result.reversal) {
      this.gs.direction = this.gs.direction === 'cw' ? 'ccw' : 'cw';
    }

    this.broadcast('CARD_PLAYED', { playerId: player.id, cardId: card.id, chosenColor: result.newColor });

    if (checkWin(player.hand)) {
      this.gs.winnerId = player.id;
      this.gs.phase = 'ended';
      this.gs.pendingDraw = 0;
      const scores = calculateUnoScores(this.gs.players as any);
      (this.gs as any).lastMatchScores = scores;
      this.broadcast('GAME_OVER', { winnerId: player.id, scores });
      this.broadcastState();
      return;
    }

    // Advance turn with skip/draw logic
    if (result.skipNext && result.draw > 0) {
      // draw2/wild4: force-draw next player and skip them
      const nextIdx = nextIndex(this.gs.currentPlayerIndex, this.gs.players.length, this.gs.direction);
      const nextPlayer = this.gs.players[nextIdx];
      if (nextPlayer) this.forceDraw(nextPlayer, result.draw);
      this.gs.pendingDraw = 0;
      this.gs.currentPlayerIndex = nextIndex(nextIdx, this.gs.players.length, this.gs.direction);
    } else if (result.skipNext) {
      this.gs.pendingDraw = 0;
      this.gs.currentPlayerIndex = nextIndex(
        this.gs.currentPlayerIndex, this.gs.players.length, this.gs.direction, true
      );
    } else if (result.draw > 0) {
      // Stacking: send pending draw to next player
      this.gs.pendingDraw = result.draw;
      this.gs.currentPlayerIndex = nextIndex(
        this.gs.currentPlayerIndex, this.gs.players.length, this.gs.direction
      );
    } else {
      this.gs.pendingDraw = 0;
      this.gs.currentPlayerIndex = nextIndex(
        this.gs.currentPlayerIndex, this.gs.players.length, this.gs.direction
      );
    }

    this.broadcastState();
    this.scheduleNextTurn();
  }

  private handleDrawCard(client: Client) {
    if (this.gs.phase !== 'playing') return;

    const player = this.gs.players[this.gs.currentPlayerIndex];
    if (!player || player.id !== client.sessionId) return;

    if (this.actionTimer) { clearTimeout(this.actionTimer); this.actionTimer = undefined; }

    if (this.gs.pendingDraw > 0) {
      const drawCount = this.gs.pendingDraw;
      this.gs.pendingDraw = 0;
      this.gs.activeStackType = null;
      this.forceDraw(player, drawCount);
      this.broadcast('CARD_DRAWN', { playerId: player.id, count: drawCount });
    } else {
      // Normal single draw logic (Auto-play)
      if (this.gs.drawPile.length === 0) this.reshuffleDeck();
      const card = this.gs.drawPile.pop();
      if (card) {
        player.hand.push(card);
        player.handCount = player.hand.length;
        this.broadcast('CARD_DRAWN', { playerId: player.id, count: 1 });

        if (isPlayable(card, this.gs as any)) {
          // For bots, auto-pick a color. For humans, ask if they want to play or keep it
          if (player.type === 'bot') {
            const chosenColor = card.color === 'wild' ? 'red' : undefined;
            this.handlePlayCard({ sessionId: player.id } as Client, { cardId: card.id, chosenColor });
            return;
          } else {
            // Wait for human decision. Hand has increased.
            this.broadcastState();
            if (card.color === 'wild') {
               this.broadcast('CHOOSE_COLOR_REQUIRED', { cardId: card.id, playerId: player.id });
            } else {
               this.broadcast('PROMPT_KEEP_PLAY', { cardId: card.id, playerId: player.id });
            }
            return;
          }
        }
      }
    }

    // Unplayable drawn card, or stack pulled -> next turn
    this.gs.turnStartedAt = Date.now();
    this.gs.currentPlayerIndex = nextIndex(
      this.gs.currentPlayerIndex, this.gs.players.length, this.gs.direction
    );
    this.broadcastState();
    this.scheduleNextTurn();
  }

  private handleKeepCard(client: Client) {
    if (this.gs.phase !== 'playing') return;
    const player = this.gs.players[this.gs.currentPlayerIndex];
    if (!player || player.id !== client.sessionId) return;
    
    // Human chose to keep drawn card, advance turn.
    if (this.actionTimer) { clearTimeout(this.actionTimer); this.actionTimer = undefined; }
    
    this.gs.turnStartedAt = Date.now();
    this.gs.currentPlayerIndex = nextIndex(
      this.gs.currentPlayerIndex, this.gs.players.length, this.gs.direction
    );
    this.broadcastState();
    this.scheduleNextTurn();
  }


  private handleSayNova(client: Client) {
    const player = this.gs.players.find(p => p.id === client.sessionId);
    if (player) {
      player.saidNova = true;
      this.broadcast('SAY_NOVA_SOUND', { playerId: player.id });
      this.broadcastState();
    }
  }

  private handlePlayAgain(client: Client) {
    if (this.gs.hostId !== client.sessionId) return;
    if (this.gs.phase !== 'ended') return;

    this.botTimers.forEach(t => clearTimeout(t));
    this.botTimers.clear();
    if (this.actionTimer) { clearTimeout(this.actionTimer); this.actionTimer = undefined; }

    this.gs.winnerId = null;
    this.gs.pendingDraw = 0;
    this.gs.phase = 'lobby';
    for (const p of this.gs.players) { p.hand = []; p.handCount = 0; p.saidNova = false; }
    this.broadcastState();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private forceDraw(player: Player, count: number) {
    for (let i = 0; i < count; i++) {
      if (this.gs.drawPile.length === 0) this.reshuffleDeck();
      const card = this.gs.drawPile.pop();
      if (card) player.hand.push(card);
    }
    player.handCount = player.hand.length;
    player.saidNova = false;
  }

  private reshuffleDeck() {
    if (this.gs.discardPile.length <= 1) return;
    const top = this.gs.discardPile.pop()!;
    this.gs.drawPile = shuffle([...this.gs.discardPile]);
    this.gs.discardPile = [top];
  }

  private scheduleNextTurn() {
    if (this.gs.phase !== 'playing') return;
    
    if (this.actionTimer) { clearTimeout(this.actionTimer); this.actionTimer = undefined; }

    const current = this.gs.players[this.gs.currentPlayerIndex];
    if (!current) return;
    
    if (current.type === 'bot' || !current.connected) {
      this.scheduleBotTurn(current.id);
    } else {
      // 10s Timer + 1s grace period for human player to act
      this.actionTimer = setTimeout(() => this.handleTimeoutTurn(current.id), 11000);
    }
  }

  private handleTimeoutTurn(playerId: string) {
    if (this.gs.phase !== 'playing') return;
    const current = this.gs.players[this.gs.currentPlayerIndex];
    if (!current || current.id !== playerId) return;

    // Timeout: Find a playable card and force play, or force draw
    const playable = current.hand.find(c => isPlayable(c, this.gs as any));
    if (playable) {
      const chosenColor = playable.color === 'wild' ? 'red' : undefined; // fallback color
      this.handlePlayCard({ sessionId: playerId } as Client, { cardId: playable.id, chosenColor });
    } else {
      this.handleDrawCard({ sessionId: playerId } as Client);
    }
  }

  private scheduleBotTurn(botId: string) {
    const existing = this.botTimers.get(botId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(async () => {
      this.botTimers.delete(botId);
      await botDelay();

      if (this.gs.phase !== 'playing') return;
      const current = this.gs.players[this.gs.currentPlayerIndex];
      if (!current || current.id !== botId) return;

      const bot = this.gs.players.find(p => p.id === botId);
      if (!bot) return;

      const decision = botDecide(bot.id, bot.hand, this.gs as any);
      if (decision.type === 'play') {
        this.handlePlayCard(
          { sessionId: bot.id } as Client,
          { cardId: decision.cardId, chosenColor: decision.chosenColor }
        );
      } else {
        this.handleDrawCard({ sessionId: bot.id } as Client);
      }
    }, 200);

    this.botTimers.set(botId, timer);
  }

  private addBot(index: number) {
    this.gs.players.push({
      id: `bot_${index}_${Date.now()}`,
      name: BOT_NAMES[index % BOT_NAMES.length],
      type: 'bot',
      hand: [],
      handCount: 0,
      connected: true,
      saidNova: false,
    });
  }

  private broadcastState() {
    for (const client of this.clients) {
      client.send('STATE_SYNC', this.sanitizeStateForClient(client.sessionId));
    }
  }

  private sanitizeStateForClient(clientId: string) {
    // IMPORTANT: do NOT spread gs and override with undefined — msgpack sends undefined
    // as a key which corrupts the stream. Explicitly list every field.
    return {
      roomCode: this.gs.roomCode,
      mode: this.gs.mode,
      phase: this.gs.phase,
      currentPlayerIndex: this.gs.currentPlayerIndex,
      direction: this.gs.direction,
      currentColor: this.gs.currentColor,
      pendingDraw: this.gs.pendingDraw,
      activeStackType: this.gs.activeStackType,
      winnerId: this.gs.winnerId,
      hostId: this.gs.hostId,
      isPublic: this.gs.isPublic,
      turnStartedAt: this.gs.turnStartedAt,
      matchDurationInMinutes: this.gs.matchDurationInMinutes,
      matchStartedAt: this.gs.matchStartedAt,
      drawPileCount: this.gs.drawPile.length,
      discardPile: this.gs.discardPile.slice(-3),
      players: this.gs.players.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        handCount: p.hand.length,
        connected: p.connected,
        saidNova: p.saidNova,
        hand: p.id === clientId ? p.hand : [],
      })),
    };
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }
}
