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
    hasGuessed: false, turnCount: 0,
  };
}

function findNextTurnPlayerId(room: Room, afterId: string): string | null {
  const active = room.turnOrder.filter(id => {
    const p = room.players.find(x => x.id === id);
    return p && !p.hasGuessed;
  });
  if (active.length === 0) return null;
  const idx = room.turnOrder.indexOf(afterId);
  for (let i = 1; i <= room.turnOrder.length; i++) {
    const candidate = room.turnOrder[(idx + i) % room.turnOrder.length];
    if (active.includes(candidate)) return candidate;
  }
  return null;
}

export const roomService = {
  createRoom(playerId: string, socketId: string, name: string, icon: string): Room {
    const code = roomRepository.generateCode();
    const player = makePlayer(playerId, socketId, name, icon, true);
    const room: Room = {
      code,
      phase: 'lobby',
      players: [player],
      turnOrder: [playerId],
      currentTurnPlayerId: null,
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
      if (!room.turnOrder.includes(playerId)) {
        room.turnOrder.push(playerId);
      }
    }

    roomRepository.update(room);
    return { room };
  },

  setTurnOrder(
    code: string, leaderId: string, order: string[]
  ): { room?: Room; error?: string } {
    const room = roomRepository.findByCode(code);
    if (!room) return { error: 'Sala no encontrada.' };
    if (!room.players.find(p => p.id === leaderId)?.isLeader) return { error: 'No tenés permisos.' };

    const playerIds = new Set(room.players.map(p => p.id));
    const valid = order.filter(id => playerIds.has(id));
    // include any missing players at the end
    room.players.forEach(p => { if (!valid.includes(p.id)) valid.push(p.id); });
    room.turnOrder = valid;

    roomRepository.update(room);
    return { room };
  },

  startAssignment(code: string, leaderId: string): { room?: Room; error?: string } {
    const room = roomRepository.findByCode(code);
    if (!room) return { error: 'Sala no encontrada.' };
    if (!room.players.find(p => p.id === leaderId)?.isLeader) return { error: 'No tenés permisos.' };
    if (room.players.length < 2) return { error: 'Se necesitan al menos 2 jugadores para iniciar.' };

    room.phase = 'assigning';
    room.currentTurnPlayerId = null;
    room.players.forEach(p => {
      p.hasAssigned = false;
      p.characterName = null;
      p.characterOrigin = null;
      p.assignedTo = null;
      p.hasGuessed = false;
      p.turnCount = 0;
    });

    // Ensure turnOrder has all players
    const playerIds = room.players.map(p => p.id);
    const existing = room.turnOrder.filter(id => playerIds.includes(id));
    playerIds.forEach(id => { if (!existing.includes(id)) existing.push(id); });
    room.turnOrder = existing;

    // Circular random assignment
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

    if (room.players.every(p => p.hasAssigned || !p.connected)) {
      room.phase = 'playing';
      // Pick random starting player from turnOrder
      const startIdx = Math.floor(Math.random() * room.turnOrder.length);
      room.currentTurnPlayerId = room.turnOrder[startIdx];
    }

    roomRepository.update(room);
    return { room };
  },

  nextTurn(
    code: string, playerId: string
  ): { room?: Room; error?: string } {
    const room = roomRepository.findByCode(code);
    if (!room || room.phase !== 'playing') return { error: 'No hay partida en curso.' };
    if (room.currentTurnPlayerId !== playerId) return { error: 'No es tu turno.' };

    const currentPlayer = room.players.find(p => p.id === playerId);
    if (!currentPlayer) return { error: 'Jugador no encontrado.' };
    if (currentPlayer.hasGuessed) return { error: 'Ya adivinaste tu personaje.' };

    currentPlayer.turnCount++;

    const nextId = findNextTurnPlayerId(room, playerId);
    room.currentTurnPlayerId = nextId;

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
    winner.hasGuessed = true;

    // If it was this player's turn, auto-advance
    if (room.currentTurnPlayerId === playerId) {
      const nextId = findNextTurnPlayerId(room, playerId);
      room.currentTurnPlayerId = nextId;
    }

    // Check if all players have guessed → auto end
    if (room.players.every(p => p.hasGuessed)) {
      room.phase = 'ended';
    }

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
    room.currentTurnPlayerId = null;
    room.players.forEach(p => {
      p.hasAssigned = false;
      p.characterName = null;
      p.characterOrigin = null;
      p.assignedTo = null;
      p.hasGuessed = false;
      p.turnCount = 0;
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
      room.turnOrder = room.turnOrder.filter(id => id !== playerId);
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
      // Don't auto-start the game on disconnect; submitCharacter will start it
      // once all remaining connected players have submitted.
    } else if (room.phase === 'playing') {
      if (!room.players.some(p => p.isLeader && p.connected)) {
        const next = room.players.find(p => p.connected);
        if (next) next.isLeader = true;
      }
      // Don't auto-advance turn on disconnect — player may reconnect shortly
    }

    roomRepository.update(room);
    return room;
  },
};
