"""Test free image generation APIs"""
import requests
from PIL import Image
import io, urllib.parse, base64

# Test 1: Pollinations v2 JSON API
print("=" * 50)
print("Test 1: Pollinations JSON API")
try:
    r = requests.post("https://text.pollinations.ai/", json={
        "prompt": "medical CPR training, person doing chest compressions, photorealistic"
    }, timeout=30)
    print(f"  Status: {r.status_code}")
except Exception as e:
    print(f"  Error: {e}")

# Test 2: Together.xyz free API 
print("\nTest 2: Together AI free endpoint")
try:
    r = requests.post("https://api.together.xyz/inference", json={
        "model": "stabilityai/stable-diffusion-xl-base-1.0",
        "prompt": "CPR medical training",
        "n": 1
    }, timeout=15)
    print(f"  Status: {r.status_code}, {r.text[:100]}")
except Exception as e:
    print(f"  Error: {e}")

# Test 3: Prodia free API
print("\nTest 3: Prodia free API")
try:
    r = requests.post("https://api.prodia.com/v1/sd/generate", json={
        "model": "v1-5-pruned-emaonly.safetensors [d7049739]",
        "prompt": "CPR medical training photorealistic",
        "negative_prompt": "bad quality",
        "steps": 20,
        "cfg_scale": 7,
        "seed": -1,
        "sampler": "DPM++ 2M Karras",
        "width": 1280,
        "height": 720,
    }, timeout=15, headers={"accept": "application/json"})
    print(f"  Status: {r.status_code}, {r.text[:200]}")
except Exception as e:
    print(f"  Error: {e}")

# Test 4: clipdrop/stability - check
print("\nTest 4: Stability AI REST API")
try:
    r = requests.post("https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image", 
        json={"text_prompts": [{"text": "CPR training"}], "height": 720, "width": 1280},
        timeout=10)
    print(f"  Status: {r.status_code}")
except Exception as e:
    print(f"  Error: {e}")

# Test 5: ArtBot (stable horde) - truly free, community GPUs
print("\nTest 5: AI Horde (Stable Horde) - community free GPUs")
try:
    r = requests.post("https://aihorde.net/api/v2/generate/async", json={
        "prompt": "medical training, person performing CPR chest compressions on patient, first aid, photorealistic, high quality",
        "params": {
            "width": 1024,
            "height": 576,
            "steps": 20,
            "n": 1,
        },
        "nsfw": False,
        "models": ["Deliberate"],
    }, headers={"apikey": "0000000000"}, timeout=15)
    print(f"  Status: {r.status_code}")
    if r.status_code == 202:
        data = r.json()
        job_id = data.get("id")
        print(f"  Job ID: {job_id}")
        print("  Waiting for generation...")
        import time
        for attempt in range(20):
            time.sleep(5)
            check = requests.get(f"https://aihorde.net/api/v2/generate/check/{job_id}", timeout=10)
            cdata = check.json()
            print(f"  Poll {attempt+1}: done={cdata.get('done')}, wait={cdata.get('wait_time')}s, queue={cdata.get('queue_position')}")
            if cdata.get("done"):
                # Get result
                result = requests.get(f"https://aihorde.net/api/v2/generate/status/{job_id}", timeout=15)
                rdata = result.json()
                generations = rdata.get("generations", [])
                if generations:
                    img_url = generations[0].get("img")
                    print(f"  Image URL: {img_url[:80]}")
                    img_r = requests.get(img_url, timeout=15)
                    if img_r.status_code == 200:
                        img = Image.open(io.BytesIO(img_r.content))
                        img.save("generated_videos/test_horde.png")
                        print(f"  SUCCESS! Image: {img.size}")
                break
    else:
        print(f"  Response: {r.text[:200]}")
except Exception as e:
    print(f"  Error: {e}")
