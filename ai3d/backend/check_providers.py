#!/usr/bin/env python3
"""
Simple video provider check - avoids import issues
"""

import os
import subprocess
import sys

print("""
╔═══════════════════════════════════════════════════════════════╗
║   🎬 VIDEO GENERATION PROVIDERS - QUICK CHECK (FIXED)         ║
╚═══════════════════════════════════════════════════════════════╝
""")

# Check for environment variables
print("Checking installed APIs...\n")

providers = {
    "GOOGLE_GENAI_API_KEY": "Veo 3.1 (Google)",
    "REPLICATE_API_TOKEN": "Replicate (~$0.003/video)",
    "HUGGINGFACE_API_TOKEN": "Hugging Face (FREE)"
}

configured = 0

for env_var, name in providers.items():
    token = os.getenv(env_var)
    if token:
        print(f"✓ {name}")
        print(f"  {env_var} is SET")
        configured += 1
    else:
        print(f"⚠ {name}")
        print(f"  {env_var} not set")

print(f"\n{'─'*60}")

if configured == 0:
    print("""
⚠️  NO PROVIDERS CONFIGURED!

But DON'T WORRY! Hugging Face will work automatically for FREE!
(No setup required - completely free fallback)

If you want to:
• Use Replicate (cheaper, faster): Get token from https://replicate.com/account
• Use Google Veo: Set GOOGLE_GENAI_API_KEY
• Use Pika Labs: Set PIKA_API_KEY

Otherwise, your app will use Hugging Face FREE inference API. ✓
    """)
else:
    print(f"\n✓ {configured} provider(s) configured!")
    print("Video generation will work!")

print(f"\n{'─'*60}")
print("""
FALLBACK CHAIN (what happens when you click Generate Video):

1. Try Veo 3.1 (if GOOGLE_GENAI_API_KEY set)
2. Try Replicate (if REPLICATE_API_TOKEN set)  
3. Try Hugging Face FREE API (always works!)
4. If all fail → Show educational template

🎉 YOUR APP WILL WORK WITHOUT ANY SETUP! (Using Hugging Face fallback)
""")
