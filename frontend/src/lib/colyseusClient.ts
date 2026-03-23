// ─── NOVA CARDS – Colyseus Client ────────────────────────────────────────────
import * as Colyseus from 'colyseus.js';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:2567';

let _client: Colyseus.Client | null = null;

export function getColyseusClient(): Colyseus.Client {
  if (!_client) {
    _client = new Colyseus.Client(WS_URL);
  }
  return _client;
}

export async function createRoom(
  roomType: string,
  options: Record<string, unknown>
): Promise<Colyseus.Room> {
  return getColyseusClient().create(roomType, options);
}

export async function joinRoom(
  roomId: string,
  options: Record<string, unknown> = {}
): Promise<Colyseus.Room> {
  return getColyseusClient().joinById(roomId, options);
}

export async function joinOrCreateRoom(
  roomType: string,
  options: Record<string, unknown> = {}
): Promise<Colyseus.Room> {
  return getColyseusClient().joinOrCreate(roomType, options);
}
