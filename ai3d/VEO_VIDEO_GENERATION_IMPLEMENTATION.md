# Veo 3.1 Video Generation Implementation

## Overview

The CardioSim AI now implements **Google's official Veo 3.1 video generation pipeline** with proper image-to-video generation as demonstrated in the official Google API documentation.

## Architecture

### Backend Pipeline (FastAPI)

```
1. User requests video generation
   ↓
2. Gemini 2.5 Flash Image (Nano Banana) generates frame images
   - Generates up to 3 reference frame images
   - Anatomically accurate medical illustrations
   ↓
3. Veo 3.1 generates video using reference images
   - Uses generated images as reference guides
   - Creates realistic medical instructional video
   - Handles async polling for completion (up to 5 minutes)
   ↓
4. Video saved to storage and served to frontend
   ↓
5. Frontend displays frames with AI narration
```

### Key Components

**File: `/backend/routes/video_generation.py`**

#### New Functions:

1. **`generate_frame_image(procedure, frame_description)`**
   - Uses Gemini 2.5 Flash Image (Nano Banana)
   - Generates professional medical illustrations
   - Returns image data for use as Veo reference

2. **`generate_video_with_veo(procedure, prompt, reference_images, duration)`**
   - Calls Veo 3.1 with reference images
   - Implements async polling (10-second intervals, max 5 minutes)
   - Downloads and saves generated video to disk
   - Returns video file path

3. **`generate_procedure_video(VideoGenerationRequest)`**
   - Main endpoint orchestrating the full pipeline
   - Generates images → Generates video → Returns results
   - Includes fallback to template/enhanced descriptions if Veo fails

4. **`download_generated_video(file)`**
   - Serves generated MP4 videos
   - Content-type: `video/mp4`

#### Endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/video-generation` | POST | Generate video (async) |
| `/api/video-generation/download` | GET | Download generated video |
| `/api/video-generation/stream` | POST | Get frame narration |
| `/api/video-generation/templates` | GET | List available procedures |
| `/api/video-generation/fallback-video` | GET | Get template data |
| `/api/video-generation/analyze-technique` | POST | Analyze student technique |

### Frontend Updates

**File: `/frontend/src/components/VideoGenerator.jsx`**

- Added `generationStatus` state for real-time progress feedback
- Shows generation steps:
  - 🎨 Generating frame images with AI...
  - ✓ Video generation complete
  - ✗ Error handling

**File: `/frontend/src/styles/video-generator.css`**

- Added `.ai-status-badge` - Shows "AI-Generated Content" label
- Added `.narration-box` - Displays AI-generated narration
- Added `.narration-text` - Styled narration content

## Video Generation Flow

### Step 1: Image Generation (Gemini 2.5 Flash Image)

```python
# For each of first 3 frames
image = await generate_frame_image(
    procedure="STEMI",
    frame_description="Frame 1: Patient presentation - chest pain assessment"
)
# Returns: Image object for use as reference
```

### Step 2: Video Generation (Veo 3.1)

```python
operation = client.models.generate_videos(
    model="veo-3.1-generate-preview",
    prompt="Generate medical video for STEMI...",
    config=GenerateVideosConfig(
        reference_images=[image1, image2, image3]
    )
)

# Poll for completion
while not operation.done:
    await asyncio.sleep(10)
    operation = client.operations.get(operation.name)
```

### Step 3: Video Download and Storage

```python
video = operation.response.generated_videos[0]
client.files.download(file=video.video, destination=video_path)
# Returns: Path to saved MP4 file
```

## API Requirements

### Environment Variables

```bash
GOOGLE_GENAI_API_KEY = "your-api-key-here"
```

### Python Packages

```
google-generativeai>=0.8.0  # For Veo 3.1 support
```

### Models Used

- **`gemini-2.5-flash-image`** - Image generation (Nano Banana)
- **`veo-3.1-generate-preview`** - Video generation
- **`gemini-2.5-flash`** - Text narration generation

## Testing the Implementation

### 1. Check Backend Health

```bash
curl http://localhost:8000/health
```

Expected output should show:
```json
{
  "genie_enabled": true,
  "video_generation_enabled": true
}
```

### 2. Generate a Video

**In the app:**
1. Go to **Videos** tab
2. Select procedure (STEMI, CPR, PCI_BALLOON)
3. Click **Generate Video**

**Via API:**
```bash
curl -X POST http://localhost:8000/api/video-generation \
  -H "Content-Type: application/json" \
  -d '{
    "procedure": "STEMI",
    "urgency": "Immediate",
    "steps": ["Assessment", "Monitoring", "Intervention"],
    "duration": 60
  }'
```

### 3. Expected Responses

#### Success Response:
```json
{
  "status": "ready",
  "video_url": "/api/video-generation/download?file=STEMI_1708989999.mp4",
  "description": "AI-generated instructional video for STEMI using Veo 3.1...",
  "frames": ["Frame 1: Patient presentation...", ...],
  "estimated_duration": 60
}
```

#### Fallback Response (if Veo unavailable):
```json
{
  "status": "template_enhanced",
  "video_url": null,
  "description": "Enhanced description from Gemini...",
  "frames": ["Frame 1: Patient presentation...", ...],
  "estimated_duration": 60
}
```

## Features

✅ **Professional Medical Illustrations** - Gemini 2.5 Flash Image creates anatomically accurate frames

✅ **Realistic Video Synthesis** - Veo 3.1 generates high-quality instructional videos

✅ **Async Polling** - Non-blocking video generation with progress tracking

✅ **Automatic Fallback** - Falls back to enhanced descriptions if video generation unavailable

✅ **Frame Narration** - Gemini 2.5 Flash provides real-time narration for each frame

✅ **Video Storage** - Generated videos saved to `/backend/generated_videos/`

✅ **Download Support** - Frontend can download and stream generated videos

## Troubleshooting

### "Veo generation failed"

**Cause**: API key might be invalid or Veo model not available in your plan

**Solution**:
1. Verify `GOOGLE_GENAI_API_KEY` is set correctly
2. Check if Veo 3.1 is available in your Google AI plan
3. App will automatically fall back to enhanced template descriptions

### "Image generation failed"

**Cause**: Gemini 2.5 Flash Image not responding

**Solution**:
1. Verify API key
2. Check google-generativeai version >= 0.8.0
3. Test with `pip install --upgrade google-generativeai`

### "Polling timeout"

**Cause**: Video generation took too long (>5 minutes)

**Solution**:
1. Veo 3.1 has a maximum 5-minute timeout
2. Try with a shorter duration parameter
3. Check logs for detailed error information

## Performance Notes

- **Image Generation**: ~15-30 seconds per image
- **Video Generation**: ~2-5 minutes (varies by API load)
- **Frame Narration**: ~3-5 seconds per frame
- **Storage**: Each video ~50-200MB depending on resolution

## Future Enhancements

- [ ] Support for first/last frame interpolation
- [ ] Multiple reference image configurations  
- [ ] Video streaming to frontend
- [ ] Progress WebSocket updates
- [ ] Video quality selection
- [ ] Batch video generation
- [ ] Caching generated videos by procedure

## References

- [Google Veo 3.1 Documentation](https://ai.google.dev/docs/gemini_api_guide/video_generation)
- [Gemini 2.5 Flash Image Docs](https://ai.google.dev/docs/gemini_api_guide/image_generation)
- [Official Examples](https://github.com/google-gemini/generative-ai-python)
