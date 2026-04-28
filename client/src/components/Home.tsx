import { useState, useEffect } from 'react';
import { FaBolt, FaRocket } from 'react-icons/fa';
import AnimalPicker from './AnimalPicker';
import { JoinParams } from '../types';

interface HomeProps {
  onJoin: (params: JoinParams) => void;
}

export default function Home({ onJoin }: HomeProps) {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('dog');
  const [roomCode, setRoomCode] = useState('');
  const [nameError, setNameError] = useState('');
  const [codeError, setCodeError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    if (code) {
      setRoomCode(code.toUpperCase());
      setTab('join');
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;

    if (!name.trim()) {
      setNameError('Ingresá tu nombre de participante.');
      valid = false;
    } else {
      setNameError('');
    }

    if (tab === 'join') {
      if (roomCode.trim().length !== 6) {
        setCodeError('El código debe tener 6 caracteres.');
        valid = false;
      } else {
        setCodeError('');
      }
    }

    if (!valid) return;
    onJoin({ name: name.trim(), icon, roomCode: roomCode.trim(), isCreating: tab === 'create' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 px-4">
      <div className="w-full max-w-[440px] animate-fade-up">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="logo-text">UnVeil</div>
          <div className="logo-sub">Adiviná tu personaje</div>
        </div>

        <div className="card card-glow">
          {/* Tabs */}
          <div className="flex bg-white/[0.04] border border-[rgba(0,212,255,0.2)] rounded-[10px] p-1 mb-5 gap-1">
            {(['create', 'join'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={[
                  'flex-1 py-2 rounded-[7px] font-display text-[0.68rem] font-bold uppercase tracking-[0.06em] cursor-pointer transition-all duration-[0.18s]',
                  tab === t
                    ? 'bg-gradient-to-br from-[rgba(0,212,255,0.15)] to-[rgba(168,85,247,0.15)] text-[#eef2f7] border border-[rgba(0,212,255,0.2)]'
                    : 'bg-transparent text-text-muted',
                ].join(' ')}
              >
                {t === 'create' ? 'Crear Sala' : 'Unirse'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {tab === 'join' && (
              <div className="input-group">
                <label className="input-label">Código de sala</label>
                <input
                  className="input input-code"
                  placeholder="ABCDEF"
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
                  maxLength={6}
                  autoComplete="off"
                  spellCheck={false}
                />
                {codeError && (
                  <span className="text-[0.75rem] text-neon-red mt-1 block">{codeError}</span>
                )}
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Tu nombre</label>
              <input
                className="input"
                placeholder="Ej: Facundo"
                value={name}
                onChange={e => setName(e.target.value.slice(0, 24))}
                autoComplete="off"
                autoFocus
              />
              {nameError && (
                <span className="text-[0.75rem] text-neon-red mt-1 block">{nameError}</span>
              )}
            </div>

            <AnimalPicker value={icon} onChange={setIcon} />

            <button
              type="submit"
              className={`btn btn-full btn-lg mt-1 ${tab === 'create' ? 'btn-primary' : 'btn-secondary'}`}
            >
              {tab === 'create' ? <><FaBolt className="inline mr-2" />Crear Sala</> : <><FaRocket className="inline mr-2" />Unirse</>}
            </button>
          </form>
        </div>

        <p className="text-center mt-4 text-[0.75rem] text-text-muted">
          Sala privada · Necesitás el código para ingresar
        </p>
      </div>
    </div>
  );
}
