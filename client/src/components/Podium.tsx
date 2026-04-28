import { FaSync, FaDoorOpen, FaTv } from 'react-icons/fa';
import { GiTheaterCurtains } from 'react-icons/gi';
import { PlayerIcon } from './AnimalPicker';
import { Room } from '../types';

const COLORS = ['#00d4ff','#a855f7','#22c55e','#f59e0b','#ef4444','#ec4899','#3b82f6','#f97316'];
const getColor = (players: Room['players'], id: string) =>
  COLORS[players.findIndex(p => p.id === id) % COLORS.length];

const MEDALS = ['🥇', '🥈', '🥉'];

const rankBg: Record<number, string> = {
  0: 'bg-gradient-to-br from-[rgba(245,158,11,0.15)] to-[rgba(253,230,138,0.05)] border-[rgba(245,158,11,0.4)] shadow-[0_0_20px_rgba(245,158,11,0.1)]',
  1: 'bg-gradient-to-br from-[rgba(148,163,184,0.1)] to-[rgba(100,116,139,0.05)] border-[rgba(148,163,184,0.3)]',
  2: 'bg-gradient-to-br from-[rgba(180,83,9,0.1)] to-[rgba(120,53,15,0.05)] border-[rgba(180,83,9,0.3)]',
};

interface PodiumProps {
  room: Room;
  myId: string;
  isLeader: boolean;
  onNewGame: () => void;
  onGoHome: () => void;
}

export default function Podium({ room, myId, isLeader, onNewGame, onGoHome }: PodiumProps) {
  const sorted = [...room.players].sort((a, b) => b.wins - a.wins);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 px-4">
      <div className="w-full max-w-[520px] animate-fade-up">

        {/* Header */}
        <div className="text-center mb-7">
          <div className="text-[3rem] mb-1.5 flex justify-center text-[#a855f7]" style={{ filter: 'drop-shadow(0 0 12px rgba(168,85,247,0.5))' }}><GiTheaterCurtains /></div>
          <div
            className="font-display text-[1.4rem] font-black mb-1"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #fde68a, #f59e0b)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'shimmer 2.5s linear infinite',
            }}
          >
            Partida Finalizada
          </div>
          <div className="text-[0.8rem] text-text-secondary">Resultados finales</div>
        </div>

        {/* Rankings */}
        <div className="flex flex-col gap-2 mb-6">
          {sorted.map((p, idx) => {
            const color = getColor(room.players, p.id);
            const isMe  = p.id === myId;
            return (
              <div
                key={p.id}
                className={[
                  'flex items-center gap-3.5 px-4 py-3.5 rounded-lg border transition-all',
                  idx < 3 ? rankBg[idx] : 'border-[rgba(0,212,255,0.2)]',
                ].join(' ')}
                style={isMe ? { outline: `2px solid ${color}55` } : {}}
              >
                {/* Rank */}
                <div className="font-display text-[1.1rem] font-black w-8 text-center shrink-0">
                  {idx === 0 && <span style={{ color: '#f59e0b', textShadow: '0 0 12px rgba(245,158,11,0.5)' }}>{MEDALS[0]}</span>}
                  {idx === 1 && <span style={{ color: '#94a3b8' }}>{MEDALS[1]}</span>}
                  {idx === 2 && <span style={{ color: '#b45309' }}>{MEDALS[2]}</span>}
                  {idx >= 3 && <span className="text-text-muted text-[0.9rem]">{idx + 1}</span>}
                </div>

                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0"
                  style={{ color, borderColor: color + '60', background: color + '18' }}
                >
                  <PlayerIcon iconId={p.icon} size={18} color={color} />
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="font-semibold text-[0.95rem]">
                    {p.name}
                    {isMe && <span className="ml-1.5 text-[0.7rem] text-text-muted">(vos)</span>}
                  </div>
                  {p.characterName && (
                    <div className="text-[0.78rem] text-text-secondary mt-px flex items-center gap-1">
                      Era {p.characterName}
                      {p.characterOrigin && <><FaTv className="opacity-50 ml-1" />{p.characterOrigin}</>}
                    </div>
                  )}
                </div>

                {/* Wins */}
                <div
                  className="font-display text-[0.75rem] font-bold text-center shrink-0"
                  style={{ color: idx === 0 ? '#f59e0b' : '#8b9ab0' }}
                >
                  <div className="text-[1.3rem] font-black">{p.wins}</div>
                  <div className="text-[0.6rem] tracking-[0.05em]">
                    {p.wins === 1 ? 'victoria' : 'victorias'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {isLeader && (
            <button className="btn btn-primary btn-full btn-lg" onClick={onNewGame}>
              <FaSync className="inline mr-2" />Nueva partida (misma sala)
            </button>
          )}
          <button className="btn btn-ghost btn-full" onClick={onGoHome}>
            <FaDoorOpen className="inline mr-2" />Volver al inicio
          </button>
        </div>

        {!isLeader && (
          <p className="text-center mt-3 text-[0.78rem] text-text-muted">
            Esperando que el líder inicie una nueva partida...
          </p>
        )}
      </div>
    </div>
  );
}
