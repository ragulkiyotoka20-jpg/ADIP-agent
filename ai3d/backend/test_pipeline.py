"""Quick e2e test of AI video pipeline"""
import requests
from PIL import Image, ImageDraw, ImageFont
import imageio
import numpy as np
import io, time, pathlib

print("=" * 60)
print("AI Video Pipeline - End-to-End Test (2 frames)")
print("=" * 60)

prompts = [
    "medical training scene, person performing CPR chest compressions on patient lying on floor, first aid rescue, photorealistic",
    "close up of two hands placed on center of chest for CPR compressions, heel of palm position, medical training, photorealistic",
]

frame_texts = [
    "Patient positioning - supine on firm surface",
    "Hand placement - heel-palm position on sternum",
]

images = []
for i, prompt in enumerate(prompts):
    print(f"\nFrame {i+1}: Submitting to AI Horde...")
    r = requests.post("https://aihorde.net/api/v2/generate/async", json={
        "prompt": prompt + ", high quality, detailed, professional",
        "params": {"width": 512, "height": 512, "steps": 25, "n": 1, "cfg_scale": 7.5, "sampler_name": "k_euler_a"},
        "nsfw": False,
        "models": ["Deliberate"],
        "r2": True,
    }, headers={"apikey": "0000000000"}, timeout=15)
    
    if r.status_code != 202:
        print(f"  Submit failed: {r.status_code}")
        images.append(Image.new('RGB', (512, 512), color=(20, 20, 50)))
        continue
    
    job_id = r.json().get("id")
    print(f"  Job: {job_id}")
    
    for attempt in range(15):
        time.sleep(5)
        check = requests.get(f"https://aihorde.net/api/v2/generate/check/{job_id}", timeout=10)
        cdata = check.json()
        wait = cdata.get("wait_time", 0)
        done = cdata.get("done", False)
        print(f"  [{attempt*5}s] Wait: {wait}s, Done: {done}")
        
        if done:
            result = requests.get(f"https://aihorde.net/api/v2/generate/status/{job_id}", timeout=15)
            gens = result.json().get("generations", [])
            if gens:
                img_url = gens[0].get("img")
                img_r = requests.get(img_url, timeout=30)
                if img_r.status_code == 200:
                    img = Image.open(io.BytesIO(img_r.content))
                    images.append(img)
                    print(f"  ✓ Image generated! {img.size}")
            break
    else:
        print(f"  Timeout")
        images.append(Image.new('RGB', (512, 512), color=(20, 20, 50)))

# Composite into video
print(f"\nCompositing {len(images)} frames into video...")
frame_images = []
for i, (img, text) in enumerate(zip(images, frame_texts)):
    bg = img.convert('RGB').resize((1280, 720), Image.LANCZOS)
    dark = Image.new('RGB', (1280, 720), (0, 0, 0))
    bg = Image.blend(bg, dark, 0.3)
    draw = ImageDraw.Draw(bg)
    
    try:
        ft = ImageFont.truetype("arial.ttf", 36)
        fs = ImageFont.truetype("arial.ttf", 26)
    except:
        ft = ImageFont.load_default()
        fs = ft
    
    draw.text((20, 15), f"CPR", fill=(100, 200, 255), font=ft)
    draw.text((1100, 20), f"Step {i+1}/2", fill=(180, 180, 200), font=fs)
    draw.text((30, 660), text[:70], fill=(255, 255, 255), font=fs)
    draw.text((30, 695), "CardioSim AI", fill=(80, 220, 130), font=fs)
    
    frame_images.append(np.array(bg))
    frame_images.append(np.array(bg))  # 2 seconds per frame

out = pathlib.Path("generated_videos/test_ai_video.mp4")
out.parent.mkdir(exist_ok=True)
imageio.mimwrite(str(out), frame_images, fps=1, codec='libx264')

print(f"\n✓ Video saved: {out} ({out.stat().st_size} bytes)")
print("PIPELINE TEST COMPLETE!")
