import { useState } from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import socket from '../socket';
import { PlayerIcon } from './AnimalPicker';
import { Room } from '../types';

const COLORS = ['#00d4ff','#a855f7','#22c55e','#f59e0b','#ef4444','#ec4899','#3b82f6','#f97316'];
const getColor = (players: Room['players'], id: string) =>
  COLORS[players.findIndex(p => p.id === id) % COLORS.length];

interface AssignPhaseProps {
  room: Room;
  myId: string;
}

export default function AssignPhase({ room, myId }: AssignPhaseProps) {
  const [charName, setCharName] = useState('');
  const [charOrigin, setCharOrigin] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [nameError, setNameError] = useState('');
  const [originError, setOriginError] = useState('');

  const me = room.players.find(p => p.id === myId);
  const target = me ? room.players.find(p => p.id === me.assignedTo) : null;
  const alreadySubmitted = me?.hasAssigned ?? submitted;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
    if (!charName.trim()) { setNameError('Ingresá el nombre del personaje.'); valid = false; }
    else setNameError('');
    if (!charOrigin.trim()) { setOriginError('Ingresá de dónde es el personaje.'); valid = false; }
    else setOriginError('');
    if (!valid) return;
    socket.emit('submit-character', { characterName: charName.trim(), characterOrigin: charOrigin.trim() });
    setSubmitted(true);
  };

  const targetColor = target ? getColor(room.players, target.id) : '#a855f7';
  const pending   = room.players.filter(p => !p.hasAssigned);
  const confirmed = room.players.filter(p =>  p.hasAssigned);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 px-4">
      <div className="w-full max-w-[480px] animate-fade-up">

        <div className="text-center mb-5">
          <div className="logo-text text-[1.4rem]">Unveil</div>
          <div className="mt-1.5">
            <span className="badge badge-purple">Fase de asignación</span>
          </div>
        </div>

        {/* Target player */}
        {target && (
          <div
            className="flex items-center gap-3.5 px-5 py-4 rounded-lg mb-5 border"
            style={{
              background: targetColor + '14',
              borderColor: targetColor + '4d',
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center border-2 shrink-0"
              style={{ color: targetColor, borderColor: targetColor, background: targetColor + '18' }}
            >
              <PlayerIcon iconId={target.icon} size={22} color={targetColor} />
            </div>
            <div>
              <div className="text-[0.7rem] text-text-secondary uppercase tracking-[0.08em] mb-0.5">
                Le escribís el personaje a
              </div>
              <div
                className="font-display text-[1.15rem] font-bold"
                style={{ color: targetColor }}
              >
                {target.name}
              </div>
            </div>
          </div>
        )}

        <div className="card card-glow">
          {alreadySubmitted ? (
            <div className="text-center py-5">
              <div className="text-[2.5rem] mb-2.5 flex justify-center text-neon-green"><FaCheckCircle /></div>
              <div className="font-display text-[1rem] text-neon-green font-bold">
                ¡Personaje confirmado!
              </div>
              <div className="text-[0.85rem] text-text-secondary mt-1.5">
                Esperando al resto de los jugadores...
              </div>
              <div className="flex gap-1.5 justify-center mt-3">
                <span className="waiting-dot" />
                <span className="waiting-dot" />
                <span className="waiting-dot" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">Nombre del personaje</label>
                <input
                  className="input"
                  placeholder="Ej: Walter White"
                  value={charName}
                  onChange={e => setCharName(e.target.value)}
                  autoFocus
                />
                {nameError && (
                  <span className="text-[0.75rem] text-neon-red mt-1 block">{nameError}</span>
                )}
              </div>

              <div className="input-group">
                <label className="input-label">¿De qué serie / juego / universo?</label>
                <input
                  className="input"
                  placeholder="Ej: Breaking Bad"
                  value={charOrigin}
                  onChange={e => setCharOrigin(e.target.value)}
                />
                {originError && (
                  <span className="text-[0.75rem] text-neon-red mt-1 block">{originError}</span>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-secondary btn-full btn-lg mt-1"
                disabled={!charName.trim() || !charOrigin.trim()}
              >
                <FaCheckCircle className="inline mr-2" />Confirmar personaje
              </button>
            </form>
          )}
        </div>

        {/* Status */}
        <div className="mt-4">
          {confirmed.length > 0 && (
            <>
              <div className="text-[0.72rem] text-text-secondary uppercase tracking-[0.07em] mb-2">
                Confirmados ({confirmed.length}/{room.players.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {confirmed.map(p => {
                  const color = getColor(room.players, p.id);
                  return (
                    <span
                      key={p.id}
                      className="badge"
                      style={{ background: color + '18', color, border: `1px solid ${color}44` }}
                    >
                      <PlayerIcon iconId={p.icon} size={10} color={color} />
                      {p.name}
                    </span>
                  );
                })}
              </div>
            </>
          )}

          {pending.length > 0 && (
            <div className="mt-2.5">
              <div className="text-[0.72rem] text-text-secondary uppercase tracking-[0.07em] mb-2">
                Pendientes ({pending.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {pending.map(p => (
                  <span key={p.id} className="badge badge-muted">
                    <PlayerIcon iconId={p.icon} size={10} />
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
