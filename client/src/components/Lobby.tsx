import { useState } from 'react';
import socket from '../socket';
import { PlayerIcon } from './AnimalPicker';
import { Room } from '../types';

const COLORS = ['#00d4ff','#a855f7','#22c55e','#f59e0b','#ef4444','#ec4899','#3b82f6','#f97316'];
const getColor = (idx: number) => COLORS[idx % COLORS.length];

interface LobbyProps {
  room: Room;
  myId: string;
  isLeader: boolean;
  onGoHome: () => void;
}

export default function Lobby({ room, myId, isLeader, onGoHome }: LobbyProps) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${room.code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 px-4">
      <div className="w-full max-w-[520px] animate-fade-up">

        <div className="text-center mb-6">
          <div className="logo-text text-[1.6rem]">UnVeil</div>
        </div>

        {/* Room code display */}
        <div className="text-center p-5 bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.25)] rounded-lg mb-4">
          <div className="text-[0.7rem] uppercase tracking-[0.15em] text-text-secondary mb-1.5">
            Código de sala
          </div>
          <div
            className="font-display text-[2.8rem] font-black tracking-[0.25em] text-neon-cyan"
            style={{ textShadow: '0 0 20px rgba(0,212,255,0.4)' }}
          >
            {room.code}
          </div>
          <div className="flex gap-2 justify-center mt-2.5">
            <button className="btn btn-ghost btn-sm" onClick={copyCode}>
              {copied
                ? <span className="text-neon-green animate-fade-up text-[0.75rem]">¡Copiado!</span>
                : '📋 Copiar código'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={copyLink}>
              {copiedLink
                ? <span className="text-neon-green animate-fade-up text-[0.75rem]">¡Link copiado!</span>
                : '🔗 Copiar link'}
            </button>
          </div>
        </div>

        {/* Players */}
        <div className="card card-glow mb-3">
          <div className="section-title">Jugadores ({room.players.length})</div>
          <div className="flex flex-col gap-2">
            {room.players.map((p, idx) => {
              const color = getColor(idx);
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 px-3.5 py-2.5 bg-white/[0.03] border border-[rgba(0,212,255,0.2)] rounded-[10px] transition-colors hover:bg-white/[0.07]"
                >
                  <div
                    className="player-avatar"
                    style={{ color, borderColor: color + '55', background: color + '18' }}
                  >
                    <PlayerIcon iconId={p.icon} size={16} color={color} />
                  </div>
                  <span className="font-medium text-[0.95rem] flex-1">{p.name}</span>
                  {p.id === myId  && <span className="badge badge-cyan">Vos</span>}
                  {p.isLeader     && <span className="badge badge-amber">Líder</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        {isLeader ? (
          <div className="flex flex-col gap-2">
            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={() => socket.emit('start-assignment')}
              disabled={room.players.length < 2}
            >
              {room.players.length < 2 ? '⏳ Esperando más jugadores...' : '🎮 Iniciar Partida'}
            </button>
            {room.players.length < 2 && (
              <p className="text-center text-[0.78rem] text-text-muted">
                Se necesitan al menos 2 jugadores
              </p>
            )}
            <button className="btn btn-ghost btn-full" onClick={onGoHome}>Salir</button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 items-center">
            <div className="flex items-center gap-2 text-text-secondary text-[0.85rem]">
              <span>Esperando que el líder inicie</span>
              <span className="flex gap-1.5">
                <span className="waiting-dot" />
                <span className="waiting-dot" />
                <span className="waiting-dot" />
              </span>
            </div>
            <button className="btn btn-ghost" onClick={onGoHome}>Salir</button>
          </div>
        )}
      </div>
    </div>
  );
}
