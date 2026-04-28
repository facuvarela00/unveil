export type GamePhase = 'lobby' | 'assigning' | 'playing' | 'ended';

export interface Player {
  id: string;
  socketId: string;
  name: string;
  icon: string;
  isLeader: boolean;
  connected: boolean;
  hasAssigned: boolean;
  characterName: string | null;
  characterOrigin: string | null;
  assignedTo: string | null;
  wins: number;
  hasGuessed: boolean;
  turnCount: number;
}

export interface Room {
  code: string;
  phase: GamePhase;
  players: Player[];
  turnOrder: string[];
  currentTurnPlayerId: string | null;
}
