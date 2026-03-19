# CRITICAL SECURITY NOTICE

## API Key Exposure Issue (FIXED)

### The Problem
The original implementation stored the Anthropic Claude API key in client-side JavaScript, which meant:
- Anyone could view the API key in browser DevTools
- Unauthorized users could extract and abuse the key
- Potential for thousands of dollars in fraudulent API charges
- No rate limiting or authentication

### The Solution
We've implemented a secure server-side proxy architecture:

```
Browser → Backend API (Node.js) → Claude API
         (session auth)         (API key secure)
```

### Implementation Requirements

**IMPORTANT:** To use the chat functionality, you must set up a backend server.

#### Option 1: Quick Setup (Development)

1. Install dependencies:
```bash
npm install express cors express-session express-rate-limit dotenv
```

2. Create `.env` file (NEVER commit this):
```env
ANTHROPIC_API_KEY=your_api_key_here
SESSION_SECRET=generate_random_secret_here
PORT=3001
```

3. Run the server:
```bash
node server.js
```

#### Option 2: Production Deployment

Deploy the backend to:
- **Heroku:** Free tier available
- **Railway:** Simple deployment
- **Vercel:** Serverless functions
- **AWS Lambda:** Serverless with API Gateway

See `server.js` for implementation details.

### Security Features Implemented

1. **API Key Protection:** Key stored server-side only
2. **Rate Limiting:** Max 10 requests per minute per user
3. **Session Authentication:** Users must be authenticated
4. **CORS Protection:** Only whitelisted domains allowed
5. **Input Validation:** All requests validated before forwarding

### Chat Functionality Status

- **With Backend:** Full chat functionality
- **Without Backend:** Graceful fallback with educational disclaimer

### For Developers

If you're setting up a new environment:

1. Copy `.env.example` to `.env`
2. Add your Anthropic API key
3. Generate a secure session secret: `openssl rand -base64 32`
4. Start both frontend and backend servers

### Testing Without Backend

The app will still work without the backend, but chat will show:
> "I have found relevant information in our curriculum about this, but the AI connection is currently being configured. Please consult your physician at the clinic for specific details."

This is intentional fallback behavior to maintain app functionality.
