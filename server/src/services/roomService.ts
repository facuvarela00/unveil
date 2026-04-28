import { roomRepository } from '../repositories/roomRepository';
import { Player, Room } from '../types';

function makePlayer(
  id: string,
  socketId: string,
  name: string,
  icon: string,
  isLeader: boolean
): Player {
  return {
    id, socketId, name, icon,
    isLeader, connected: true,
    hasAssigned: false, characterName: null, characterOrigin: null,
    assignedTo: null, wins: 0,
  };
}

export const roomService = {
  createRoom(playerId: string, socketId: string, name: string, icon: string): Room {
    const code = roomRepository.generateCode();
    const room: Room = {
      code,
      phase: 'lobby',
      players: [makePlayer(playerId, socketId, name, icon, true)],
    };
    roomRepository.create(room);
    return room;
  },

  joinRoom(
    code: string, playerId: string, socketId: string, name: string, icon: string
  ): { room?: Room; error?: string } {
    const room = roomRepository.findByCode(code);
    if (!room) return { error: 'Sala no encontrada. Verificá el código.' };

    const existing = room.players.find(p => p.id === playerId);

    if (room.phase !== 'lobby' && !existing) {
      return { error: 'La partida ya comenzó y no sos parte de esta sala.' };
    }

    if (existing) {
      existing.socketId = socketId;
      existing.connected = true;
      existing.name = name;
      existing.icon = icon;
    } else {
      room.players.push(makePlayer(playerId, socketId, name, icon, false));
    }

    roomRepository.update(room);
    return { room };
  },

  startAssignment(code: string, leaderId: string): { room?: Room; error?: string } {
    const room = roomRepository.findByCode(code);
    if (!room) return { error: 'Sala no encontrada.' };
    if (!room.players.find(p => p.id === leaderId)?.isLeader) return { error: 'No tenés permisos.' };
    if (room.players.length < 2) return { error: 'Se necesitan al menos 2 jugadores para iniciar.' };

    room.phase = 'assigning';
    room.players.forEach(p => {
      p.hasAssigned = false;
      p.characterName = null;
      p.characterOrigin = null;
      p.assignedTo = null;
    });

    // Circular random assignment: shuffled[i] writes for shuffled[(i+1) % n]
    const shuffled = [...room.players].sort(() => Math.random() - 0.5);
    shuffled.forEach((p, i) => {
      room.players.find(x => x.id === p.id)!.assignedTo = shuffled[(i + 1) % shuffled.length].id;
    });

    roomRepository.update(room);
    return { room };
  },

  submitCharacter(
    code: string, writerId: string, characterName: string, characterOrigin: string
  ): { room?: Room; error?: string } {
    const room = roomRepository.findByCode(code);
    if (!room || room.phase !== 'assigning') return { error: 'Operación no válida.' };

    const writer = room.players.find(p => p.id === writerId);
    if (!writer || writer.hasAssigned) return { error: 'Ya confirmaste un personaje.' };

    const target = room.players.find(p => p.id === writer.assignedTo);
    if (!target) return { error: 'Target no encontrado.' };

    target.characterName = characterName.trim();
    target.characterOrigin = characterOrigin.trim();
    writer.hasAssigned = true;

    if (room.players.every(p => p.hasAssigned)) room.phase = 'playing';

    roomRepository.update(room);
    return { room };
  },

  markWinner(
    code: string, leaderId: string, playerId: string
  ): { room?: Room; winnerName?: string; error?: string } {
    const room = roomRepository.findByCode(code);
    if (!room) return { error: 'Sala no encontrada.' };
    if (!room.players.find(p => p.id === leaderId)?.isLeader) return { error: 'No tenés permisos.' };

    const winner = room.players.find(p => p.id === playerId);
    if (!winner) return { error: 'Jugador no encontrado.' };

    winner.wins++;
    roomRepository.update(room);
    return { room, winnerName: winner.name };
  },

  endGame(code: string, leaderId: string): { room?: Room; error?: string } {
    const room = roomRepository.findByCode(code);
    if (!room) return { error: 'Sala no encontrada.' };
    if (!room.players.find(p => p.id === leaderId)?.isLeader) return { error: 'No tenés permisos.' };

    room.phase = 'ended';
    roomRepository.update(room);
    return { room };
  },

  restartGame(code: string, leaderId: string): { room?: Room; error?: string } {
    const room = roomRepository.findByCode(code);
    if (!room) return { error: 'Sala no encontrada.' };
    if (!room.players.find(p => p.id === leaderId)?.isLeader) return { error: 'No tenés permisos.' };

    room.phase = 'lobby';
    room.players.forEach(p => {
      p.hasAssigned = false;
      p.characterName = null;
      p.characterOrigin = null;
      p.assignedTo = null;
    });
    roomRepository.update(room);
    return { room };
  },

  handleDisconnect(code: string, playerId: string): Room | null {
    const room = roomRepository.findByCode(code);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return null;

    player.connected = false;

    if (room.phase === 'lobby') {
      room.players = room.players.filter(p => p.id !== playerId);
      if (room.players.length === 0) { roomRepository.delete(code); return null; }
      if (!room.players.some(p => p.isLeader)) room.players[0].isLeader = true;
    } else if (room.phase === 'assigning') {
      if (!player.hasAssigned) {
        player.hasAssigned = true;
        const target = room.players.find(p => p.id === player.assignedTo);
        if (target && !target.characterName) {
          target.characterName = '???';
          target.characterOrigin = 'Desconocido';
        }
      }
      if (room.players.every(p => p.hasAssigned)) room.phase = 'playing';
    } else {
      if (!room.players.some(p => p.isLeader && p.connected)) {
        const next = room.players.find(p => p.connected);
        if (next) next.isLeader = true;
      }
    }

    roomRepository.update(room);
    return room;
  },
};
