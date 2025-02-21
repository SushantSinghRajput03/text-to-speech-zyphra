import express from 'express';
import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import ttsRoutes from './routes/tts.routes.js';

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));

// Increase JSON payload limit to handle voice samples (15MB limit)
app.use(express.json({
  limit: '15mb',
  verify: (req: Request, _res: Response, buf: Buffer, encoding: string): void => {
    try {
      JSON.parse(buf.toString(encoding as BufferEncoding));
    } catch (e) {
      console.error('Invalid JSON:', buf.toString(encoding as BufferEncoding));
      throw new Error('Invalid JSON format');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Routes
app.use('/api/tts', ttsRoutes);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
const errorHandler: ErrorRequestHandler = (err, _req, res, next): void => {
  console.error('Unhandled Error:', err);
  
  if (res.headersSent) {
    next(err);
    return;
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      message: 'Invalid JSON format. Please check your request body.',
      error: {
        type: 'SyntaxError',
        details: err.message
      }
    });
    return;
  }
  
  // Handle payload size error
  if ('type' in err && err.type === 'entity.too.large') {
    res.status(413).json({
      success: false,
      message: 'File size too large. Maximum size is 15MB.',
      error: {
        type: 'PayloadTooLargeError',
        details: err.message
      }
    });
    return;
  }

  // Handle other errors
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: {
      type: err.name,
      details: err.message
    }
  });
};

app.use(errorHandler);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

export default app;