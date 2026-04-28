import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { registerRoomController } from './controllers/roomController';

const app = express();
app.get('/ping', (_req, res) => res.send('pong'));
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGIN ?? '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  registerRoomController(io, socket);
});

const PORT = process.env.PORT ?? 3001;
server.listen(PORT, () => console.log(`UnVeil server running on http://localhost:${PORT}`));
