const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

let io = null;

const setupSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: config.clientUrl,
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) return next(new Error('No token'));
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    socket.join(`user:${userId}`);
    console.log(`User connected: ${socket.user.username}`);

    socket.on('join:question', (questionId) => {
      socket.join(`question:${questionId}`);
    });

    socket.on('leave:question', (questionId) => {
      socket.leave(`question:${questionId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.username}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

const emitToQuestion = (questionId, event, data) => {
  if (io) {
    io.to(`question:${questionId}`).emit(event, data);
  }
};

module.exports = { setupSocket, getIO, emitToUser, emitToQuestion };
