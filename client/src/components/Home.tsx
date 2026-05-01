import { useState, useEffect } from 'react';
import { FaBolt, FaRocket, FaChevronDown, FaUsers, FaCrown, FaUserSecret, FaComments, FaTrophy } from 'react-icons/fa';
import AnimalPicker from './AnimalPicker';
import { JoinParams } from '../types';

interface HomeProps {
  onJoin: (params: JoinParams) => void;
}

export default function Home({ onJoin }: HomeProps) {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [showHowTo, setShowHowTo] = useState(false);
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
          <div className="logo-text">Unveil</div>
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

        {/* How to play accordion */}
        <div className="mt-4 rounded-xl border border-[rgba(0,212,255,0.18)] overflow-hidden">
          <button
            type="button"
            onClick={() => setShowHowTo(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 bg-white/[0.03] hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <span className="font-display font-bold text-[0.85rem] tracking-[0.06em] text-text-secondary uppercase">
              ¿Cómo jugar?
            </span>
            <FaChevronDown
              className="text-text-muted transition-transform duration-300"
              style={{ transform: showHowTo ? 'rotate(180deg)' : 'rotate(0deg)', fontSize: '0.8rem' }}
            />
          </button>

          {showHowTo && (
            <div className="px-5 pb-6 pt-1 bg-white/[0.02] flex flex-col gap-5 animate-fade-up">

              <p className="text-[0.82rem] text-text-muted leading-relaxed">
                Unveil es un juego de mesa digital para jugar <strong className="text-text-secondary">en persona y en grupo</strong>.
                Cada jugador tiene un personaje secreto en la frente que <em>todos ven menos él</em>.
                El objetivo es adivinarlo haciendo preguntas de sí o no.
              </p>

              {/* Steps */}
              <div className="flex flex-col gap-4">

                <div className="flex gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-[rgba(0,212,255,0.3)]"
                    style={{ background: 'rgba(0,212,255,0.08)', color: '#00d4ff' }}>
                    <FaCrown style={{ fontSize: '0.75rem' }} />
                  </div>
                  <div>
                    <div className="text-[0.82rem] font-semibold text-text-secondary mb-0.5">1. El líder arma la sala</div>
                    <div className="text-[0.78rem] text-text-muted leading-relaxed">
                      Uno crea la sala y comparte el código de 6 letras con el grupo. Los demás se unen desde sus celulares. El líder puede reordenar los turnos antes de empezar.
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-[rgba(168,85,247,0.3)]"
                    style={{ background: 'rgba(168,85,247,0.08)', color: '#a855f7' }}>
                    <FaUserSecret style={{ fontSize: '0.75rem' }} />
                  </div>
                  <div>
                    <div className="text-[0.82rem] font-semibold text-text-secondary mb-0.5">2. Asignación de personajes</div>
                    <div className="text-[0.78rem] text-text-muted leading-relaxed">
                      La app asigna a cada jugador un compañero en secreto. Cada uno escribe el nombre y origen de un personaje (real, ficticio, histórico, lo que quieran) para esa persona. El personaje aparece en el perfil de ese jugador para que <em>todos lo vean menos él</em>.
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-[rgba(34,197,94,0.3)]"
                    style={{ background: 'rgba(34,197,94,0.08)', color: '#22c55e' }}>
                    <FaComments style={{ fontSize: '0.75rem' }} />
                  </div>
                  <div>
                    <div className="text-[0.82rem] font-semibold text-text-secondary mb-0.5">3. Turnos y preguntas</div>
                    <div className="text-[0.78rem] text-text-muted leading-relaxed">
                      De a uno por turno, cada jugador hace una pregunta al grupo que se responda con <strong className="text-text-secondary">Sí o No</strong> para descubrir su personaje. Por ejemplo: "¿Soy una persona real?", "¿Soy mujer?", "¿Soy de una película?". Después de preguntar, apretás <em>Continuar</em> para pasar al siguiente.
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-[rgba(245,158,11,0.3)]"
                    style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b' }}>
                    <FaTrophy style={{ fontSize: '0.75rem' }} />
                  </div>
                  <div>
                    <div className="text-[0.82rem] font-semibold text-text-secondary mb-0.5">4. Adivinar y ganar</div>
                    <div className="text-[0.78rem] text-text-muted leading-relaxed">
                      Cuando creés saber quién sos, decilo en voz alta. Si acertás, el líder te marca como ganador y seguís participando de los turnos para ayudar a los demás. ¡El que adivina primero se lleva la estrella!
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-[rgba(239,68,68,0.3)]"
                    style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
                    <FaUsers style={{ fontSize: '0.75rem' }} />
                  </div>
                  <div>
                    <div className="text-[0.82rem] font-semibold text-text-secondary mb-0.5">5. Nueva ronda</div>
                    <div className="text-[0.78rem] text-text-muted leading-relaxed">
                      Cuando todos adivinaron, el líder puede reiniciar la partida y jugar de nuevo con nuevos personajes. ¡Cada ronda dura entre 10 y 30 minutos dependiendo del grupo!
                    </div>
                  </div>
                </div>

              </div>

              <div className="rounded-lg px-4 py-3 text-[0.77rem] text-text-muted leading-relaxed border border-[rgba(0,212,255,0.12)]"
                style={{ background: 'rgba(0,212,255,0.04)' }}>
                <strong className="text-[#00d4ff]">Tip:</strong> Podés usar el bloc de notas dentro del juego para anotar las pistas que vas consiguiendo con cada pregunta.
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
