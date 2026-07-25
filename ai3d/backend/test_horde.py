"""Test AI Horde with correct params"""
import requests
from PIL import Image
import io, time

print("AI Horde - Free community image generation")
print("=" * 50)

r = requests.post("https://aihorde.net/api/v2/generate/async", json={
    "prompt": "medical training, person performing CPR chest compressions on patient lying on floor, first aid rescue, hospital, photorealistic, high quality, detailed",
    "params": {
        "width": 512,
        "height": 512,
        "steps": 25,
        "n": 1,
        "cfg_scale": 7.5,
        "sampler_name": "k_euler_a",
    },
    "nsfw": False,
    "models": ["Deliberate"],
    "r2": True,
}, headers={"apikey": "0000000000"}, timeout=15)

print(f"Status: {r.status_code}")
if r.status_code == 202:
    data = r.json()
    job_id = data.get("id")
    print(f"Job ID: {job_id}")
    print("Waiting for generation (free GPU queue)...")
    
    for attempt in range(40):
        time.sleep(5)
        check = requests.get(f"https://aihorde.net/api/v2/generate/check/{job_id}", timeout=10)
        cdata = check.json()
        wait = cdata.get("wait_time", 0)
        queue = cdata.get("queue_position", 0)
        done = cdata.get("done", False)
        print(f"  [{attempt*5}s] Queue: {queue}, Wait: {wait}s, Done: {done}")
        
        if done:
            result = requests.get(f"https://aihorde.net/api/v2/generate/status/{job_id}", timeout=15)
            rdata = result.json()
            generations = rdata.get("generations", [])
            if generations:
                img_url = generations[0].get("img")
                print(f"  Downloading from: {img_url[:80]}...")
                img_r = requests.get(img_url, timeout=30)
                if img_r.status_code == 200:
                    img = Image.open(io.BytesIO(img_r.content))
                    img = img.resize((1280, 720), Image.LANCZOS)
                    img.save("generated_videos/test_horde.png")
                    print(f"  SUCCESS! Image saved: {img.size}")
                else:
                    print(f"  Download failed: {img_r.status_code}")
            break
    else:
        print("  Timed out after 200 seconds")
else:
    print(f"Error: {r.text[:300]}")
