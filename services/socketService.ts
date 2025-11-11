import { io, Socket } from 'socket.io-client';

const resolveDefaultUrl = (): string => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = '4000';
    return `${protocol}//${hostname}:${port}`;
  }
  return 'http://localhost:4000';
};

const SOCKET_URL = resolveDefaultUrl();

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket'],
    });
  }
  return socket;
};

export const connectSocket = (): Socket => {
  const instance = getSocket();
  if (!instance.connected) {
    instance.connect();
  }
  return instance;
};

export const disconnectSocket = (): void => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};

export const clearSocketInstance = (): void => {
  socket = null;
};
