import { useState, useEffect, useCallback } from 'react';
import socket from './socket';
import Home from './components/Home';
import Lobby from './components/Lobby';
import AssignPhase from './components/AssignPhase';
import GameBoard from './components/GameBoard';
import Podium from './components/Podium';
import { Room, ScreenType, JoinParams } from './types';

function getOrCreatePlayerId(): string {
  let id = localStorage.getItem('unveil_player_id');
  if (!id) {
    id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 18) + Date.now().toString(36);
    localStorage.setItem('unveil_player_id', id);
  }
  return id;
}

export default function App() {
  const [screen, setScreen] = useState<ScreenType>('home');
  const [myId] = useState<string>(getOrCreatePlayerId);
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState('');
  const [winnerMsg, setWinnerMsg] = useState('');

  useEffect(() => {
    socket.on('room-update', (roomData: Room) => {
      setRoom(roomData);
      const { phase } = roomData;
      if (phase === 'lobby')          setScreen('lobby');
      else if (phase === 'assigning') setScreen('assigning');
      else if (phase === 'playing')   setScreen('game');
      else if (phase === 'ended')     setScreen('podium');
    });

    socket.on('winner-announced', ({ playerName }: { playerName: string; playerId: string }) => {
      setWinnerMsg(`¡${playerName} adivinó su personaje!`);
      setTimeout(() => setWinnerMsg(''), 4000);
    });

    socket.on('error', ({ message }: { message: string }) => {
      setError(message);
      setTimeout(() => setError(''), 4000);
    });

    socket.on('connect_error', () => {
      setError('No se pudo conectar al servidor. ¿Está corriendo?');
      setTimeout(() => setError(''), 5000);
    });

    return () => {
      socket.off('room-update');
      socket.off('winner-announced');
      socket.off('error');
      socket.off('connect_error');
    };
  }, []);

  const handleJoin = useCallback(({ name, icon, roomCode, isCreating }: JoinParams) => {
    setError('');
    if (!socket.connected) socket.connect();
    if (isCreating) {
      socket.emit('create-room', { name, icon, playerId: myId });
    } else {
      socket.emit('join-room', { code: roomCode.toUpperCase().trim(), name, icon, playerId: myId });
    }
  }, [myId]);

  const handleGoHome = useCallback(() => {
    socket.disconnect();
    setRoom(null);
    setScreen('home');
  }, []);

  const isLeader = room?.players?.find(p => p.id === myId)?.isLeader ?? false;

  return (
    <div className="relative z-[1] min-h-screen">
      {error     && <div className="toast toast-error">{error}</div>}
      {winnerMsg && <div className="toast toast-success">{winnerMsg}</div>}

      {screen === 'home' && <Home onJoin={handleJoin} />}

      {screen === 'lobby' && room && (
        <Lobby room={room} myId={myId} isLeader={isLeader} onGoHome={handleGoHome} />
      )}

      {screen === 'assigning' && room && (
        <AssignPhase room={room} myId={myId} />
      )}

      {screen === 'game' && room && (
        <GameBoard room={room} myId={myId} isLeader={isLeader} />
      )}

      {screen === 'podium' && room && (
        <Podium
          room={room}
          myId={myId}
          isLeader={isLeader}
          onNewGame={() => socket.emit('restart-game')}
          onGoHome={handleGoHome}
        />
      )}
    </div>
  );
}
