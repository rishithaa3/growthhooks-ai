import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import hooksRouter from './routes/hooks.js';
import emailRouter from './routes/email.js';

import { startScheduler } from './services/scheduler.js';

dotenv.config();
startScheduler();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', hooksRouter);
app.use('/api', emailRouter);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'GrowthHooks AI server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
