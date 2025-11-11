import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Meeting from '../models/Meeting.js';
import Notification from '../models/Notification.js';

const connectedUsers = new Map();

export const setupSocketHandlers = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devsecret_change_me');
      const user = await User.findById(decoded.id);
      
      if (!user) return next(new Error('User not found'));
      
      socket.userId = user._id.toString();
      socket.userName = user.name;
      socket.userRole = user.role;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userName} (${socket.userId})`);
    connectedUsers.set(socket.userId, socket.id);

    socket.on('join-meeting', async ({ meetingId }) => {
      try {
        const meeting = await Meeting.findById(meetingId);
        
        if (!meeting) {
          return socket.emit('error', { message: 'Meeting not found' });
        }

        socket.join(`meeting-${meetingId}`);

        // Check if user is already a participant
        const existingParticipant = meeting.participants.find(
          p => p.user.toString() === socket.userId
        );

        if (existingParticipant) {
          // If previously removed, prevent rejoin
          if (existingParticipant.status === 'removed') {
            return socket.emit('error', { message: 'You have been removed from this meeting' });
          }
          // User is rejoining, just emit the current status
          socket.emit('meeting-joined', { meeting });
          return;
        }

        // New participant
        const participant = {
          user: socket.userId,
          joinedAt: new Date(),
          status: meeting.settings.waitingRoom && socket.userRole === 'student' 
            ? 'waiting' 
            : 'joined'
        };

        meeting.participants.push(participant);
        await meeting.save();

        if (participant.status === 'waiting') {
          io.to(`meeting-${meetingId}`).emit('user-waiting', {
            userId: socket.userId,
            userName: socket.userName
          });
        } else {
          io.to(`meeting-${meetingId}`).emit('user-joined', {
            userId: socket.userId,
            userName: socket.userName
          });
        }

        socket.emit('meeting-joined', { meeting });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('admit-user', async ({ meetingId, userId }) => {
      if (socket.userRole !== 'teacher') {
        return socket.emit('error', { message: 'Not authorized' });
      }

      try {
        const meeting = await Meeting.findById(meetingId).populate('participants.user', 'name');
        const participant = meeting.participants.find(p => p.user._id.toString() === userId);
        
        if (participant) {
          participant.status = 'joined';
          await meeting.save();

          const userSocketId = connectedUsers.get(userId);
          if (userSocketId) {
            io.to(userSocketId).emit('admitted-to-meeting', { meetingId });
          }

          io.to(`meeting-${meetingId}`).emit('user-joined', { 
            userId,
            userName: participant.user.name 
          });
        }
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('remove-user', async ({ meetingId, userId }) => {
      if (socket.userRole !== 'teacher') {
        return socket.emit('error', { message: 'Not authorized' });
      }

      try {
        const meeting = await Meeting.findById(meetingId);
        if (meeting) {
          const participant = meeting.participants.find(p => p.user.toString() === userId);
          if (participant) {
            participant.status = 'removed';
            participant.leftAt = new Date();
            await meeting.save();
          }
        }

        const userSocketId = connectedUsers.get(userId);
        if (userSocketId) {
          io.to(userSocketId).emit('removed-from-meeting', { meetingId });
          io.sockets.sockets.get(userSocketId)?.leave(`meeting-${meetingId}`);
        }

        io.to(`meeting-${meetingId}`).emit('user-removed', { userId });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('send-message', ({ meetingId, message }) => {
      io.to(`meeting-${meetingId}`).emit('new-message', {
        userId: socket.userId,
        userName: socket.userName,
        message,
        timestamp: new Date()
      });
    });

    socket.on('raise-hand', ({ meetingId }) => {
      io.to(`meeting-${meetingId}`).emit('hand-raised', {
        userId: socket.userId,
        userName: socket.userName
      });
    });

    socket.on('react', ({ meetingId, emoji }) => {
      io.to(`meeting-${meetingId}`).emit('reaction', {
        userId: socket.userId,
        userName: socket.userName,
        emoji
      });
    });

    socket.on('toggle-chat', ({ meetingId, enabled }) => {
      if (socket.userRole !== 'teacher') return;
      
      io.to(`meeting-${meetingId}`).emit('chat-toggled', { enabled });
    });

    socket.on('screen-share', ({ meetingId, sharing }) => {
      io.to(`meeting-${meetingId}`).emit('screen-share-update', {
        userId: socket.userId,
        userName: socket.userName,
        sharing
      });
    });

    // WebRTC signaling
    socket.on('ready-for-webrtc', ({ meetingId }) => {
      socket.to(`meeting-${meetingId}`).emit('user-ready-for-webrtc', {
        userId: socket.userId,
        userName: socket.userName
      });
    });

    socket.on('webrtc-offer', ({ meetingId, targetUserId, offer }) => {
      const targetSocketId = connectedUsers.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc-offer', {
          fromUserId: socket.userId,
          offer
        });
      }
    });

    socket.on('webrtc-answer', ({ meetingId, targetUserId, answer }) => {
      const targetSocketId = connectedUsers.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc-answer', {
          fromUserId: socket.userId,
          answer
        });
      }
    });

    socket.on('webrtc-ice-candidate', ({ meetingId, targetUserId, candidate }) => {
      const targetSocketId = connectedUsers.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc-ice-candidate', {
          fromUserId: socket.userId,
          candidate
        });
      }
    });

    socket.on('send-notification', async ({ recipientId, notification }) => {
      try {
        const newNotification = await Notification.create({
          recipient: recipientId,
          ...notification
        });

        const recipientSocketId = connectedUsers.get(recipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('notification', newNotification);
        }
      } catch (error) {
        console.error('Notification error:', error);
      }
    });

    socket.on('leave-meeting', ({ meetingId }) => {
      socket.leave(`meeting-${meetingId}`);
      io.to(`meeting-${meetingId}`).emit('user-left-meeting', {
        userId: socket.userId,
        userName: socket.userName
      });
    });

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userName}`);
      
      // Notify all rooms this user was in
      const rooms = Array.from(socket.rooms);
      rooms.forEach(room => {
        if (room.startsWith('meeting-')) {
          socket.to(room).emit('user-left-meeting', {
            userId: socket.userId,
            userName: socket.userName
          });
        }
      });
      
      connectedUsers.delete(socket.userId);
    });
  });
};
