import { Server, Socket } from 'socket.io';
import { roomService } from '../services/roomService';
import { roomRepository } from '../repositories/roomRepository';

function broadcast(io: Server, roomCode: string): void {
  const room = roomRepository.findByCode(roomCode);
  if (room) io.to(roomCode).emit('room-update', room);
}

interface CreateRoomPayload { name: string; icon: string; playerId: string }
interface JoinRoomPayload { code: string; name: string; icon: string; playerId: string }
interface SubmitCharacterPayload { characterName: string; characterOrigin: string }
interface MarkWinnerPayload { playerId: string }
interface SetTurnOrderPayload { order: string[] }

export function registerRoomController(io: Server, socket: Socket): void {
  let myRoom: string | null = null;
  let myId: string | null = null;

  socket.on('create-room', ({ name, icon, playerId }: CreateRoomPayload) => {
    myId = playerId;
    const room = roomService.createRoom(playerId, socket.id, name, icon);
    myRoom = room.code;
    socket.join(room.code);
    socket.emit('room-created', { code: room.code });
    broadcast(io, room.code);
  });

  socket.on('join-room', ({ code, name, icon, playerId }: JoinRoomPayload) => {
    const normalizedCode = code.toUpperCase().trim();
    const { room, error } = roomService.joinRoom(normalizedCode, playerId, socket.id, name, icon);
    if (error || !room) { socket.emit('error', { message: error }); return; }
    myId = playerId;
    myRoom = normalizedCode;
    socket.join(normalizedCode);
    socket.emit('room-joined', { code: normalizedCode });
    broadcast(io, normalizedCode);
  });

  socket.on('start-assignment', () => {
    if (!myRoom || !myId) return;
    const { error } = roomService.startAssignment(myRoom, myId);
    if (error) { socket.emit('error', { message: error }); return; }
    broadcast(io, myRoom);
  });

  socket.on('submit-character', ({ characterName, characterOrigin }: SubmitCharacterPayload) => {
    if (!myRoom || !myId) return;
    const { error } = roomService.submitCharacter(myRoom, myId, characterName, characterOrigin);
    if (error) { socket.emit('error', { message: error }); return; }
    broadcast(io, myRoom);
  });

  socket.on('mark-winner', ({ playerId }: MarkWinnerPayload) => {
    if (!myRoom || !myId) return;
    const { winnerName, error } = roomService.markWinner(myRoom, myId, playerId);
    if (error) { socket.emit('error', { message: error }); return; }
    if (winnerName) io.to(myRoom).emit('winner-announced', { playerName: winnerName, playerId });
    broadcast(io, myRoom);
  });

  socket.on('set-turn-order', ({ order }: SetTurnOrderPayload) => {
    if (!myRoom || !myId) return;
    const { error } = roomService.setTurnOrder(myRoom, myId, order);
    if (error) { socket.emit('error', { message: error }); return; }
    broadcast(io, myRoom);
  });

  socket.on('next-turn', () => {
    if (!myRoom || !myId) return;
    const { error } = roomService.nextTurn(myRoom, myId);
    if (error) { socket.emit('error', { message: error }); return; }
    broadcast(io, myRoom);
  });

  socket.on('end-game', () => {
    if (!myRoom || !myId) return;
    const { error } = roomService.endGame(myRoom, myId);
    if (error) { socket.emit('error', { message: error }); return; }
    broadcast(io, myRoom);
  });

  socket.on('restart-game', () => {
    if (!myRoom || !myId) return;
    const { error } = roomService.restartGame(myRoom, myId);
    if (error) { socket.emit('error', { message: error }); return; }
    broadcast(io, myRoom);
  });

  socket.on('disconnect', () => {
    if (!myRoom || !myId) return;
    const room = roomService.handleDisconnect(myRoom, myId);
    if (room) broadcast(io, myRoom);
  });
}
