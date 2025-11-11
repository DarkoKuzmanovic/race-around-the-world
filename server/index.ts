import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';

dotenv.config();

const app = express();
app.use(cors());

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Race Around The World realtime server' });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
});

type PlayerRole = 'host' | 'guest';

interface RoomPlayer {
  id: string;
  name: string;
  role: PlayerRole;
  joinedAt: number;
}

interface Room {
  code: string;
  hostId: string;
  players: Record<string, RoomPlayer>;
  createdAt: number;
}

const rooms = new Map<string, Room>();
const socketToRoom = new Map<string, string>();

const MAX_PLAYERS = 2;

const logRoomsSnapshot = () => {
  const codes = [...rooms.keys()];
  console.log(`[socket] active rooms: ${codes.length ? codes.join(', ') : 'none'}`);
};

const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let attempt = '';
  do {
    attempt = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms.has(attempt));
  return attempt;
};

const getRoomBySocket = (socketId: string): Room | undefined => {
  const code = socketToRoom.get(socketId);
  if (!code) return undefined;
  return rooms.get(code);
};

const removeSocketFromRoom = (socket: Socket): void => {
  const room = getRoomBySocket(socket.id);
  if (!room) return;

  const { code, hostId } = room;
  delete room.players[socket.id];
  socketToRoom.delete(socket.id);
  socket.leave(code);

  if (socket.id === hostId) {
    console.log(`[socket] host ${socket.id} closed room ${code}`);
    io.to(code).emit('room:closed');
    Object.keys(room.players).forEach((playerId) => {
      const targetSocket = io.sockets.sockets.get(playerId);
      targetSocket?.leave(code);
      socketToRoom.delete(playerId);
    });
    rooms.delete(code);
    logRoomsSnapshot();
    return;
  }

  console.log(`[socket] ${socket.id} left room ${code}`);
  io.to(code).emit('room:update', {
    code,
    players: Object.values(room.players),
  });
  logRoomsSnapshot();
};

io.on('connection', (socket) => {
  console.log(`[socket] ${socket.id} connected`);
  socket.on('createRoom', ({ name }: { name: string }) => {
    if (!name || typeof name !== 'string') {
      socket.emit('room:error', 'Please provide a display name.');
      console.warn(`[socket] ${socket.id} attempted to create a room without a valid name`);
      return;
    }

    if (socketToRoom.has(socket.id)) {
      removeSocketFromRoom(socket);
    }

    const code = generateRoomCode();
    const player: RoomPlayer = {
      id: socket.id,
      name: name.trim(),
      role: 'host',
      joinedAt: Date.now(),
    };

    const room: Room = {
      code,
      hostId: socket.id,
      players: { [socket.id]: player },
      createdAt: Date.now(),
    };

    rooms.set(code, room);
    socketToRoom.set(socket.id, code);
    socket.join(code);

    socket.emit('room:created', { code, player });
    socket.emit('room:update', { code, players: Object.values(room.players) });
    console.log(`[socket] ${socket.id} created room ${code} as ${player.name}`);
    logRoomsSnapshot();
  });

  socket.on('joinRoom', ({ code, name }: { code: string; name: string }) => {
    const normalizedCode = code?.toUpperCase();
    const room = rooms.get(normalizedCode);

    if (!normalizedCode || !room) {
      socket.emit('room:error', 'Room not found. Double-check the code.');
      console.warn(`[socket] ${socket.id} failed to join room ${normalizedCode || '<empty>'}: not found`);
      return;
    }

    const playerCount = Object.keys(room.players).length;
    if (playerCount >= MAX_PLAYERS) {
      socket.emit('room:error', 'This room is already full.');
      console.warn(`[socket] ${socket.id} tried to join room ${normalizedCode}: room full`);
      return;
    }

    if (!name || typeof name !== 'string') {
      socket.emit('room:error', 'Please provide a display name.');
      console.warn(`[socket] ${socket.id} attempted to join room ${normalizedCode} without a valid name`);
      return;
    }

    socket.join(normalizedCode);
    socketToRoom.set(socket.id, normalizedCode);

    const player: RoomPlayer = {
      id: socket.id,
      name: name.trim(),
      role: 'guest',
      joinedAt: Date.now(),
    };

    room.players[socket.id] = player;

    socket.emit('room:joined', { code: normalizedCode, player });
    io.to(normalizedCode).emit('room:update', {
      code: normalizedCode,
      players: Object.values(room.players),
    });
    console.log(`[socket] ${socket.id} joined room ${normalizedCode} as ${player.name}`);
    logRoomsSnapshot();
  });

  socket.on('leaveRoom', () => {
    console.log(`[socket] ${socket.id} requested to leave their room`);
    removeSocketFromRoom(socket);
  });

  socket.on('client:action', (payload) => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;
    const targetHost = io.sockets.sockets.get(room.hostId);
    if (!targetHost) return;
    console.log(`[socket] relaying action ${payload?.type ?? 'unknown'} from ${socket.id} to host ${room.hostId}`);
    targetHost.emit('room:action', {
      from: socket.id,
      payload,
    });
  });

  socket.on('host:state', (state) => {
    const room = getRoomBySocket(socket.id);
    if (!room || room.hostId !== socket.id) {
      return;
    }
    console.log(`[socket] host ${socket.id} broadcast state for room ${room.code}`);
    socket.to(room.code).emit('state:sync', state);
  });

  socket.on('disconnect', () => {
    console.log(`[socket] ${socket.id} disconnected`);
    removeSocketFromRoom(socket);
  });
});

const PORT = Number(process.env.PORT || 4000);

httpServer.listen(PORT, () => {
  console.log(`Realtime server listening on port ${PORT}`);
});
