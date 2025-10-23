# Deployment Guide

## Quick Setup for a House Party (Recommended)

This is the easiest way to get your casino party running:

### Prerequisites
- A laptop or computer with Node.js installed
- WiFi network that all guests can connect to

### Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   npm run dev
   # Or for production mode:
   npm run build && npm start
   ```

3. **Find Your Local IP Address**
   
   **On Mac/Linux:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
   
   **On Windows:**
   ```bash
   ipconfig
   # Look for "IPv4 Address" under your WiFi adapter
   ```
   
   Your IP will look something like: `192.168.1.100`

4. **Share the URL**
   - Admin: `http://192.168.1.100:3000/admin`
   - Players: `http://192.168.1.100:3000/player`
   - Table Screens: `http://192.168.1.100:3000/table?id=TABLE_ID`

5. **Setup Process**
   - Open the Admin interface on your device
   - Add all your friends as players
   - Create tables for the games you want to play
   - Tell your friends to open the Player interface on their phones
   - Display the Table Screen on your TV/monitor

### Tips for House Party Setup

1. **Keep your laptop plugged in** - The server needs to run the entire party
2. **Use a stable WiFi network** - Better connection = smoother gameplay
3. **Test everything before guests arrive** - Create test players and tables
4. **Have a backup plan** - Keep the laptop charger handy
5. **Monitor the Admin dashboard** - Keep an eye on house balance and player balances

## Cloud Deployment (Optional)

If you want to deploy this to the cloud (so it's accessible from anywhere):

### Railway.app

1. Create account at [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect Next.js and deploy
5. Your app will be live at `https://your-app.railway.app`

### Render.com

1. Create account at [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. Click "Create Web Service"

### DigitalOcean App Platform

1. Create account at [digitalocean.com](https://digitalocean.com)
2. Go to "App Platform" → "Create App"
3. Connect your GitHub repository
4. Configure:
   - Build Command: `npm run build`
   - Run Command: `npm start`
5. Deploy!

## Adding Persistent Storage (Optional)

The app currently uses in-memory storage. If you want data to persist between restarts:

### Using Upstash Redis (Free Tier Available)

1. Create account at [upstash.com](https://upstash.com)
2. Create a Redis database
3. Get your connection URL
4. Create `.env.local`:
   ```
   UPSTASH_REDIS_REST_URL=your_url_here
   UPSTASH_REDIS_REST_TOKEN=your_token_here
   ```
5. Update `lib/redis.ts` to use Upstash client (already imported, just needs configuration)

## Troubleshooting

### Can't connect from phone
- Make sure your phone and laptop are on the same WiFi network
- Check your laptop's firewall settings
- Try disabling VPN if you're using one

### Server crashes
- Check that you have enough RAM (app is lightweight, should work on most machines)
- Make sure port 3000 is not being used by another app

### Socket.IO not working
- Verify that WebSocket connections aren't blocked by your network
- Check browser console for errors

### Data resets
- This is normal with in-memory storage
- For persistence, follow the Redis setup instructions above

## Security Notes

Since this is for a house party with friends:
- No authentication is built in (trust-based system)
- Admin interface is open to anyone with the URL
- For public deployment, consider adding:
  - Admin password protection
  - Rate limiting
  - HTTPS/SSL certificates
  - Player authentication

## Support

For issues or questions, check the GitHub repository issues page.
