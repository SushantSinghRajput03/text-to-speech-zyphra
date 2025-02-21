import app from './app.js';
import { config } from 'dotenv';

config();

const port = process.env.PORT || 3000;

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', {
    name: error.name,
    message: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

try {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log('Available endpoints:');
    console.log('- POST /api/tts/synthesize - Convert text to speech');
    console.log('- GET /api/tts/languages - Get supported languages');
    console.log('- GET /health - Check server health');
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}