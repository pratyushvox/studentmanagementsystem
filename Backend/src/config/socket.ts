import { Server, Socket } from 'socket.io';
import { setIO } from '../utils/io.js';

export const setupSocket = (io: Server): void => {
  // Initialize the shared Socket.IO instance
  setIO(io);

  io.on('connection', (socket: Socket) => {
    console.log(`⚡ [Socket] Client connected: ${socket.id}`);

    // Handle joining a room
    socket.on(
      'join',
      ({ role, userId }: { role: string; userId: string }) => {
        const allowedRoles = ['teacher', 'student'];
        console.log(`[DEBUG] User attempting to join: role=${role}, userId=${userId}`);

        if (!allowedRoles.includes(role)) {
          console.log(` [Socket] Invalid role: ${role}`);
          return socket.disconnect(true);
        }

        if (!userId) {
          console.log(` [Socket] Missing userId for role: ${role}`);
          return;
        }

        const roomName = `${role}:${userId}`;
        socket.join(roomName);
        console.log(` [Socket] Joined room: ${roomName}`);

        // Confirm room join to client
        socket.emit('roomJoined', { role, userId, roomName });
      }
    );

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(` [Socket] Client disconnected: ${socket.id}`);
    });
  });
};
