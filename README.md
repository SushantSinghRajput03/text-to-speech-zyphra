# Text-to-Speech API with Voice Cloning

A TypeScript-based Node.js application that provides text-to-speech conversion using the Zyphra client, including voice cloning capabilities.

## Features

- Text-to-speech conversion with customizable parameters
- Voice cloning support
- Multiple language support (6 languages)
- Adjustable speaking rate (5-35)
- Support for different audio formats (WAV, MP3)
- RESTful API endpoints
- User-friendly test interface
- API status monitoring
- Health check endpoint

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Create a `.env` file in the root directory with your Zyphra API key(s):
```
ZYPHRA_API_KEYS=key1,key2,key3
PORT=3000
```
4. Build and run the application:
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## API Endpoints

### Convert Text to Speech
`POST /api/tts/synthesize`

Request body:
```json
{
  "text": "Text to convert to speech",
  "language_iso_code": "en-us",     // Optional
  "speaking_rate": 15,              // Optional (5-35)
  "seconds": 10,                    // Optional (1-30)
  "seed": 1234,                     // Optional (-1 to 2147483647)
  "mime_type": "audio/mp3",         // Optional
  "speaker_audio": "base64string"   // Optional - For voice cloning
}
```

Response:
- Audio file in the requested format (default: MP3)
- HTTP status codes:
  - 200: Success
  - 400: Invalid request
  - 500: Server error

### Get Supported Languages
`GET /api/tts/languages`

Response:
```json
{
  "success": true,
  "languages": [
    { "code": "en-us", "name": "English (US)" },
    { "code": "fr-fr", "name": "French" },
    { "code": "de", "name": "German" },
    { "code": "ja", "name": "Japanese" },
    { "code": "ko", "name": "Korean" },
    { "code": "cmn", "name": "Mandarin Chinese" }
  ]
}
```

### Get API Status
`GET /health`

Response:
```json
{
  "success": true,
  "data": {
    "isAvailable": true,
    "lastUsed": "2024-07-24T12:00:00.000Z",
    "errorCount": 0,
    "dailyUsage": 5,
    "monthlyUsage": 50,
    "lastDailyReset": "2024-07-24T00:00:00.000Z",
    "lastMonthlyReset": "2024-07-01T00:00:00.000Z",
    "keyPreview": "...1234"
  }
}
```

## Voice Cloning

The API supports voice cloning through the `speaker_audio` parameter. To use this feature:

1. Prepare a voice sample:
   - Supported formats: WAV, MP3
   - Maximum file size: 10MB
   - Clear, high-quality audio recommended
   - Sample should contain clear speech in the target language

2. Convert the audio file to base64:
```javascript
// Browser
const file = document.querySelector('input[type="file"]').files[0];
const reader = new FileReader();
reader.onload = () => {
  const base64Audio = reader.result.split(',')[1];
  // Use base64Audio in your API request
};
reader.readAsDataURL(file);
```

3. Include the base64-encoded audio in your API request:
```javascript
const response = await fetch('http://localhost:3000/api/tts/synthesize', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: "Your text here",
    speaker_audio: base64Audio,
    language_iso_code: "en-us",
    speaking_rate: 15
  })
});
```

## Test Interface

A user-friendly test interface is provided at `index.html`. Features include:

- Voice sample upload and preview
- Language selection
- Speaking rate adjustment
- Text input
- Consent checkbox for voice cloning
- Audio playback of results

## Ethical Considerations

When using voice cloning:

1. Always obtain proper consent from the voice owner
2. Use the technology responsibly and ethically
3. Respect privacy and intellectual property rights
4. Be transparent about the use of synthetic voices
5. Follow applicable laws and regulations

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- 400 Bad Request: Invalid parameters or missing required fields
- 500 Internal Server Error: Server-side errors
- 404 Not Found: Route not found

Error response format:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Development

- `npm run dev`: Start development server with hot reload
- `npm run build`: Build production version
- `npm start`: Start production server
- `npm test`: Run tests
- `npm run lint`: Type check TypeScript files

## Technical Specifications

- Maximum text length: 5000 characters
- Maximum voice sample size: 10MB
- Supported audio formats: WAV, MP3
- Speaking rate range: 5-35
- Supported languages: 6 languages (English, French, German, Japanese, Korean, Mandarin)
- TypeScript-based implementation
- Express.js server with CORS support
