# How to Upload Music to Firebase Storage

## What I Just Added:
✅ Firebase Storage integration  
✅ Working HTML5 audio player  
✅ Structure ready for 5 albums  
✅ Current albums configured:
- **Livewire Sessions** (5 tracks)
- **Red Hook Diaries** (5 tracks)

## How to Upload Your Songs:

### Step 1: Prepare Your Audio Files
- **Format:** MP3 (recommended) or WAV
- **Naming:** Use the exact filenames from the config:
  
  **Livewire Sessions:**
  - `01-freestyle-kanye.mp3`
  - `02-ali-vegas-50cent.mp3`
  - `03-sprung-remix.mp3`
  - `04-push-it-remix.mp3`
  - `05-freestyle-jim-jones.mp3`
  
  **Red Hook Diaries:**
  - `01-projects-window.mp3`
  - `02-subway-surfing.mp3`
  - `03-loose-cigarettes.mp3`
  - `04-summer-heat.mp3`
  - `05-lights-out.mp3`

### Step 2: Upload to Firebase Storage

1. **Go to Firebase Console:** https://console.firebase.google.com
2. **Select:** "Restored OS Whip Montez" project
3. **Click:** "Storage" in the left sidebar
4. **Click:** "Get Started" (if first time)
5. **Accept default security rules** (we'll update later)

### Step 3: Create Folder Structure

Click "Create folder" and create this structure:
```
albums/
  ├── livewire-sessions/
  │   ├── 01-freestyle-kanye.mp3
  │   ├── 02-ali-vegas-50cent.mp3
  │   ├── 03-sprung-remix.mp3
  │   ├── 04-push-it-remix.mp3
  │   └── 05-freestyle-jim-jones.mp3
  │
  └── red-hook-diaries/
      ├── 01-projects-window.mp3
      ├── 02-subway-surfing.mp3
      ├── 03-loose-cigarettes.mp3
      ├── 04-summer-heat.mp3
      └── 05-lights-out.mp3
```

### Step 4: Upload Files

1. **Navigate into** `albums/livewire-sessions/`
2. **Click "Upload files"**
3. **Select your 5 Livewire Sessions tracks**
4. **Wait for upload to complete**
5. **Repeat for** `albums/red-hook-diaries/`

### Step 5: Update Storage Rules (Important!)

In Firebase Console → Storage → Rules tab, replace with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow public read access to albums
    match /albums/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

Click **"Publish"**

## Adding More Albums Later

To add your 3 additional albums:

1. **Create new folder** in Storage: `albums/your-album-name/`
2. **Upload tracks** with consistent naming: `01-song-name.mp3`, `02-song-name.mp3`, etc.
3. **Edit** `frontend/src/App.jsx` - find the `albums` array around line 610
4. **Add new album object:**

```javascript
{
  id: 'tape3',
  title: "YOUR ALBUM NAME",
  date: "MMM DD YYYY",
  description: "Album description here",
  color: "text-purple-500",
  tapeColor: "border-purple-500",
  tracks: [
    { id: 301, title: "Song Title", duration: "3:15", date: "YYYY-MM-DD", video: false, audioUrl: "albums/your-album-name/01-song-name.mp3" },
    // ... add 4 more tracks
  ]
}
```

5. **Commit and push changes**

## Testing

Once files are uploaded:
1. Wait for Vercel to deploy (1-2 min)
2. Go to www.whipmontez.com
3. Click "Livewire Sessions" section
4. Click any track - should play audio!
5. Open Console (F12) to check for errors

## Troubleshooting

**"Audio not found in Firebase Storage" error:**
- Check file paths match exactly
- Verify files uploaded to correct folders
- Check Storage Rules published

**No sound playing:**
- Check browser Console for errors
- Verify files are MP3 format
- Test download URL directly in browser

**CORS errors:**
- Firebase Storage automatically handles CORS
- If issues persist, check Storage Rules

## Current Status
- ✅ Code deployed to www.whipmontez.com
- ⏳ Waiting for you to upload audio files to Firebase Storage
- ⏳ 3 more albums to be added later
