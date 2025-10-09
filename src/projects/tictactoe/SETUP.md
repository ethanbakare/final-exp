# 🔧 Tic-Tac-Toe Arena Setup Guide

## Environment Variables Setup

Since `.env` files are protected, you'll need to manually create your environment configuration:

### 1. Create `.env.local` file
```bash
# In the tictactoe directory, create .env.local with:

# OpenRouter API Configuration (REQUIRED)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Game Configuration (optional overrides)
NEXT_PUBLIC_TURN_DELAY=500
NEXT_PUBLIC_MAX_TURNS=50
NEXT_PUBLIC_MOVE_DECAY_LIMIT=7

# Development flags
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_ENABLE_LOGGING=true
```

### 2. Get OpenRouter API Key
1. Visit [OpenRouter.ai](https://openrouter.ai/keys)
2. Sign up/Login to your account
3. Generate a new API key
4. Copy the key (starts with `sk-or-v1-...`)
5. Replace `your_openrouter_api_key_here` in your `.env.local`

### 3. Verify Setup
The API key should look like:
```
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 🚨 Important Security Notes

- **Never commit `.env.local`** to version control
- Keep your API key secret and secure  
- The `.env.local` file is already gitignored
- Use separate keys for development/production

## 🎯 Next Steps

Once environment is configured:
1. Install dependencies: `npm install`
2. Proceed to Phase 2 implementation
3. Start development server when UI is ready

## 🔍 Troubleshooting

**API Key Issues:**
- Ensure key starts with `sk-or-v1-`
- Check OpenRouter account has sufficient credits
- Verify key permissions include Claude 3.5 and GPT-4 models

**Environment Loading:**
- Restart dev server after changing `.env.local`
- Check `process.env.OPENROUTER_API_KEY` is accessible in API routes
- Use `NEXT_PUBLIC_` prefix for client-side variables 