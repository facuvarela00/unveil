import { useState, useCallback, useEffect, useRef } from 'react';
import { FaTrophy, FaFlag, FaPlus, FaTimes, FaStickyNote, FaTv, FaStar, FaCheck, FaArrowRight } from 'react-icons/fa';
import socket from '../socket';
import { PlayerIcon } from './AnimalPicker';
import { Room, Player } from '../types';

const COLORS = ['#00d4ff','#a855f7','#22c55e','#f59e0b','#ef4444','#ec4899','#3b82f6','#f97316'];
const getColor = (players: Room['players'], id: string) =>
  COLORS[players.findIndex(p => p.id === id) % COLORS.length];

interface Note { id: number; text: string }
let noteIdCounter = 0;

interface GameBoardProps {
  room: Room;
  myId: string;
  isLeader: boolean;
}

export default function GameBoard({ room, myId, isLeader }: GameBoardProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showWinModal, setShowWinModal]       = useState(false);
  const [notes, setNotes]                     = useState<Note[]>(() => {
    try {
      const raw = localStorage.getItem(`unveil_notes_${room.code}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          noteIdCounter = Math.max(...parsed.map((n: Note) => n.id));
          return parsed;
        }
      }
    } catch {}
    return [];
  });
  const [noteInput, setNoteInput]             = useState('');
  const [copied, setCopied]                   = useState(false);

  useEffect(() => {
    localStorage.setItem(`unveil_notes_${room.code}`, JSON.stringify(notes));
  }, [notes, room.code]);

  const addNote = useCallback(() => {
    if (!noteInput.trim()) return;
    setNotes(prev => [...prev, { id: ++noteIdCounter, text: noteInput.trim() }]);
    setNoteInput('');
  }, [noteInput]);

  const removeNote = useCallback((id: number) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const markWinner = (playerId: string) => {
    socket.emit('mark-winner', { playerId });
    setShowWinModal(false);
  };

  const endGame = () => {
    if (window.confirm('¿Terminar la partida y ver el podio?')) socket.emit('end-game');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const me = room.players.find(p => p.id === myId);
  const isMyTurn = room.currentTurnPlayerId === myId;
  const iHaveGuessed = me?.hasGuessed ?? false;
  const currentTurnPlayer = room.players.find(p => p.id === room.currentTurnPlayerId);
  const currentTurnColor = room.currentTurnPlayerId ? getColor(room.players, room.currentTurnPlayerId) : '#00d4ff';
  const currentTurnPlayerDisconnected = currentTurnPlayer ? !currentTurnPlayer.connected : false;

  // Round tracking
  const activePlayers = room.players.filter(p => !p.hasGuessed);
  const currentRound = activePlayers.length > 0
    ? Math.min(...activePlayers.map(p => p.turnCount)) + 1
    : 1;

  const [roundAnimation, setRoundAnimation] = useState<number | null>(null);
  const prevRoundRef = useRef<number>(currentRound);
  const roundAnimatingRef = useRef(false);
  const pendingMyTurnRef = useRef(false);

  // "Your turn" toast
  const [myTurnToast, setMyTurnToast] = useState(false);
  const prevTurnRef = useRef<string | null>(null);
  // Always-current ref so deferred callbacks can check whose turn it really is
  const currentTurnPlayerIdRef = useRef(room.currentTurnPlayerId);
  currentTurnPlayerIdRef.current = room.currentTurnPlayerId;

  useEffect(() => {
    if (currentRound !== prevRoundRef.current) {
      prevRoundRef.current = currentRound;
      roundAnimatingRef.current = true;
      setRoundAnimation(currentRound);
      const t = setTimeout(() => {
        roundAnimatingRef.current = false;
        setRoundAnimation(null);
        if (pendingMyTurnRef.current && currentTurnPlayerIdRef.current === myId) {
          pendingMyTurnRef.current = false;
          setMyTurnToast(true);
          setTimeout(() => setMyTurnToast(false), 2800);
        } else {
          pendingMyTurnRef.current = false;
        }
      }, 2800);
      return () => {
        clearTimeout(t);
        roundAnimatingRef.current = false;
        // Do NOT leave pendingMyTurnRef dirty — clear it so next animation starts clean
        pendingMyTurnRef.current = false;
      };
    }
  }, [currentRound, myId]);

  useEffect(() => {
    const prev = prevTurnRef.current;
    prevTurnRef.current = room.currentTurnPlayerId;
    if (room.currentTurnPlayerId === myId && prev !== myId) {
      if (roundAnimatingRef.current) {
        // Round animation is playing — show "Es tu turno" after it finishes
        pendingMyTurnRef.current = true;
      } else {
        setMyTurnToast(true);
        const t = setTimeout(() => setMyTurnToast(false), 2800);
        return () => clearTimeout(t);
      }
    } else if (room.currentTurnPlayerId !== myId) {
      // Turn moved away from me — clear any pending toast to avoid stale state
      pendingMyTurnRef.current = false;
    }
  }, [room.currentTurnPlayerId, myId]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">

      {/* Turn banner */}
      {currentTurnPlayer && (
        <div
          className="shrink-0 flex items-center gap-3 px-4 py-3 transition-all"
          style={
            isMyTurn
              ? { background: 'rgba(0,212,255,0.12)', borderBottom: '2px solid rgba(0,212,255,0.5)' }
              : { background: 'rgba(255,255,255,0.025)', borderBottom: '1px solid rgba(255,255,255,0.07)' }
          }
        >
          {/* Player avatar */}
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center border-2 shrink-0 transition-all"
            style={{
              color: currentTurnColor,
              borderColor: isMyTurn ? currentTurnColor : currentTurnColor + '66',
              background: currentTurnColor + '18',
              boxShadow: isMyTurn ? `0 0 16px ${currentTurnColor}55` : 'none',
            }}
          >
            <PlayerIcon iconId={currentTurnPlayer.icon} size={20} color={currentTurnColor} />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            {currentTurnPlayerDisconnected ? (
              <>
                <div
                  className="font-display font-bold text-[1rem] leading-tight"
                  style={{ color: '#f59e0b', textShadow: '0 0 12px rgba(245,158,11,0.5)' }}
                >
                  Esperando a{' '}
                  <span style={{ color: currentTurnColor }}>
                    {currentTurnPlayer.name}
                  </span>
                  …
                </div>
                <div className="text-[0.72rem] text-text-muted mt-0.5">
                  Partida en pausa hasta que vuelva
                </div>
              </>
            ) : isMyTurn ? (
              <>
                <div
                  className="font-display font-bold text-[1rem] leading-tight"
                  style={{ color: '#00d4ff', textShadow: '0 0 12px rgba(0,212,255,0.7)' }}
                >
                  ¡Es tu turno!
                </div>
                <div className="text-[0.72rem] text-text-muted mt-0.5">
                  Hacé tu pregunta, anotá y presioná Continuar
                </div>
              </>
            ) : (
              <>
                <div className="font-display font-bold text-[1rem] leading-tight">
                  Turno de{' '}
                  <span style={{
                    color: currentTurnColor,
                    textShadow: `0 0 12px ${currentTurnColor}99, 0 0 4px ${currentTurnColor}`,
                  }}>
                    {currentTurnPlayer.name}
                  </span>
                </div>
                <div className="text-[0.72rem] text-text-muted mt-0.5">
                  Esperá tu turno para preguntar
                </div>
              </>
            )}
          </div>

          {/* Round badge */}
          <span
            className="shrink-0 font-display text-[0.65rem] font-bold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full border"
            style={{
              color: '#8b9ab0',
              borderColor: 'rgba(0,212,255,0.2)',
              background: 'rgba(0,212,255,0.06)',
            }}
          >
            Ronda {currentRound}
          </span>
        </div>
      )}

      {/* "Your turn" toast overlay */}
      {myTurnToast && roundAnimation === null && (
        <div
          key="my-turn-toast"
          className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none animate-round-fade"
        >
          <div className="text-center px-10 py-8 rounded-2xl"
            style={{ background: 'rgba(7,7,15,0.82)', border: '1px solid rgba(0,212,255,0.25)', backdropFilter: 'blur(12px)' }}
          >
            <div
              className="font-display font-black tracking-[0.12em] uppercase mb-1"
              style={{
                fontSize: '3rem',
                background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 20px rgba(0,212,255,0.5))',
              }}
            >
              ¡Tu turno!
            </div>
            <div className="text-text-muted text-[0.8rem] tracking-[0.2em] uppercase">
              Hacé tu pregunta
            </div>
          </div>
        </div>
      )}

      {/* Round animation overlay */}
      {roundAnimation !== null && (
        <div
          key={`round-${roundAnimation}`}
          className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none animate-round-fade"
        >
          <div className="text-center px-10 py-8 rounded-2xl"
            style={{ background: 'rgba(7,7,15,0.82)', border: '1px solid rgba(0,212,255,0.25)', backdropFilter: 'blur(12px)' }}
          >
            <div
              className="font-display font-black tracking-[0.15em] uppercase mb-1"
              style={{
                fontSize: '3.5rem',
                background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: 'none',
                filter: 'drop-shadow(0 0 20px rgba(0,212,255,0.5))',
              }}
            >
              Ronda {roundAnimation}
            </div>
            <div className="text-text-muted text-[0.8rem] tracking-[0.2em] uppercase">
              {roundAnimation === 1 ? '¡Que empiece el juego!' : 'Nueva ronda'}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[rgba(7,7,15,0.85)] border-b border-[rgba(0,212,255,0.2)] backdrop-blur-md shrink-0 z-10">
        <span
          className="font-display font-black text-[1.1rem] shrink-0"
          style={{
            background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          UnVeil
        </span>

        <button
          onClick={copyCode}
          className="flex items-center gap-1.5 bg-[rgba(0,212,255,0.12)] border border-[rgba(0,212,255,0.25)] rounded-lg px-2.5 py-1 font-display text-[0.8rem] text-neon-cyan cursor-pointer transition-colors hover:bg-[rgba(0,212,255,0.2)] shrink-0"
        >
          {copied ? <><FaCheck className="inline mr-1" />Copiado</> : `# ${room.code}`}
        </button>

        <div className="flex-1" />

        {me && (
          <div className="flex items-center gap-2">
            <div
              className="w-[30px] h-[30px] rounded-full flex items-center justify-center border-2 shrink-0"
              style={{
                color: getColor(room.players, myId),
                borderColor: getColor(room.players, myId) + '80',
                background:  getColor(room.players, myId) + '18',
              }}
            >
              <PlayerIcon iconId={me.icon} size={14} color={getColor(room.players, myId)} />
            </div>
            <span className="text-[0.85rem] font-medium text-text-secondary">{me.name}</span>
            {isLeader && <span className="badge badge-amber text-[0.58rem]">Líder</span>}
            {iHaveGuessed && <span className="badge badge-amber text-[0.58rem]">Adivinaste ✓</span>}
          </div>
        )}
      </div>

      {/* Player panel */}
      <div className="px-4 py-3 bg-[rgba(7,7,15,0.6)] border-b border-[rgba(0,212,255,0.2)] shrink-0 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {room.players.map(p => {
            const color = getColor(room.players, p.id);
            const isMe  = p.id === myId;
            const isCurrentTurn = p.id === room.currentTurnPlayerId;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPlayer(p.id === selectedPlayer?.id ? null : p)}
                className="flex items-center gap-1.5 px-3 py-[7px] rounded-full border cursor-pointer transition-all duration-[0.18s] text-[0.8rem] font-medium whitespace-nowrap shrink-0 hover:-translate-y-px"
                style={{
                  color,
                  borderColor: isCurrentTurn ? color : color + '55',
                  background: selectedPlayer?.id === p.id ? color + '18' : isCurrentTurn ? color + '12' : 'rgba(255,255,255,0.03)',
                  boxShadow: isCurrentTurn ? `0 0 8px ${color}44` : undefined,
                }}
              >
                <div
                  className="w-[22px] h-[22px] rounded-full flex items-center justify-center"
                  style={{ background: color + '22' }}
                >
                  <PlayerIcon iconId={p.icon} size={12} color={color} />
                </div>
                {p.name}
                {isMe && <span className="opacity-50 text-[0.65rem]">(vos)</span>}
                {p.hasGuessed && <FaTrophy className="text-[0.6rem] opacity-70" style={{ color: '#f59e0b' }} />}
                {p.turnCount > 0 && (
                  <span
                    className="font-display text-[0.6rem] font-bold px-1 py-px rounded-full opacity-70"
                    style={{ background: color + '25', color }}
                  >
                    T{p.turnCount}
                  </span>
                )}
                {p.wins > 0 && (
                  <span
                    className="font-display text-[0.65rem] font-bold px-1.5 py-px rounded-full flex items-center gap-0.5"
                    style={{ background: color + '25', color }}
                  >
                    {p.wins}<FaStar className="text-[0.5rem]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Game body */}
      <div className="flex-1 overflow-y-auto p-4 md:grid md:grid-cols-[1fr_320px] md:gap-4 md:items-start">

        {/* Notepad side */}
        <div>
          {/* My character */}
          <div className="text-center p-3.5 bg-white/[0.02] border border-dashed border-[rgba(0,212,255,0.2)] rounded-lg mb-4">
            <div className="text-[0.7rem] text-text-muted uppercase tracking-[0.1em] mb-1">
              Tu personaje
            </div>
            <div className="font-display text-[1.6rem] tracking-[0.2em] text-text-muted">???</div>
            <div className="text-[0.72rem] text-text-muted mt-1">Hacé preguntas para descubrirlo</div>
          </div>

          {/* Notepad */}
          <div className="flex flex-col gap-2.5">
            <div className="font-display text-[0.8rem] text-text-secondary uppercase tracking-[0.08em] flex items-center gap-1.5">
              <FaStickyNote className="opacity-70" />Mis notas
            </div>

            <div className="flex gap-2">
              <input
                className="input text-[0.88rem]"
                placeholder="Ej: Es humano · Sí"
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addNote(); } }}
              />
              <button
                className="btn btn-ghost btn-icon shrink-0"
                onClick={addNote}
                title="Agregar nota"
              >
                <FaPlus />
              </button>
            </div>

            {notes.length === 0 && (
              <div className="text-center py-5 text-text-muted text-[0.82rem]">
                Tus notas aparecerán acá
              </div>
            )}

            {notes.map(note => (
              <div
                key={note.id}
                className="flex items-center gap-2.5 px-3 py-[9px] bg-white/[0.03] border border-[rgba(0,212,255,0.2)] rounded-[10px] text-[0.88rem] animate-fade-up"
              >
                <span className="flex-1 break-words">{note.text}</span>
                <button
                  onClick={() => removeNote(note.id)}
                  title="Eliminar nota"
                  className="bg-transparent border-none cursor-pointer text-text-muted p-0.5 rounded flex items-center transition-colors hover:text-neon-red"
                >
                  <FaTimes />
                </button>
              </div>
            ))}
          </div>

          {/* Continuar button (current player only, not if guessed, not if waiting) */}
          {isMyTurn && !iHaveGuessed && !currentTurnPlayerDisconnected && (
            <button
              className="btn btn-primary btn-full mt-5"
              onClick={() => socket.emit('next-turn')}
            >
              <FaArrowRight className="inline mr-2" />Continuar — Siguiente turno
            </button>
          )}
        </div>

        {/* Leader controls (desktop sidebar) */}
        {isLeader && (
          <div className="card h-fit hidden md:block">
            <div className="section-title mb-3">Controles</div>
            <div className="flex flex-col gap-2">
              <button className="btn btn-amber btn-full" onClick={() => setShowWinModal(true)}>
                <FaTrophy className="inline mr-2" />Marcar ganador
              </button>
              <button className="btn btn-danger btn-full" onClick={endGame}>
                <FaFlag className="inline mr-2" />Finalizar partida
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Leader footer (mobile) */}
      {isLeader && (
        <div className="md:hidden flex gap-2 flex-wrap items-center px-4 py-3 border-t border-[rgba(0,212,255,0.2)] bg-[rgba(7,7,15,0.85)] shrink-0">
          <button className="btn btn-amber" onClick={() => setShowWinModal(true)}><FaTrophy className="inline mr-1.5" />Ganador</button>
          <button className="btn btn-danger" onClick={endGame}><FaFlag className="inline mr-1.5" />Finalizar</button>
        </div>
      )}

      {/* Character popup */}
      {selectedPlayer && (() => {
        const p     = selectedPlayer;
        const color = getColor(room.players, p.id);
        const isMe  = p.id === myId;
        return (
          <div
            className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setSelectedPlayer(null)}
          >
            <div
              className="bg-[#0f0f1e] border border-[rgba(0,212,255,0.5)] rounded-xl p-7 max-w-[360px] w-full shadow-[0_0_40px_rgba(0,212,255,0.15)] animate-fade-up text-center"
              onClick={e => e.stopPropagation()}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center border-2 mx-auto mb-3"
                style={{ color, borderColor: color, background: color + '18' }}
              >
                <PlayerIcon iconId={p.icon} size={28} color={color} />
              </div>

              <div className="font-display text-[0.95rem] font-bold mb-1" style={{ color }}>
                {p.name} {isMe && '(vos)'}
              </div>

              {p.hasGuessed && (
                <div className="mb-3 flex items-center justify-center gap-1.5 text-[0.75rem] text-[#f59e0b]">
                  <FaTrophy />Adivinó su personaje
                </div>
              )}

              {p.turnCount > 0 && (
                <div className="mb-3 text-[0.72rem] text-text-muted">
                  {p.turnCount} turno{p.turnCount !== 1 ? 's' : ''} jugados
                </div>
              )}

              {p.wins > 0 && (
                <div className="mb-3">
                  <span className="badge badge-amber">{p.wins} victoria{p.wins !== 1 ? 's' : ''}</span>
                </div>
              )}

              <div className="text-[0.7rem] text-text-secondary uppercase tracking-[0.1em] mb-1.5">
                Tiene que adivinar
              </div>

              {isMe ? (
                <>
                  <div className="font-display text-[2.5rem] tracking-[0.3em] text-text-muted mb-2">???</div>
                  <div className="text-[0.8rem] text-text-muted">¡Este es tu personaje secreto!</div>
                </>
              ) : (
                <>
                  <div className="font-display text-[1.5rem] font-black mb-1" style={{ color }}>
                    {p.characterName ?? '???'}
                  </div>
                  {p.characterOrigin && (
                    <div className="text-[0.85rem] text-text-secondary mb-4 flex items-center justify-center gap-1.5">
                      <FaTv className="opacity-60" />{p.characterOrigin}
                    </div>
                  )}
                </>
              )}

              {isLeader && !isMe && !p.hasGuessed && (
                <button
                  className="btn btn-amber btn-full mt-2"
                  onClick={() => { markWinner(p.id); setSelectedPlayer(null); }}
                >
                  <FaTrophy className="inline mr-2" />¡Adivinó!
                </button>
              )}

              <button className="btn btn-ghost btn-full mt-2" onClick={() => setSelectedPlayer(null)}>
                Cerrar
              </button>
            </div>
          </div>
        );
      })()}

      {/* Win modal */}
      {showWinModal && (
        <div
          className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowWinModal(false)}
        >
          <div
            className="bg-[#0f0f1e] border border-[rgba(0,212,255,0.2)] rounded-xl p-6 max-w-[400px] w-full shadow-[0_0_40px_rgba(0,0,0,0.5)] animate-fade-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="font-display text-[1rem] font-bold mb-4 text-neon-amber flex items-center gap-2">
              <FaTrophy />¿Quién adivinó su personaje?
            </div>
            <div className="flex flex-col gap-1.5 mb-4 max-h-[250px] overflow-y-auto">
              {room.players.filter(p => p.id !== myId && !p.hasGuessed).map(p => {
                const color = getColor(room.players, p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => markWinner(p.id)}
                    className="flex items-center gap-3 px-3.5 py-2.5 bg-white/[0.03] border border-[rgba(0,212,255,0.2)] rounded-[10px] cursor-pointer transition-all hover:bg-[rgba(245,158,11,0.1)] hover:border-[rgba(245,158,11,0.4)]"
                  >
                    <div
                      className="player-avatar"
                      style={{ color, borderColor: color + '55', background: color + '18', width: 32, height: 32 }}
                    >
                      <PlayerIcon iconId={p.icon} size={14} color={color} />
                    </div>
                    <span className="flex-1 font-medium">{p.name}</span>
                    {p.wins > 0 && <span className="badge badge-amber">{p.wins}★</span>}
                  </div>
                );
              })}
              {room.players.filter(p => p.id !== myId && !p.hasGuessed).length === 0 && (
                <div className="text-center py-4 text-text-muted text-[0.82rem]">
                  Todos ya adivinaron su personaje
                </div>
              )}
            </div>
            <button className="btn btn-ghost btn-full" onClick={() => setShowWinModal(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
