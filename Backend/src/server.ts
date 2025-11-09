import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db';
import { setupSocket } from './config/socket'; // correct path if needed

import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import teacherRoutes from './routes/teacherRoutes';
import studentRoutes from './routes/studentRoutes';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: 'http://localhost:5173', // frontend origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Create HTTP server (required for Socket.IO)
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Setup socket (registers all events + sets global instance)
setupSocket(io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Connect to database and start server
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`✅ Server running with Socket.IO on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Failed:', err);
  });
