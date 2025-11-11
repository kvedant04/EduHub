import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import classRoutes from './routes/class.js';
import meetingRoutes from './routes/meeting.js';
import assignmentRoutes from './routes/assignment.js';
import notificationRoutes from './routes/notification.js';
import analyticsRoutes from './routes/analytics.js';
import { setupSocketHandlers } from './socket/index.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Database connection
mongoose.connect(
  process.env.MONGODB_URI || 'mongodb+srv://vedantkolhe11_db_user:eduhub@cluster0.vsfmzbv.mongodb.net/eduhub?retryWrites=true&w=majority'
)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

// Socket.io setup
setupSocketHandlers(io);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'LMS Server Running' });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export { io };
