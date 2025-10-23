// Custom server with Socket.IO support
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Store io instance globally for API routes
  global.io = io;

  // Socket.IO event handlers
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-table', async ({ tableId, playerId }) => {
      socket.join(`table-${tableId}`);
      console.log(`Player ${playerId} joined table ${tableId}`);
      io.to(`table-${tableId}`).emit('player-joined', { playerId, tableId });
    });

    socket.on('leave-table', async ({ tableId, playerId }) => {
      socket.leave(`table-${tableId}`);
      console.log(`Player ${playerId} left table ${tableId}`);
      io.to(`table-${tableId}`).emit('player-left', { playerId, tableId });
    });

    socket.on('place-bet', async ({ tableId, playerId, bet }) => {
      console.log(`Player ${playerId} placed bet on table ${tableId}:`, bet);
      io.to(`table-${tableId}`).emit('bet-placed', { playerId, bet });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
