const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// DeepSeek AI Configuration
const DEEPSEEK_API_KEY = process.env.AI_API_KEY || 'sk-17aab34fe0034f0c9ea6d32245d56a13';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Mbarie FMS AI Backend is running' });
});

// Chat agent endpoint
app.post('/api/chat-agent', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Call DeepSeek API
    const response = await axios.post(DEEPSEEK_API_URL, {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are Mbarie FMS AI, a helpful assistant for facility management and business operations. You help with permits, risks, delegations, document processing, and general facility management questions. Be concise and helpful.'
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const reply = response.data.choices[0].message.content;

    res.json({
      success: true,
      reply: reply,
      usage: response.data.usage
    });

  } catch (error) {
    console.error('Chat agent error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to process message',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

// AI services endpoint
app.post('/api/ai/services', async (req, res) => {
  try {
    const { service, data } = req.body;

    if (!service) {
      return res.status(400).json({ error: 'Service type is required' });
    }

    // Call DeepSeek API for various AI services
    const response = await axios.post(DEEPSEEK_API_URL, {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `You are Mbarie FMS AI. Provide ${service} services for facility management. Be helpful and professional.`
        },
        {
          role: 'user',
          content: JSON.stringify(data)
        }
      ],
      max_tokens: 1500,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const result = response.data.choices[0].message.content;

    res.json({
      success: true,
      result: result,
      service: service
    });

  } catch (error) {
    console.error('AI services error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'AI service failed',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simplified Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🤖 DeepSeek AI: ${DEEPSEEK_API_KEY ? 'Configured' : 'Not configured'}`);
});

module.exports = app;
