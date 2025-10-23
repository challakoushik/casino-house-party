# Ably Setup Guide

## Quick Setup Instructions

### 1. Get Your Ably API Key

1. Go to [ably.com](https://ably.com) and sign up for a free account
2. Create a new app in your dashboard
3. Go to the "API Keys" section
4. Copy your **Root Key** (it should look like: `xVLyHw.DEadBf:abcdef123456789...`)

### 2. Set Environment Variable

Update your `.env.local` file:

```bash
# Replace the placeholder with your actual Ably API key
NEXT_PUBLIC_ABLY_API_KEY=xVLyHw.DEadBf:your-actual-key-here
```

### 3. Ably API Key Format

Your Ably API key should:
- Contain a colon (`:`) separating the key name and secret
- Be around 40-60 characters long
- Look like: `appId.keyName:keySecret`

Example: `xVLyHw.DEadBf:abcdefghijklmnopqrstuvwxyz123456789`

### 4. Test Your Setup

Start the development server:
```bash
npm run dev
```

Check the browser console - you should see "Connected to Ably!" when you visit any page.

### 5. Troubleshooting

If you see "invalid key parameter":
- ✅ Make sure your API key contains a colon (`:`)
- ✅ Check that you copied the complete key from Ably dashboard
- ✅ Ensure no extra spaces before/after the key in `.env.local`
- ✅ Restart your development server after changing environment variables

### 6. Free Tier Limits

Ably's free tier includes:
- 3 million messages per month
- 100 concurrent connections
- Perfect for development and small deployments

This should be more than enough for your casino party app!