import express from 'express';
import cors from 'cors';
import 'express-async-errors';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import customerRoutes from './modules/customers/customers.routes';
import productRoutes from './modules/products/products.routes';
import challanRoutes from './modules/challans/challans.routes';

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

// API Routes (supports both /api prefix and root level serverless routing)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/customers', customerRoutes);
app.use('/customers', customerRoutes);

app.use('/api/products', productRoutes);
app.use('/products', productRoutes);

app.use('/api/challans', challanRoutes);
app.use('/challans', challanRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.originalUrl} - Route not found`,
  });
});

// Central Error Middleware
app.use(errorHandler);

export default app;
