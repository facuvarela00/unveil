import { useState, useEffect, useCallback, useRef } from 'react';
import socket from './socket';
import Home from './components/Home';
import Lobby from './components/Lobby';
import AssignPhase from './components/AssignPhase';
import GameBoard from './components/GameBoard';
import Podium from './components/Podium';
import { Room, ScreenType, JoinParams } from './types';

const SESSION_KEY = 'unveil_session';

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

function saveSession(roomCode: string, name: string, icon: string) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ roomCode, name, icon }));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

function loadSession(): { roomCode: string; name: string; icon: string } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.roomCode && parsed.name && parsed.icon) return parsed;
  } catch {}
  return null;
}

export default function App() {
  const [screen, setScreen]     = useState<ScreenType>('home');
  const [myId]                  = useState<string>(getOrCreatePlayerId);
  const [room, setRoom]         = useState<Room | null>(null);
  const [error, setError]       = useState('');
  const [winnerMsg, setWinnerMsg] = useState('');
  const [defeatMsg, setDefeatMsg] = useState('');
  const reconnecting = useRef(false);
  const [pendingReconnect, setPendingReconnect] = useState<{ roomCode: string; name: string; icon: string } | null>(() => loadSession());
  const screenRef = useRef<ScreenType>('home');
  screenRef.current = screen;

  // Auto-reconnect on page refresh
  useEffect(() => {
    const session = loadSession();
    if (!session) return;
    reconnecting.current = true;
    const attempt = () => {
      socket.emit('join-room', {
        code: session.roomCode,
        name: session.name,
        icon: session.icon,
        playerId: myId,
      });
    };
    if (socket.connected) {
      attempt();
    } else {
      socket.connect();
      socket.once('connect', attempt);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    socket.on('room-update', (roomData: Room) => {
      setRoom(roomData);
      reconnecting.current = false;
      const { phase } = roomData;
      if (phase === 'lobby')          setScreen('lobby');
      else if (phase === 'assigning') setScreen('assigning');
      else if (phase === 'playing')   setScreen('game');
      else if (phase === 'ended')     setScreen('podium');

      // Persist session so refresh can reconnect
      const me = roomData.players.find(p => p.id === myId);
      if (me) saveSession(roomData.code, me.name, me.icon);
    });

    socket.on('winner-announced', ({ playerName, characterName, characterOrigin, allGuessed }: { playerName: string; playerId: string; characterName?: string; characterOrigin?: string; allGuessed?: boolean }) => {
      if (allGuessed) {
        setWinnerMsg('¡Todos adivinaron su personaje!');
      } else {
        const msg = characterName
          ? `¡${playerName} adivinó: ${characterName}${characterOrigin ? ` de ${characterOrigin}` : ''}!`
          : `¡${playerName} adivinó su personaje!`;
        setWinnerMsg(msg);
      }
      setTimeout(() => setWinnerMsg(''), 5000);
    });

    socket.on('player-defeated', ({ playerName, characterName, characterOrigin }: { playerName: string; characterName?: string; characterOrigin?: string }) => {
      const msg = characterName
        ? `${playerName} no pudo adivinar su personaje: ${characterName}${characterOrigin ? ` de ${characterOrigin}` : ''}`
        : `${playerName} no pudo adivinar su personaje`;
      setDefeatMsg(msg);
      setTimeout(() => setDefeatMsg(''), 6000);
    });

    socket.on('error', ({ message }: { message: string }) => {
      setError(message);
      setTimeout(() => setError(''), 4000);
      // If reconnect attempt failed (room no longer exists), go home cleanly
      if (reconnecting.current) {
        reconnecting.current = false;
        clearSession();
        setScreen('home');
        setPendingReconnect(null);
      }
    });

    socket.on('connect_error', () => {
      setError('No se pudo conectar al servidor. ¿Está corriendo?');
      setTimeout(() => setError(''), 5000);
    });

    // Re-join room automatically when socket reconnects mid-game
    socket.on('connect', () => {
      const session = loadSession();
      if (session && screenRef.current !== 'home') {
        socket.emit('join-room', { code: session.roomCode, name: session.name, icon: session.icon, playerId: myId });
      }
    });

    // When tab becomes visible again, ask server for current state (fixes stale UI on slow phones)
    const onVisible = () => {
      if (document.visibilityState === 'visible' && socket.connected && screenRef.current !== 'home') {
        socket.emit('sync-room');
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      socket.off('room-update');
      socket.off('winner-announced');
      socket.off('player-defeated');
      socket.off('error');
      socket.off('connect_error');
      socket.off('connect');
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [myId]);

  // Clear the reconnect banner once the user is back in a game
  useEffect(() => {
    if (screen !== 'home') setPendingReconnect(null);
  }, [screen]);

  const handleReconnect = useCallback(() => {
    if (!pendingReconnect) return;
    reconnecting.current = true;
    const { roomCode, name, icon } = pendingReconnect;
    const attempt = () => socket.emit('join-room', { code: roomCode, name, icon, playerId: myId });
    if (socket.connected) attempt();
    else { socket.connect(); socket.once('connect', attempt); }
  }, [pendingReconnect, myId]);

  const handleDismissReconnect = useCallback(() => {
    clearSession();
    setPendingReconnect(null);
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
    clearSession();
    socket.disconnect();
    setRoom(null);
    setScreen('home');
    setPendingReconnect(null);
  }, []);

  const isLeader = room?.players?.find(p => p.id === myId)?.isLeader ?? false;

  return (
    <div className="relative z-[1] min-h-screen">
      {error     && <div className="toast toast-error">{error}</div>}
      {winnerMsg && <div className="toast toast-success">{winnerMsg}</div>}
      {defeatMsg && <div className="toast toast-defeat">{defeatMsg}</div>}

      {screen === 'home' && (
        <Home
          onJoin={handleJoin}
          reconnectInfo={pendingReconnect}
          onReconnect={handleReconnect}
          onDismissReconnect={handleDismissReconnect}
        />
      )}

      {screen === 'lobby' && room && (
        <Lobby room={room} myId={myId} isLeader={isLeader} onGoHome={handleGoHome} />
      )}

      {screen === 'assigning' && room && (
        <AssignPhase room={room} myId={myId} />
      )}

      {screen === 'game' && room && (
        <GameBoard room={room} myId={myId} isLeader={isLeader} onGoHome={handleGoHome} />
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
