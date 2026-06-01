import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initDb } from './config/database.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initializeWebSocket } from './services/websocketService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:5173', // Vite
      'http://localhost:3000',  // React dev server
    ];
    if (!origin) return callback(null, true); // Autoriser les requêtes sans origin (Postman, curl)
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`Origin ${origin} non autorisée par CORS`));
  },
  credentials: true,
}));
app.use(express.json());

app.use('/api', routes);

app.use(errorHandler);

const server = createServer(app);

async function start() {
  try {
    await initDb();
    initializeWebSocket(server);
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`WebSocket server initialized`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
