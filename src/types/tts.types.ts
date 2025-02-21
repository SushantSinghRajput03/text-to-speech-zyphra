export interface TTSRequest {
  text: string;
  language_iso_code?: string;
  speaking_rate?: number;
  mime_type?: string;
  speaker_audio?: string;
  seconds?: number;
  seed?: number;
}

export interface TTSResponse {
  success: boolean;
  message?: string;
  audioBlob?: Blob;
}

export interface TTSConfig {
  defaultLanguage: string;
  defaultSpeakingRate: number;
  defaultMimeType: string;
  maxTextLength: number;
  maxAudioSize: number;
  supportedAudioFormats: string[];
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}