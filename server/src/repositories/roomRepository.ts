import { Room } from '../types';

const rooms: Record<string, Room> = {};

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const roomRepository = {
  findByCode(code: string): Room | undefined {
    return rooms[code];
  },

  create(room: Room): void {
    rooms[room.code] = room;
  },

  update(room: Room): void {
    rooms[room.code] = room;
  },

  delete(code: string): void {
    delete rooms[code];
  },

  exists(code: string): boolean {
    return !!rooms[code];
  },

  generateCode(): string {
    let code: string;
    do {
      code = Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
    } while (this.exists(code));
    return code;
  },
};
