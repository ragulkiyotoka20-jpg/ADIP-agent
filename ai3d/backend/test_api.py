"""Test the video generation API endpoint"""
import requests, time

print("Sending API request to /video-generation/huggingface-simple...")
start = time.time()
r = requests.post(
    "http://localhost:8000/api/video-generation/huggingface-simple",
    json={
        "procedure": "CPR",
        "urgency": "Immediate",
        "steps": ["Check responsiveness", "Call 911", "Begin CPR"],
        "duration": 60,
    },
    timeout=300,
)
elapsed = int(time.time() - start)
print(f"Status: {r.status_code} ({elapsed}s)")

if r.status_code == 200:
    data = r.json()
    print(f"Video status: {data.get('status')}")
    print(f"Video URL: {data.get('video_url')}")
    print(f"Frames: {len(data.get('frames', []))}")
    print(f"Description: {data.get('description')}")
    
    # Test download
    if data.get("video_url"):
        dl = requests.get(f"http://localhost:8000{data['video_url']}", timeout=30)
        print(f"Download: {dl.status_code}, {len(dl.content)} bytes")
else:
    print(f"Error: {r.text[:300]}")
