import type { TTSRequest, TTSConfig, ValidationResult } from '../types/tts.types.js';
import { ZyphraClient } from '@zyphra/client';
import { config } from 'dotenv';
import { ApiKeyManager } from './api-key-manager.js';

config();

export class TTSService {
  private client: ZyphraClient;
  private config: TTSConfig;
  private apiKeyManager: ApiKeyManager;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor() {
    const apiKeys = process.env.ZYPHRA_API_KEYS?.split(',') || [];
    if (!apiKeys.length) {
      throw new Error('ZYPHRA_API_KEYS is required in environment variables');
    }

    this.apiKeyManager = new ApiKeyManager(apiKeys);
    this.initializeClient();
    
    this.config = {
      defaultLanguage: 'en-us',
      defaultSpeakingRate: 15,
      defaultMimeType: 'audio/mp3',
      maxTextLength: 5000,
      maxAudioSize: 10 * 1024 * 1024,
      supportedAudioFormats: ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/aac']
    };
  }

  private initializeClient(): void {
    const apiKey = this.apiKeyManager.getCurrentKey();
    this.client = new ZyphraClient({ apiKey });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public validateRequest(request: TTSRequest): ValidationResult {
    if (!request.text) {
      return { isValid: false, error: 'Text is required' };
    }

    if (request.text.length > this.config.maxTextLength) {
      return {
        isValid: false,
        error: `Text length exceeds maximum of ${this.config.maxTextLength} characters`
      };
    }

    if (request.speaking_rate && (request.speaking_rate < 5 || request.speaking_rate > 35)) {
      return {
        isValid: false,
        error: 'Speaking rate must be between 5 and 35'
      };
    }

    if (request.speaker_audio) {
      try {
        // Validate base64 string format
        if (!request.speaker_audio.match(/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/)) {
          return {
            isValid: false,
            error: 'Invalid base64 format for voice sample'
          };
        }

        const audioSize = (request.speaker_audio.length * 3) / 4;
        if (audioSize > this.config.maxAudioSize) {
          return {
            isValid: false,
            error: `Voice sample exceeds maximum size of ${this.config.maxAudioSize / (1024 * 1024)}MB`
          };
        }
      } catch (error) {
        console.error('Voice sample validation error:', error);
        return {
          isValid: false,
          error: 'Invalid voice sample format. Must be base64 encoded audio.'
        };
      }
    }

    if (request.mime_type && !this.config.supportedAudioFormats.includes(request.mime_type)) {
      return {
        isValid: false,
        error: `Unsupported audio format. Supported formats are: ${this.config.supportedAudioFormats.join(', ')}`
      };
    }

    if (request.seconds && (request.seconds < 1 || request.seconds > 30)) {
      return {
        isValid: false,
        error: 'Duration must be between 1 and 30 seconds'
      };
    }

    if (request.seed && (request.seed < -1 || request.seed > 2147483647)) {
      return {
        isValid: false,
        error: 'Seed must be between -1 and 2147483647'
      };
    }

    return { isValid: true };
  }

  public async synthesizeSpeech(request: TTSRequest, retryCount = 0): Promise<Buffer> {
    try {
      const result = await this.client.audio.speech.create({
        text: request.text
      });

      // Increment usage after successful API call
      this.apiKeyManager.incrementUsage(this.client.apiKey);

      return result;
    } catch (error: any) {
      console.error('TTS Error:', error);
      
      if (this.isApiLimitError(error)) {
        const currentKey = this.client.apiKey;
        this.apiKeyManager.markKeyError(currentKey);
        this.initializeClient();
        return this.synthesizeSpeech(request);
      }

      if (error.statusCode === 524 && retryCount < this.maxRetries) {
        console.log(`Retry attempt ${retryCount + 1} of ${this.maxRetries}`);
        await this.delay(this.retryDelay * (retryCount + 1));
        return this.synthesizeSpeech(request, retryCount + 1);
      }

      throw new Error(
        `Failed to synthesize speech: ${error.message || 'Unknown error'} ` +
        `(Status: ${error.statusCode || 'Unknown'})`
      );
    }
  }

  private isApiLimitError(error: any): boolean {
    return (
      error.statusCode === 429 || 
      error.code === 'RATE_LIMIT_EXCEEDED' ||
      error.message?.includes('rate limit') ||
      error.message?.includes('quota exceeded')
    );
  }

  public getApiStatus() {
    return this.apiKeyManager.getKeysStatus();
  }
}