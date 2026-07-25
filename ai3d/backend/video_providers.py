"""
Alternative Video Generation Providers
Fallback options when Veo 3.1 is unavailable

Supported providers:
1. Replicate - Pay-per-use (cheap, ~$0.003 per video)
2. Hugging Face Spaces - Completely FREE, open-source
3. Runway ML - Free tier with credits
"""

import os
import logging
import asyncio
import requests
from typing import Optional
import pathlib

logger = logging.getLogger(__name__)
VIDEO_STORAGE = pathlib.Path(__file__).parent / "generated_videos"
VIDEO_STORAGE.mkdir(exist_ok=True)


# ═════════════════════════════════════════════════════════
# REPLICATE.COM - PAY-PER-USE VIDEO GENERATION
# ═════════════════════════════════════════════════════════

async def generate_video_replicate(prompt: str, duration: int = 5) -> Optional[str]:
    """
    Generate video using Replicate.com
    
    Free tier: 50,000 free tokens
    Paid: ~$0.003 per video (very cheap!)
    
    Best models:
    - xai/grok-imagine-video (most realistic)
    - wan-video/wan-2.2-t2v-fast (fastest)
    - google/veo-3.1-fast (best quality)
    """
    try:
        import replicate
        
        api_token = os.getenv("REPLICATE_API_TOKEN")
        if not api_token:
            logger.info("[Replicate] No API token, skipping")
            return None
        
        os.environ['REPLICATE_API_TOKEN'] = api_token
        
        logger.info("[Replicate] Generating video with Grok Imagine Video...")
        
        # Use Grok Imagine Video - most reliable
        output = replicate.run(
            "xai/grok-imagine-video",
            input={
                "prompt": prompt,
                "duration": min(duration, 10),  # Max 10 seconds
                "aspect_ratio": "16:9",
                "text_on_video": False
            }
        )
        
        if isinstance(output, list) and len(output) > 0:
            video_url = output[0]
            logger.info(f"[Replicate] ✓ Generated video: {video_url}")
            
            # Download video to storage
            video_path = await download_video(video_url)
            return video_path
        
        return None
        
    except ImportError:
        logger.warning("[Replicate] Package not installed: pip install replicate")
        return None
    except Exception as e:
        logger.warning(f"[Replicate] Generation failed: {e}")
        return None


# ═════════════════════════════════════════════════════════
# HUGGING FACE SPACES - FREE OPEN-SOURCE VIDEO GENERATION
# ═════════════════════════════════════════════════════════

async def generate_video_huggingface(prompt: str, duration: int = 5) -> Optional[str]:
    """
    Generate video using Hugging Face Spaces
    
    COMPLETELY FREE - No credit card needed!
    Uses open-source models:
    - CogVideoX-5b
    - HunyuanVideo
    - Wan2.2
    """
    try:
        from huggingface_hub import InferenceClient
        
        hf_token = os.getenv("HUGGINGFACE_API_TOKEN")
        if not hf_token:
            logger.info("[HuggingFace] No API token, trying free inference API...")
            hf_token = "hf_placeholder"  # Can work without token on free tier
        
        logger.info("[HuggingFace] Generating video with CogVideoX...")
        
        client = InferenceClient(token=hf_token)
        
        # Try CogVideoX (completely free, no credits needed)
        try:
            # Using the free inference API
            result = client.text_to_video(
                prompt=prompt,
                negative_prompt="low quality, blurry, distorted",
                height=576,
                width=1024,
                num_inference_steps=30,
                guidance_scale=7.5
            )
            
            if result:
                # Save to local storage
                output_path = VIDEO_STORAGE / f"hf_video_{int(__import__('time').time())}.mp4"
                with open(output_path, "wb") as f:
                    f.write(result)
                
                logger.info(f"[HuggingFace] ✓ Generated video: {output_path}")
                return str(output_path)
        except Exception as e:
            logger.warning(f"[HuggingFace] text_to_video failed: {e}")
            logger.info("[HuggingFace] Trying Space-based approach...")
            
            # Fallback: Try running a Space
            result = client.text_to_image(
                prompt=f"Medical illustration: {prompt}",
                model="stabilityai/stable-diffusion-xl-base-1.0"
            )
            logger.info("[HuggingFace] Generated frame image as fallback")
        
        return None
        
    except ImportError:
        logger.warning("[HuggingFace] Package not installed: pip install huggingface-hub")
        return None
    except Exception as e:
        logger.warning(f"[HuggingFace] Generation failed: {e}")
        return None


# ═════════════════════════════════════════════════════════
# PIKA LABS - FREE TIER WITH DAILY CREDITS
# ═════════════════════════════════════════════════════════

async def generate_video_pika(prompt: str, image_data: Optional[bytes] = None) -> Optional[str]:
    """
    Generate video using Pika Labs
    
    Free tier: Daily credits
    Models: Pika 2.5, image-to-video support
    """
    try:
        api_key = os.getenv("PIKA_API_KEY")
        if not api_key:
            logger.info("[Pika] No API key configured")
            return None
        
        logger.info("[Pika] Generating video...")
        
        url = "https://api.pika.art/v1/generations"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "prompt": prompt,
            "model": "pika-2.5",
            "duration": 4
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            video_id = data.get("id")
            logger.info(f"[Pika] ✓ Video generation started: {video_id}")
            return video_id
        
        return None
        
    except Exception as e:
        logger.warning(f"[Pika] Generation failed: {e}")
        return None


# ═════════════════════════════════════════════════════════
# UTILITY FUNCTIONS
# ═════════════════════════════════════════════════════════

async def download_video(url: str) -> Optional[str]:
    """Download video from URL and save to storage"""
    try:
        response = requests.get(url, timeout=30)
        if response.status_code == 200:
            filename = f"replicate_video_{int(__import__('time').time())}.mp4"
            filepath = VIDEO_STORAGE / filename
            
            with open(filepath, "wb") as f:
                f.write(response.content)
            
            logger.info(f"[Download] ✓ Saved: {filepath}")
            return str(filepath)
    except Exception as e:
        logger.error(f"[Download] Failed: {e}")
    
    return None


async def generate_video_fallback(procedure: str, prompt: str, duration: int = 5) -> Optional[str]:
    """
    Try multiple free/cheap providers in order:
    1. Replicate (cheap, ~$0.003)
    2. Hugging Face (completely free)
    3. Pika Labs (free tier with daily credits)
    """
    
    logger.info(f"[Fallback] Trying alternative providers for {procedure}...")
    
    # Try Replicate first (most reliable)
    logger.info("[Fallback] Step 1: Trying Replicate...")
    video_path = await generate_video_replicate(prompt, duration)
    if video_path:
        logger.info(f"[Fallback] ✓ SUCCESS with Replicate!")
        return video_path
    
    # Try Hugging Face (free)
    logger.info("[Fallback] Step 2: Trying Hugging Face (FREE)...")
    video_path = await generate_video_huggingface(prompt, duration)
    if video_path:
        logger.info(f"[Fallback] ✓ SUCCESS with Hugging Face!")
        return video_path
    
    # Try Pika Labs (free tier with daily credits)
    logger.info("[Fallback] Step 3: Trying Pika Labs (FREE daily credits)...")
    video_id = await generate_video_pika(prompt)
    if video_id:
        logger.info(f"[Fallback] ✓ Pika generation started!")
        return video_id
    
    logger.warning("[Fallback] All alternative providers failed or unavailable")
    return None
