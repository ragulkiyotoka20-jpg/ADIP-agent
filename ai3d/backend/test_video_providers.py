#!/usr/bin/env python3
"""
Test script to verify which video generation providers are available
Run: python test_video_providers.py
"""

import os
import sys

def test_provider(name, import_name, env_var=None):
    """Test if a provider is available"""
    print(f"\n{'='*50}")
    print(f"Testing: {name}")
    print(f"{'='*50}")
    
    # Try import
    try:
        __import__(import_name)
        print(f"✓ Package installed: {import_name}")
    except ImportError as e:
        print(f"✗ Package missing: {import_name}")
        print(f"   Install with: pip install {import_name}")
        return False
    
    # Check API key if needed
    if env_var:
        token = os.getenv(env_var)
        if token:
            print(f"✓ API key set: {env_var}")
            print(f"  Token preview: {token[:20]}...")
            return True
        else:
            print(f"⚠ API key not set: {env_var}")
            print(f"   Set with: $env:{env_var} = 'your-token'")
            return False
    
    return True


def main():
    print("""
╔════════════════════════════════════════════════════════════╗
║        VIDEO GENERATION PROVIDERS - AVAILABILITY CHECK      ║
╚════════════════════════════════════════════════════════════╝
    """)
    
    providers = [
        ("Google Veo 3.1", "google.generativeai", "GOOGLE_GENAI_API_KEY"),
        ("Replicate", "replicate", "REPLICATE_API_TOKEN"),
        ("Hugging Face", "huggingface_hub", "HUGGINGFACE_API_TOKEN"),
        ("Pika Labs", "requests", "PIKA_API_KEY"),
    ]
    
    available = []
    
    for name, pkg, env_var in providers:
        if env_var == "requests":  # Pika only needs requests
            try:
                __import__(pkg)
                token = os.getenv(env_var)
                print(f"\n{'='*50}")
                print(f"Testing: {name}")
                print(f"{'='*50}")
                print(f"✓ Package installed: {pkg}")
                if token:
                    print(f"✓ API key set: {env_var}")
                    available.append(name)
                else:
                    print(f"⚠ API key not set: {env_var}")
            except ImportError:
                print(f"✗ Package missing: {pkg}")
        else:
            if test_provider(name, pkg.split('.')[0], env_var):
                available.append(name)
    
    # Summary
    print(f"\n{'='*50}")
    print("SUMMARY")
    print(f"{'='*50}")
    
    if available:
        print(f"\n✓ Available providers: {len(available)}")
        for provider in available:
            print(f"  • {provider}")
    else:
        print("\n⚠ No providers configured!")
        print("\nTo use video generation, set at least one:")
        print("  • GOOGLE_GENAI_API_KEY (Veo 3.1)")
        print("  • REPLICATE_API_TOKEN (Replicate)")
        print("  • HUGGINGFACE_API_TOKEN (Hugging Face - optional)")
    
    print(f"\n{'='*50}")
    print("FALLBACK CHAIN (in order of priority):")
    print(f"{'='*50}")
    print("1. Veo 3.1 (Google)")
    print("2. Replicate (~$0.003/video)")
    print("3. Hugging Face (FREE, no setup needed!)")
    print("4. Pika Labs (free daily credits)")
    print("5. Template descriptions (fallback)")
    
    if not available or "Hugging Face" not in available:
        print("\n💡 TIP: Hugging Face works for FREE without any setup!")
        print("         Your backend will auto-use it as fallback.")
    
    print(f"\n{'='*50}\n")


if __name__ == "__main__":
    main()
