# API Setup Guide - Imagen 3, Veo 3 & Social Media

This guide will help you enable image generation, video generation, and social media posting features.

---

## 🎨 Part 1: Google Cloud Imagen 3 (Image Generation)

### What You Need:
- Google Cloud Platform account
- Vertex AI API enabled
- Service account with Vertex AI permissions

### Setup Steps:

1. **Enable Vertex AI API**
   ```bash
   # Go to: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com
   # Click "Enable"
   ```

2. **Create Service Account**
   ```bash
   # In Cloud Console:
   # IAM & Admin → Service Accounts → Create Service Account
   # Grant role: "Vertex AI User"
   # Create and download JSON key file
   ```

3. **Add to Backend Environment**
   ```bash
   # In backend/.env add:
   GOOGLE_CLOUD_PROJECT=your-project-id
   GOOGLE_APPLICATION_CREDENTIALS=./path-to-service-account-key.json
   ```

4. **Install Dependencies**
   ```bash
   cd backend
   npm install @google-cloud/aiplatform
   ```

### Backend Code (Add to server.js):

```javascript
const { PredictionServiceClient } = require('@google-cloud/aiplatform').v1;

// Image generation endpoint
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    const location = 'us-central1';
    const publisher = 'google';
    const model = 'imagegeneration@006'; // Imagen 3

    const client = new PredictionServiceClient({
      apiEndpoint: `${location}-aiplatform.googleapis.com`,
    });

    const endpoint = `projects/${projectId}/locations/${location}/publishers/${publisher}/models/${model}`;

    const parameters = {
      sampleCount: 1,
      aspectRatio: '1:1', // Square for album art
      negativePrompt: 'blurry, low quality',
      addWatermark: false,
    };

    const instance = {
      prompt: prompt,
    };

    const request = {
      endpoint,
      instances: [{ structValue: { fields: { prompt: { stringValue: prompt } } } }],
      parameters: { structValue: { fields: parameters } },
    };

    const [response] = await client.predict(request);
    const prediction = response.predictions[0];
    const imageBytes = prediction.structValue.fields.bytesBase64Encoded.stringValue;

    res.json({ 
      success: true,
      imageBase64: imageBytes,
      format: 'png'
    });

  } catch (error) {
    console.error('Imagen generation failed:', error);
    res.status(500).json({ 
      error: 'Image generation failed', 
      details: error.message 
    });
  }
});
```

### Cost:
- **$0.02 per image** (1024x1024)
- Free tier: First $300 credit for new users

---

## 🎥 Part 2: Google Veo 3 (Video Generation)

### Setup Steps:

1. **Enable Vertex AI Video API**
   ```bash
   # Go to: https://console.cloud.google.com/vertex-ai/generative/video
   # Request access to Veo (may require waitlist approval)
   ```

2. **Same service account as Imagen 3**

### Backend Code (Add to server.js):

```javascript
// Video generation endpoint
app.post('/api/generate-video', async (req, res) => {
  try {
    const { prompt, duration = 5 } = req.body; // 5 second default
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    const location = 'us-central1';
    
    const client = new PredictionServiceClient({
      apiEndpoint: `${location}-aiplatform.googleapis.com`,
    });

    const endpoint = `projects/${projectId}/locations/${location}/publishers/google/models/veo-001`;

    const parameters = {
      durationSeconds: duration,
      aspectRatio: '9:16', // Vertical for TikTok/Reels
      fps: 24,
    };

    const request = {
      endpoint,
      instances: [{ 
        structValue: { 
          fields: { 
            prompt: { stringValue: prompt },
            negativePrompt: { stringValue: 'static, still image, low quality' }
          } 
        } 
      }],
      parameters: { structValue: { fields: parameters } },
    };

    const [response] = await client.predict(request);
    
    // Veo returns a GCS URI (not direct bytes like Imagen)
    const videoUri = response.predictions[0].structValue.fields.videoGcsUri.stringValue;
    
    // You'll need to fetch the video from GCS or return the signed URL
    const { Storage } = require('@google-cloud/storage');
    const storage = new Storage();
    const [url] = await storage.bucket(videoUri.split('/')[2]).file(videoUri.split('/').slice(3).join('/')).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    res.json({ 
      success: true,
      videoUrl: url,
      duration: duration
    });

  } catch (error) {
    console.error('Veo generation failed:', error);
    res.status(500).json({ 
      error: 'Video generation failed', 
      details: error.message 
    });
  }
});
```

### Cost:
- **$0.10 per second** of generated video
- 5-second clip = $0.50
- **IMPORTANT:** Veo may still be in limited preview

---

## 📱 Part 3: Social Media Integration

### TikTok API

**Requirements:**
- TikTok for Developers account
- App registered at https://developers.tiktok.com
- OAuth 2.0 flow for user authorization

**Setup:**
```bash
# In backend/.env add:
TIKTOK_CLIENT_KEY=your-tiktok-client-key
TIKTOK_CLIENT_SECRET=your-tiktok-client-secret
TIKTOK_REDIRECT_URI=https://your-domain.com/auth/tiktok/callback
```

**Backend Code:**
```javascript
const axios = require('axios');

// TikTok OAuth initiation
app.get('/auth/tiktok', (req, res) => {
  const csrfState = Math.random().toString(36).substring(2);
  const authUrl = `https://www.tiktok.com/v2/auth/authorize/` +
    `?client_key=${process.env.TIKTOK_CLIENT_KEY}` +
    `&scope=user.info.basic,video.upload` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(process.env.TIKTOK_REDIRECT_URI)}` +
    `&state=${csrfState}`;
  
  res.redirect(authUrl);
});

// TikTok OAuth callback
app.get('/auth/tiktok/callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    // Exchange code for access token
    const tokenResponse = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', {
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.TIKTOK_REDIRECT_URI,
    });

    const { access_token } = tokenResponse.data;
    
    // Store access_token in your database associated with the user
    // For now, redirect to frontend with token
    res.redirect(`/?tiktok_token=${access_token}`);
  } catch (error) {
    console.error('TikTok auth failed:', error);
    res.redirect('/?error=tiktok_auth_failed');
  }
});

// TikTok video upload
app.post('/api/social/tiktok/upload', async (req, res) => {
  try {
    const { videoUrl, title, accessToken } = req.body;
    
    // Step 1: Initialize upload
    const initResponse = await axios.post(
      'https://open.tiktokapis.com/v2/post/publish/video/init/',
      {
        post_info: {
          title: title,
          privacy_level: 'PUBLIC_TO_EVERYONE',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: videoUrl,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { publish_id } = initResponse.data.data;

    res.json({ 
      success: true, 
      publishId: publish_id,
      message: 'Video upload initiated. Check status on TikTok.' 
    });

  } catch (error) {
    console.error('TikTok upload failed:', error);
    res.status(500).json({ 
      error: 'TikTok upload failed', 
      details: error.response?.data || error.message 
    });
  }
});
```

**Important Notes:**
- TikTok requires **business account verification** for video upload API
- Videos must be publicly accessible URLs
- Max video size: 500MB
- Supported formats: MP4, MOV, WEBM

### Instagram API (via Meta)

**Requirements:**
- Facebook App at https://developers.facebook.com
- Instagram Business Account linked to Facebook Page
- `instagram_basic`, `instagram_content_publish` permissions

**Setup:**
```bash
# In backend/.env add:
INSTAGRAM_CLIENT_ID=your-instagram-app-id
INSTAGRAM_CLIENT_SECRET=your-instagram-app-secret
INSTAGRAM_REDIRECT_URI=https://your-domain.com/auth/instagram/callback
```

**Backend Code:**
```javascript
// Instagram OAuth
app.get('/auth/instagram', (req, res) => {
  const authUrl = `https://api.instagram.com/oauth/authorize` +
    `?client_id=${process.env.INSTAGRAM_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.INSTAGRAM_REDIRECT_URI)}` +
    `&scope=user_profile,user_media` +
    `&response_type=code`;
  
  res.redirect(authUrl);
});

// Instagram callback
app.get('/auth/instagram/callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    const formData = new URLSearchParams();
    formData.append('client_id', process.env.INSTAGRAM_CLIENT_ID);
    formData.append('client_secret', process.env.INSTAGRAM_CLIENT_SECRET);
    formData.append('grant_type', 'authorization_code');
    formData.append('redirect_uri', process.env.INSTAGRAM_REDIRECT_URI);
    formData.append('code', code);

    const tokenResponse = await axios.post('https://api.instagram.com/oauth/access_token', formData);
    const { access_token } = tokenResponse.data;
    
    res.redirect(`/?instagram_token=${access_token}`);
  } catch (error) {
    console.error('Instagram auth failed:', error);
    res.redirect('/?error=instagram_auth_failed');
  }
});

// Instagram Reels upload
app.post('/api/social/instagram/upload', async (req, res) => {
  try {
    const { videoUrl, caption, accessToken, igUserId } = req.body;
    
    // Step 1: Create media container
    const containerResponse = await axios.post(
      `https://graph.instagram.com/v18.0/${igUserId}/media`,
      {
        media_type: 'REELS',
        video_url: videoUrl,
        caption: caption,
        share_to_feed: true,
      },
      {
        params: { access_token: accessToken },
      }
    );

    const { id: containerId } = containerResponse.data;

    // Step 2: Publish media
    const publishResponse = await axios.post(
      `https://graph.instagram.com/v18.0/${igUserId}/media_publish`,
      { creation_id: containerId },
      {
        params: { access_token: accessToken },
      }
    );

    res.json({ 
      success: true, 
      mediaId: publishResponse.data.id,
      message: 'Reel published to Instagram!' 
    });

  } catch (error) {
    console.error('Instagram upload failed:', error);
    res.status(500).json({ 
      error: 'Instagram upload failed', 
      details: error.response?.data || error.message 
    });
  }
});
```

### Facebook Reels

Similar to Instagram (same Meta Graph API), replace `igUserId` with Facebook page ID and use Facebook endpoints.

---

## 🔐 Part 4: Optional Firebase Auth

### Enable Sign-In Methods:
1. Go to Firebase Console → Authentication
2. Enable Email/Password and Google sign-in
3. Add authorized domains (your Vercel domain)

### Frontend Auth UI (Add to App.jsx):

```javascript
// Add at top of App component
const [user, setUser] = useState(null);
const [showAuth, setShowAuth] = useState(false);

useEffect(() => {
  if (auth) {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }
}, []);

const handleSignIn = async (email, password) => {
  try {
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    alert('Sign in failed: ' + error.message);
  }
};

const handleSignOut = async () => {
  try {
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
  } catch (error) {
    alert('Sign out failed: ' + error.message);
  }
};

// Add auth UI in navigation
{!user && (
  <button onClick={() => setShowAuth(true)} className="...">
    Sign In (Optional)
  </button>
)}
{user && (
  <div className="flex items-center gap-2">
    <span className="text-xs">{user.email}</span>
    <button onClick={handleSignOut} className="...">Sign Out</button>
  </div>
)}
```

### Save Generated Content to Firestore:

```javascript
const saveGeneration = async (type, content, metadata) => {
  if (!user) {
    alert('Sign in to save your generations!');
    return;
  }

  try {
    await addDoc(collection(db, 'user_generations'), {
      userId: user.uid,
      type: type, // 'image', 'video', 'lyrics', etc.
      content: content,
      metadata: metadata,
      createdAt: serverTimestamp(),
    });
    alert('Saved to your library!');
  } catch (error) {
    console.error('Save failed:', error);
  }
};

// Usage in AlbumArtGenerator:
<button onClick={() => saveGeneration('image', imageUrl, { prompt })}>
  SAVE TO LIBRARY
</button>
```

---

## 📊 Cost Estimate (Monthly)

| Service | Usage | Cost |
|---------|-------|------|
| Imagen 3 | 100 images | $2.00 |
| Veo 3 | 20 videos (5s each) | $10.00 |
| TikTok API | Free | $0.00 |
| Instagram API | Free | $0.00 |
| Firebase Auth | <50k users | Free |
| Firestore | <1GB | Free |
| **Total** | | **~$12/mo** |

---

## 🚀 Deployment Checklist

### Backend (Railway):
- [ ] Add environment variables in Railway dashboard
- [ ] Upload service account JSON as Railway volume
- [ ] Install new dependencies (`@google-cloud/aiplatform`, etc.)
- [ ] Redeploy backend

### Frontend (Vercel):
- [ ] Update `callGemini` to route image/video requests to new endpoints
- [ ] Add social media OAuth flow UI
- [ ] Add Firebase Auth UI (optional)
- [ ] Redeploy frontend

---

## 🛠 Next Steps

1. **Test Locally First:**
   ```bash
   # Backend
   cd backend
   npm install @google-cloud/aiplatform @google-cloud/storage axios
   npm start
   
   # Frontend
   cd frontend
   npm run dev
   ```

2. **Enable APIs one by one** (don't enable everything at once)

3. **Start with Imagen 3** (easiest and cheapest)

4. **Social media requires app approval** (can take 1-2 weeks)

5. **Veo 3 may require waitlist** (Google is gradually rolling out access)

---

## ❓ Questions?

- **Imagen not working?** Check service account permissions
- **Social media 403 errors?** Check OAuth scopes
- **Videos not uploading?** Ensure publicly accessible URL
- **Firebase auth issues?** Check authorized domains

Let me know which part you want to tackle first!
