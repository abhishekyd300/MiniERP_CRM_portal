import express from 'express';
import cors from 'cors';
import 'express-async-errors';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'Mini CRM/ERP API'
    },
    message: 'Backend server is running smoothly.'
  });
});

// Central Error Middleware
app.use(errorHandler);

export default app;
