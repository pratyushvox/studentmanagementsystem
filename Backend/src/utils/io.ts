
import { Server } from 'socket.io';

let ioInstance: Server | null = null;

/**
 * Initialize and store the shared Socket.IO instance.
 * Call this once in server.ts when you create your io server.
 */
export const setIO = (io: Server): void => {
  ioInstance = io;
};

/**
 * Retrieve the shared Socket.IO instance.
 * Importing this in any controller to emit events.
 */
export const getIO = (): Server => {
  if (!ioInstance) {
    throw new Error('[IO] Socket.IO instance not initialized. Make sure setIO() was called.');
  }
  return ioInstance;
};
