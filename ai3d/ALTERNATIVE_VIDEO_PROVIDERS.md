# Alternative Video Generation Providers Setup

Since Veo 3.1 may have availability issues, CardioSim AI now includes **fallback support** for free/cheap video generation services:

## Quick Comparison

| Provider | Cost | Quality | Setup Time | Free Tier |
|----------|------|---------|-----------|-----------|
| **Replicate** | ~$0.003/video | Excellent | 5 min | 50k free tokens |
| **Hugging Face** | FREE | Good | 5 min | Unlimited |
| **Pika Labs** | FREE | Good | 10 min | Daily credits |

---

## Option 1: REPLICATE (RECOMMENDED) ⭐

**Best for**: Production use, very cheap ($0.003 per video)

### Step 1: Create Account
1. Go to https://replicate.com
2. Click Sign Up (use GitHub, Google, or email)
3. Verify your email

### Step 2: Get API Token
1. Go to https://replicate.com/account/api-tokens
2. Copy your API token
3. Save it safely

### Step 3: Set Environment Variable

**Windows PowerShell:**
```powershell
$env:REPLICATE_API_TOKEN = "your-api-token-here"
```

**Windows .env file:**
```
REPLICATE_API_TOKEN=your-api-token-here
```

**Or add to `d:\ai3d\backend\.env`:**
```
REPLICATE_API_TOKEN=your-replicate-api-token
```

### Step 4: Install Package
```bash
cd d:\ai3d\backend
pip install replicate>=3.0.0
```

### Step 5: Restart Backend
```bash
# Backend will auto-reload
```

### How It Works
- Free tier: 50,000 tokens (~17 videos)
- After free tier: Pay as you go (~$0.003/video)
- Models available:
  - `xai/grok-imagine-video` (most realistic)
  - `wan-video/wan-2.2-t2v-fast` (fastest)
  - `google/veo-3.1-fast` (best quality)

---

## Option 2: HUGGING FACE (FREE) ⭐

**Best for**: Unlimited free usage, zero setup

### Step 1: Create Account
1. Go to https://huggingface.co
2. Sign up with Google, GitHub, or email
3. Email will be verified automatically

### Step 2: Get API Token (Optional)
1. Go to https://huggingface.co/settings/tokens
2. Create new token (set to "read" permissions)
3. Copy token (optional - works without)

### Step 3: Set Environment Variable

**Windows PowerShell:**
```powershell
$env:HUGGINGFACE_API_TOKEN = "your-api-token-here"
```

**Or add to `d:\ai3d\backend\.env`:**
```
HUGGINGFACE_API_TOKEN=your-hf-api-token
```

### Step 4: Install Package
```bash
cd d:\ai3d\backend
pip install huggingface-hub>=0.23.0
```

### Step 5: Restart Backend

### How It Works
- **100% FREE** - No credit card needed
- No usage limits
- Available models:
  - CogVideoX (text-to-video)
  - HunyuanVideo (high quality)
  - Wan2.2 (fast)

---

## Option 3: PIKA LABS (FREE DAILY CREDITS)

**Best for**: Trying free features with daily refreshes

### Step 1: Create Account
1. Go to https://pika.art
2. Sign in with Discord, Google, or email

### Step 2: Get API Key
1. Set up account on Pika website
2. API access info in settings

### Step 3: Set Environment Variable

```
PIKA_API_KEY=your-pika-api-key
```

### How It Works
- Free daily credits
- 480p resolution (free tier)
- Models: Pika 2.5, image-to-video

---

## How Fallback Works

When you generate a video:

```
1. Try Veo 3.1 (Google)
   ↓
2. If Veo fails → Try Replicate ($0.003)
   ↓
3. If Replicate fails → Try Hugging Face (FREE)
   ↓
4. If all fail → Show enhanced template description
```

**You'll see status messages:**
- 🎨 Generating frame images with AI...
- 🎬 Generating video with Veo 3.1...
- ✗ Veo unavailable, trying Replicate...
- ✓ Video generation complete!

---

## Testing the Setup

### Test 1: Verify Installation
```bash
cd d:\ai3d\backend
python -c "import replicate; print('✓ Replicate OK')"
python -c "import huggingface_hub; print('✓ Hugging Face OK')"
```

### Test 2: Check Environment Variables
```bash
echo $env:REPLICATE_API_TOKEN      # Should show token
echo $env:HUGGINGFACE_API_TOKEN    # Should show token
```

### Test 3: Generate Video in App
1. Go to http://localhost:5173
2. Open Videos tab
3. Select STEMI
4. Click "Generate Video"
5. Watch progress messages

---

## Cost Comparison (12 Videos)

| Provider | Cost | Per Video |
|----------|------|-----------|
| Veo 3.1 | Unknown | - |
| Replicate | $0.036 | $0.003 ✓ |
| Hugging Face | FREE | FREE ✓ |
| Pika Labs | FREE* | FREE* |

*Pika has daily credit limits

---

## Troubleshooting

### "No token/API key provided"
- Make sure you set the environment variable
- Restart the backend after setting
- Check `.env` file has the variable

### "Generation takes too long"
- This is normal - AI video generation takes 30-120 seconds
- Replicate: ~30-60 seconds
- Hugging Face: ~60-120 seconds
- Be patient, watch the progress messages

### "All providers failed"
- Check your internet connection
- Verify API tokens are correct
- Try restarting the application
- Check logs for detailed error messages

### "Replicate free tier used up"
- Either pay for more tokens ($0.003 each)
- Or switch to Hugging Face (completely FREE)

---

## Recommendations

**For Development**: Use **Hugging Face** (FREE, unlimited)

**For Testing**: Use **Replicate** (pay-per-use, very cheap)

**For Production**: Use **Replicate** + **Hugging Face** fallback

---

## Advanced: Use Multiple Providers

The app automatically tries providers in order:
1. Veo 3.1 (Google)
2. Replicate (cheap)
3. Hugging Face (free)
4. Pika Labs (free daily)

Just set multiple environment variables and it'll use them as fallbacks!

```
GOOGLE_GENAI_API_KEY=your-veo-key
REPLICATE_API_TOKEN=your-replicate-token
HUGGINGFACE_API_TOKEN=your-hf-token
PIKA_API_KEY=your-pika-key
```
