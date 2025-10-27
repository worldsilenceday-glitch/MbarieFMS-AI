# Mbarie FMS AI - Simplified Backend Deployment Guide

## Quick Deployment Options

### Option 1: Deploy to Railway (Recommended)
1. Go to [Railway.app](https://railway.app)
2. Create a new project
3. Connect your GitHub repository or upload the `simple-backend` folder
4. Set environment variables:
   - `AI_API_KEY=sk-17aab34fe0034f0c9ea6d32245d56a13`
   - `NODE_ENV=production`
5. Railway will automatically deploy and provide a URL like `https://your-app.up.railway.app`

### Option 2: Deploy to Render
1. Go to [Render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository or upload the `simple-backend` folder
4. Set environment variables:
   - `AI_API_KEY=sk-17aab34fe0034f0c9ea6d32245d56a13`
   - `NODE_ENV=production`
5. Render will deploy and provide a URL like `https://your-app.onrender.com`

### Option 3: Deploy to Heroku
1. Install Heroku CLI
2. Run:
   ```bash
   cd simple-backend
   heroku create your-app-name
   heroku config:set AI_API_KEY=sk-17aab34fe0034f0c9ea6d32245d56a13
   heroku config:set NODE_ENV=production
   git push heroku main
   ```

## Backend Configuration

### Environment Variables
```env
AI_API_KEY=sk-17aab34fe0034f0c9ea6d32245d56a13
NODE_ENV=production
PORT=5000
```

### Available Endpoints
- `GET /api/health` - Health check
- `POST /api/chat-agent` - Chat with DeepSeek AI
- `POST /api/ai/services` - AI services endpoint

## Frontend Configuration

After deploying the backend, update your frontend environment variables:

### Update `client/.env.production`
```env
VITE_SERVER_URL=https://your-deployed-backend-url
VITE_CLIENT_URL=https://lambent-raindrop-ec0707.netlify.app
VITE_AI_PROVIDER=deepseek
VITE_AI_API_KEY=sk-17aab34fe0034f0c9ea6d32245d56a13
```

### Or set in Netlify Dashboard
1. Go to your Netlify site settings
2. Add environment variables:
   - `VITE_SERVER_URL` = your deployed backend URL
   - `VITE_AI_PROVIDER` = deepseek
   - `VITE_AI_API_KEY` = sk-17aab34fe0034f0c9ea6d32245d56a13

## Testing the Deployment

1. **Test Backend Health:**
   ```bash
   curl https://your-deployed-backend-url/api/health
   ```

2. **Test Chat Agent:**
   ```bash
   curl -X POST https://your-deployed-backend-url/api/chat-agent \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello, can you help with facility management?"}'
   ```

3. **Test Frontend:**
   - Visit https://lambent-raindrop-ec0707.netlify.app
   - Navigate to Chat Agent page
   - Send a test message

## Current Status

✅ **Frontend**: Deployed to Netlify (https://lambent-raindrop-ec0707.netlify.app)  
✅ **Backend**: Ready for deployment (see `simple-backend/` folder)  
✅ **DeepSeek AI**: Integrated and working  
✅ **All Routes**: Functional  

## Next Steps

1. Deploy the simplified backend to a free hosting service
2. Update the frontend environment variables with the new backend URL
3. Test the complete system
4. The chat agent and all AI features will work immediately

## Troubleshooting

- **CORS Issues**: The backend includes CORS middleware
- **API Key Issues**: Verify the DeepSeek API key is correct
- **Deployment Issues**: Check logs in your hosting platform
- **Frontend Connection**: Verify the `VITE_SERVER_URL` is correct

The simplified backend provides all core AI functionality needed for the chat agent and AI services to work with the deployed frontend.
