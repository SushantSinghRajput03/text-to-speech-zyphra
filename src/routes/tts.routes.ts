import { Router } from 'express';
import { TTSController } from '../controllers/tts.controller.js';

const router = Router();
const ttsController = new TTSController();

// POST /api/tts/synthesize - Convert text to speech
router.post('/synthesize', ttsController.convertTextToSpeech);

// GET /api/tts/languages - Get supported languages
router.get('/languages', ttsController.getVoices);

// Add this endpoint if you want to monitor API key usage
router.get('/api-status', ttsController.getApiStatus);

export default router;