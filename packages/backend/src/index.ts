import dotenv from 'dotenv';

// IMPORTANT: Load environment variables BEFORE importing other modules
// This ensures that module-level constants that depend on env vars are initialized correctly
dotenv.config();

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { zkpRouter } from './routes/zkp';
import { apiLimiter } from './utils/rate-limiter';

const app: Express = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(apiLimiter); // Apply rate limiting to all routes

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/zkp', zkpRouter);

// Start server
app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

export default app;
