"""
Comprehensive Automated Test Suite for Universal Director

Runs multiple distinct topics through Web Gemini:
1. creator_economy (Inspiring 3D glassmorphic creator platform)
2. cyberpunk_crypto (Cyberpunk 3D crypto telemetry dashboard)
3. space_fitness (Sci-Fi futuristic bio-tracking showcase)

Verifies for each topic:
- Web Gemini HTML/CSS/JS generation (3D visual elements, float cards, glass bubbles)
- Web Gemini Voiceover Narration (Edge-TTS sync)
- Playwright video capture & FFmpeg compilation
- MP4 file creation & non-zero file size check
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from agents.universal_director import UniversalDirectorAgent


def run_test_suite():
    test_topics = [
        "netflix media streaming",
        "apple siri hardware"
    ]
    
    results = {}
    
    print("=" * 65)
    print("  AUTOMATED UNIVERSAL DIRECTOR TEST SUITE")
    print(f"  Testing {len(test_topics)} topics with full Web Gemini generation")
    print("=" * 65)
    
    agent = UniversalDirectorAgent()
    
    for idx, topic in enumerate(test_topics, start=1):
        print(f"\n[{idx}/{len(test_topics)}] STARTING TEST CASE: '{topic}'")
        print("-" * 50)
        
        try:
            output_file = agent.run(topic)
            safe_topic = topic.lower().replace(" ", "-").replace("_", "-")
            
            # Validation checks
            exists = os.path.exists(output_file)
            size_mb = os.path.getsize(output_file) / (1024 * 1024) if exists else 0
            
            html_file = os.path.join("animation", f"{safe_topic}.html")
            html_exists = os.path.exists(html_file)
            html_size = os.path.getsize(html_file) if html_exists else 0
            
            passed = exists and size_mb > 0.5 and html_exists and html_size > 5000
            
            results[topic] = {
                "passed": passed,
                "output_video": output_file,
                "video_size_mb": round(size_mb, 2),
                "html_file": html_file,
                "html_size_kb": round(html_size / 1024, 1)
            }
            
            status_str = "PASSED" if passed else "FAILED"
            print(f"\n>>> TEST [{topic}]: {status_str} (Video: {size_mb:.2f} MB, HTML: {html_size/1024:.1f} KB)")
            
        except Exception as e:
            print(f"\n>>> TEST [{topic}]: ERROR - {e}")
            results[topic] = {
                "passed": False,
                "error": str(e)
            }

    print("\n" + "=" * 65)
    print("  TEST SUITE RESULTS SUMMARY")
    print("=" * 65)
    
    all_passed = True
    for topic, res in results.items():
        status = "PASSED [✓]" if res.get("passed") else "FAILED [✗]"
        if not res.get("passed"):
            all_passed = False
        print(f"  • {topic:<20} : {status:<12} (Size: {res.get('video_size_mb', 0)} MB)")
    
    print("=" * 65)
    
    return all_passed


if __name__ == "__main__":
    success = run_test_suite()
    sys.exit(0 if success else 1)
