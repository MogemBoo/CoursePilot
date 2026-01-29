# Troubleshooting Guide

## Issue: "localhost sent an invalid response"

### Solutions Applied:
1. ✅ Updated `vite.config.js` with proxy configuration for backend API
2. ✅ Installed dependencies in `learning-platform` directory

### Next Steps:

1. **Restart the Vite Dev Server:**
   - Stop the current Vite server (Ctrl+C in the terminal)
   - Navigate to `learning-platform` directory
   - Run: `npm run dev`

2. **Start the Backend Server:**
   - Open a new terminal
   - Navigate to project root
   - Run: `npm run server` or `node server.js`
   - Backend should run on `http://localhost:5000`

3. **Check Browser Console:**
   - Open browser DevTools (F12)
   - Check Console tab for any JavaScript errors
   - Check Network tab to see if API calls are failing

4. **Verify Both Servers Are Running:**
   - Frontend (Vite): `http://localhost:5173`
   - Backend (Express): `http://localhost:5000`

### Common Issues:

- **Port Already in Use:** If port 5173 or 5000 is busy, change the port in config
- **CORS Errors:** Backend has CORS enabled, but check if requests are going to correct URL
- **React Errors:** Check browser console for component errors

### Quick Test:

1. Visit `http://localhost:5000` - Should see "ScholarSync API is Running!"
2. Visit `http://localhost:5173` - Should see the React app
3. Check browser console for any errors
