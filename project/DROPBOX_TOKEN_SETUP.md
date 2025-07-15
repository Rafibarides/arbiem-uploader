# Dropbox Token Setup Guide

## Problem
Your current Dropbox token expires every 4 hours, causing 401 Unauthorized errors.

## Solution: Get a Refresh Token

### Step 1: Get Authorization Code
1. Go to your Dropbox App Console: https://www.dropbox.com/developers/apps
2. Find your app and note the **App Key**
3. Replace `YOUR_APP_KEY` in this URL and visit it in your browser:
   ```
   https://www.dropbox.com/oauth2/authorize?client_id=	
j6vu4sp9a2n84c0&response_type=code&token_access_type=offline
   ```
4. Click "Allow" to authorize the app
5. Copy the authorization code from the URL (the `code=` parameter)

### Step 2: Exchange for Refresh Token
Replace the placeholders and run this curl command:
```bash
curl https://api.dropbox.com/oauth2/token \
  -d code=PDrnYymi18AAAAAAAABvv5TOo2TxkKjAKv_z98IGrMA \
  -d grant_type=authorization_code \
  -u j6vu4sp9a2n84c0:1jvv4ojc8nh49jg
```

### Step 3: Save the Refresh Token
The response will include:
- `access_token`: Use immediately (expires in 4 hours)
- `refresh_token`: Save this! It never expires

### Step 4: Update Your App
Replace the hardcoded token with refresh token logic.

## Quick Fix
If you need immediate relief, just generate a new token from the App Console every 4 hours until you implement refresh tokens. 