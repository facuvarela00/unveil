import {
  FaDog, FaCat, FaFish, FaFrog, FaDragon, FaCrow,
  FaSpider, FaOtter, FaDove, FaHippo, FaBug, FaHorse, FaKiwiBird,
} from 'react-icons/fa';
import { GiSnake, GiOwl, GiCrab } from 'react-icons/gi';
import type { IconType } from 'react-icons';

interface Animal {
  id: string;
  Icon: IconType;
  label: string;
}

export const ANIMALS: Animal[] = [
  { id: 'dog',    Icon: FaDog,      label: 'Perro' },
  { id: 'cat',    Icon: FaCat,      label: 'Gato' },
  { id: 'fish',   Icon: FaFish,     label: 'Pez' },
  { id: 'frog',   Icon: FaFrog,     label: 'Rana' },
  { id: 'dragon', Icon: FaDragon,   label: 'Dragón' },
  { id: 'crow',   Icon: FaCrow,     label: 'Cuervo' },
  { id: 'spider', Icon: FaSpider,   label: 'Araña' },
  { id: 'otter',  Icon: FaOtter,    label: 'Nutria' },
  { id: 'dove',   Icon: FaDove,     label: 'Paloma' },
  { id: 'hippo',  Icon: FaHippo,    label: 'Hipopótamo' },
  { id: 'bug',    Icon: FaBug,      label: 'Bicho' },
  { id: 'horse',  Icon: FaHorse,    label: 'Caballo' },
  { id: 'kiwi',   Icon: FaKiwiBird, label: 'Kiwi' },
  { id: 'snake',  Icon: GiSnake,    label: 'Serpiente' },
  { id: 'owl',    Icon: GiOwl,      label: 'Búho' },
  { id: 'crab',   Icon: GiCrab,     label: 'Cangrejo' },
];

export function getAnimal(id: string): Animal {
  return ANIMALS.find(a => a.id === id) ?? ANIMALS[0];
}

interface PlayerIconProps {
  iconId: string;
  size?: number;
  color?: string;
}

export function PlayerIcon({ iconId, size = 18, color }: PlayerIconProps) {
  const animal = getAnimal(iconId);
  return <animal.Icon size={size} color={color} />;
}

interface AnimalPickerProps {
  value: string;
  onChange: (id: string) => void;
}

export default function AnimalPicker({ value, onChange }: AnimalPickerProps) {
  return (
    <div>
      <div className="input-label mb-2">Elegí tu ícono</div>
      <div className="grid grid-cols-8 gap-1.5 mb-3.5">
        {ANIMALS.map(({ id, Icon, label }) => (
          <button
            key={id}
            type="button"
            title={label}
            onClick={() => onChange(id)}
            className={[
              'aspect-square flex items-center justify-center rounded-lg border transition-all duration-[0.18s]',
              'text-[1.1rem] cursor-pointer relative group',
              value === id
                ? 'bg-[rgba(0,212,255,0.12)] border-neon-cyan text-neon-cyan shadow-[0_0_12px_rgba(0,212,255,0.3)]'
                : 'bg-white/[0.03] border-[rgba(0,212,255,0.2)] text-text-secondary hover:bg-[rgba(0,212,255,0.12)] hover:border-neon-cyan hover:text-neon-cyan hover:scale-105',
            ].join(' ')}
          >
            <Icon size={16} />
            <span className="hidden group-hover:block absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 bg-[rgba(10,10,20,0.95)] border border-[rgba(0,212,255,0.2)] rounded-md px-2 py-0.5 text-[0.65rem] whitespace-nowrap text-[#eef2f7] pointer-events-none z-10">
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
