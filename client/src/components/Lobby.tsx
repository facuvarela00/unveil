import { useState, useEffect, useRef } from 'react';
import { FaGripVertical, FaRandom, FaClipboard, FaLink, FaHourglassHalf, FaGamepad } from 'react-icons/fa';
import socket from '../socket';
import { PlayerIcon } from './AnimalPicker';
import { Room, Player } from '../types';

const COLORS = ['#00d4ff','#a855f7','#22c55e','#f59e0b','#ef4444','#ec4899','#3b82f6','#f97316'];
const getColor = (players: Player[], id: string) =>
  COLORS[players.findIndex(p => p.id === id) % COLORS.length];

interface LobbyProps {
  room: Room;
  myId: string;
  isLeader: boolean;
  onGoHome: () => void;
}

export default function Lobby({ room, myId, isLeader, onGoHome }: LobbyProps) {
  const [copied, setCopied]         = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [localOrder, setLocalOrder] = useState<string[]>([]);
  const dragIdx = useRef<number | null>(null);
  const isDragging = useRef(false);

  // Sync local order from room (only when not dragging)
  useEffect(() => {
    if (isDragging.current) return;
    const order = room.turnOrder.length === room.players.length
      ? room.turnOrder
      : room.players.map(p => p.id);
    setLocalOrder(order);
  }, [room]);

  const orderedPlayers: Player[] = localOrder
    .map(id => room.players.find(p => p.id === id))
    .filter(Boolean) as Player[];

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

  const handleDragStart = (idx: number) => {
    dragIdx.current = idx;
    isDragging.current = true;
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === idx) return;
    const newOrder = [...localOrder];
    const [moved] = newOrder.splice(dragIdx.current, 1);
    newOrder.splice(idx, 0, moved);
    dragIdx.current = idx;
    setLocalOrder(newOrder);
  };

  const handleDrop = () => {
    isDragging.current = false;
    dragIdx.current = null;
    socket.emit('set-turn-order', { order: localOrder });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 px-4">
      <div className="w-full max-w-[520px] animate-fade-up">

        <div className="text-center mb-6">
          <div className="logo-text text-[1.6rem]">Unveil</div>
        </div>

        {/* Room code */}
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
                : <><FaClipboard className="inline mr-1.5" />Copiar código</>}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={copyLink}>
              {copiedLink
                ? <span className="text-neon-green animate-fade-up text-[0.75rem]">¡Link copiado!</span>
                : <><FaLink className="inline mr-1.5" />Copiar link</>}
            </button>
          </div>
        </div>

        {/* Turn order */}
        <div className="card card-glow mb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="section-title">
              Orden de turnos ({orderedPlayers.length})
            </div>
            {isLeader && (
              <div className="flex items-center gap-1 text-[0.68rem] text-text-muted">
                <FaRandom className="opacity-60" />
                <span>El primero será aleatorio</span>
              </div>
            )}
          </div>

          {!isLeader && (
            <p className="text-[0.72rem] text-text-muted mb-2">
              Solo el líder puede modificar el orden.
            </p>
          )}

          <div className="flex flex-col gap-2">
            {orderedPlayers.map((p, idx) => {
              const color = getColor(room.players, p.id);
              return (
                <div
                  key={p.id}
                  draggable={isLeader}
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={e => handleDragOver(e, idx)}
                  onDrop={handleDrop}
                  className={[
                    'flex items-center gap-3 px-3.5 py-2.5 bg-white/[0.03] border border-[rgba(0,212,255,0.2)] rounded-[10px] transition-colors',
                    isLeader ? 'cursor-grab active:cursor-grabbing hover:bg-white/[0.07]' : '',
                  ].join(' ')}
                >
                  {/* Position number */}
                  <span className="text-[0.7rem] font-display font-bold text-text-muted w-4 text-center shrink-0">
                    {idx + 1}
                  </span>

                  {/* Drag handle (leader only) */}
                  {isLeader && (
                    <FaGripVertical className="text-text-muted opacity-40 shrink-0" />
                  )}

                  {/* Avatar */}
                  <div
                    className="player-avatar shrink-0"
                    style={{ color, borderColor: color + '55', background: color + '18' }}
                  >
                    <PlayerIcon iconId={p.icon} size={16} color={color} />
                  </div>

                  <span className="font-medium text-[0.95rem] flex-1">{p.name}</span>

                  <div className="flex items-center gap-1.5">
                    {p.id === myId    && <span className="badge badge-cyan">Vos</span>}
                    {p.isLeader       && <span className="badge badge-amber">Líder</span>}
                  </div>
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
              {room.players.length < 2
                ? <><FaHourglassHalf className="inline mr-2" />Esperando más jugadores...</>
                : <><FaGamepad className="inline mr-2" />Iniciar Partida</>}
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
