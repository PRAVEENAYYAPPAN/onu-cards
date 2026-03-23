'use client';
// ─── NOVA CARDS – Home Page ───────────────────────────────────────────────────
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { Lobby } from '@/components/lobby/Lobby';
import type { RoomOptions } from '@/lib/types';

export default function Home() {
  const router = useRouter();
  const { playerName, setPlayerName, createGame, joinGame, isConnecting, error } = useGameStore();

  const handleCreate = async (opts: RoomOptions) => {
    const roomCode = await createGame(opts);
    router.push(`/room/${roomCode}`);
    return roomCode;
  };

  const handleJoin = async (code: string) => {
    await joinGame(code);
    router.push(`/room/${code}`);
  };

  return (
    <Lobby
      playerName={playerName}
      onNameChange={setPlayerName}
      onCreate={handleCreate}
      onJoin={handleJoin}
      isConnecting={isConnecting}
      error={error}
    />
  );
}
