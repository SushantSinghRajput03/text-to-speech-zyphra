import type { Request, Response } from 'express';
import { TTSService } from '../services/tts.service.js';
import type { TTSRequest } from '../types/tts.types.js';

export class TTSController {
  private ttsService: TTSService;

  constructor() {
    this.ttsService = new TTSService();
  }

  public convertTextToSpeech = async (req: Request, res: Response): Promise<void> => {
    try {
      const ttsRequest: TTSRequest = req.body;

      // Validate request
      const validationResult = this.ttsService.validateRequest(ttsRequest);
      if (!validationResult.isValid) {
        res.status(400).json({
          success: false,
          message: validationResult.error
        });
        return;
      }

      // Generate speech
      const audioBlob = await this.ttsService.synthesizeSpeech(ttsRequest);
      
      // Convert Blob to Buffer for response
      const arrayBuffer = await audioBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Set appropriate headers for binary audio data
      res.setHeader('Content-Type', ttsRequest.mime_type || 'audio/mp3');
      res.setHeader('Content-Disposition', 'attachment; filename="speech.mp3"');
      res.setHeader('Content-Length', buffer.length);
      
      // Send the audio file as binary data
      res.end(buffer);
    } catch (error: any) {
      // Don't try to parse error response as JSON if it's binary data
      const errorMessage = error.message || 'An error occurred during speech synthesis';
      res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  };

  public getVoices = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.json({
        success: true,
        languages: [
          { code: 'en-us', name: 'English (US)' },
          { code: 'fr-fr', name: 'French' },
          { code: 'de', name: 'German' },
          { code: 'ja', name: 'Japanese' },
          { code: 'ko', name: 'Korean' },
          { code: 'cmn', name: 'Mandarin Chinese' }
        ]
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  public getApiStatus = async (req: Request, res: Response) => {
    try {
      const status = this.ttsService.getApiStatus();
      res.json({ success: true, data: status });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get API status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}