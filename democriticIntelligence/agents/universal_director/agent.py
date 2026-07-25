import os
import sys
import subprocess
from .topic_researcher import TopicResearcher
from .animation_generator import AnimationGenerator
from .script_writer import ScriptWriter
from .composer import UniversalComposer
from .thumbnail_generator import ThumbnailGenerator

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')


class UniversalDirectorAgent:
    """Universal Director Agent -- FULLY LLM-driven video pipeline with Web Research.
    
    Give it ANY topic and it produces an authentic, research-backed product demo video.
    EVERYTHING is driven by Web Gemini:
    
    0. Asks Gemini to RESEARCH real-world product specs, workflows, colors & terminology
    1. Asks Gemini to WRITE the bespoke HTML/CSS/JS animation code matching the research
    2. Asks Gemini to WRITE matching voiceover narration
    3. Generates audio + subtitles via Edge-TTS
    4. Records animation + composes 1080p MP4
    5. Asks Gemini to GENERATE a 16:9 product hero thumbnail
    """
    
    def __init__(self):
        self.researcher = TopicResearcher()
        self.animation_gen = AnimationGenerator()
        self.script_writer = ScriptWriter()
        self.composer = UniversalComposer()
        self.thumbnail_gen = ThumbnailGenerator()

    def run(self, topic: str) -> str:
        """Run the complete video pipeline for any topic."""
        
        safe_topic = topic.lower().replace(" ", "-").replace("_", "-")
        
        print("=" * 60)
        print(f"  Universal Director: Creating Video for '{topic}'")
        print(f"  Research & content driven by Web Gemini")
        print("=" * 60)
        
        # -- Step 0: Research Real-World Product & UI Specs --
        print(f"\n{'-'*50}")
        print(f"[Step 0/5] GEMINI -> Researching real-world context for '{topic}'")
        print(f"{'-'*50}")
        
        research_res = self.researcher.research(topic)
        research_brief = research_res.get("brief", "")
        
        # -- Step 1: Ask Gemini to generate the FULL animation code --
        print(f"\n{'-'*50}")
        print(f"[Step 1/5] GEMINI -> Generate bespoke animation for '{topic}'")
        print(f"  Opening Chromium -> gemini.google.com...")
        print(f"{'-'*50}")
        
        result = self.animation_gen.generate(topic, research_brief=research_brief)
        html_path = result["html_path"]
        app_name = result["app_name"]
        app_tagline = result["app_tagline"]
        html_code = result.get("html_code", "")
        
        print(f"\n  [OK] App Name: {app_name}")
        print(f"  [OK] Tagline: {app_tagline}")
        print(f"  [OK] Animation: {html_path}")
        
        # -- Step 2: Ask Gemini for voiceover narration --
        print(f"\n{'-'*50}")
        print(f"[Step 2/5] GEMINI -> Generate voiceover narration")
        print(f"  Opening Chromium -> gemini.google.com...")
        print(f"{'-'*50}")
        
        script_text = self.script_writer.write(
            topic=topic,
            app_name=app_name,
            html_code=html_code
        )
        
        word_count = len(script_text.split())
        print(f"\n  [OK] Narration: {word_count} words")
        print(f"  [OK] Preview: \"{script_text[:100]}...\"")
        
        # -- Step 3: Generate voiceover audio + subtitles via Edge-TTS --
        audio_file = f"{safe_topic}_voiceover.mp3"
        captions_file = f"{safe_topic}_captions.vtt"
        
        print(f"\n{'-'*50}")
        print(f"[Step 3/5] Edge-TTS -> Generate audio + subtitles")
        print(f"{'-'*50}")
        
        try:
            subprocess.run([
                "python", "-m", "edge_tts",
                "--text", script_text,
                "--write-media", audio_file,
                "--write-subtitles", captions_file
            ], check=True)
            print(f"  [OK] Audio: {audio_file}")
            print(f"  [OK] Subtitles: {captions_file}")
        except Exception as e:
            print(f"  [FAIL] Edge-TTS error: {e}")

        # -- Step 4: Record animation + compose final video --
        print(f"\n{'-'*50}")
        print(f"[Step 4/5] Composer -> Record animation + merge audio")
        print(f"{'-'*50}")
        
        video_output = self.composer.compose(
            html_path=html_path,
            topic=topic,
            audio_track=audio_file,
            captions_file=captions_file
        )
        
        # -- Step 5: Generate thumbnail via Gemini image generation --
        print(f"\n{'-'*50}")
        print(f"[Step 5/5] GEMINI -> Generate thumbnail image")
        print(f"  Opening Chromium -> gemini.google.com...")
        print(f"{'-'*50}")
        
        thumbnail_path = self.thumbnail_gen.generate(
            topic=topic,
            app_name=app_name
        )
        
        if thumbnail_path:
            print(f"  [OK] Thumbnail: {thumbnail_path}")
        else:
            print(f"  [SKIP] Thumbnail generation skipped")
        
        print(f"\n{'='*60}")
        print(f"  VIDEO CREATED SUCCESSFULLY!")
        print(f"  ")
        print(f"  Topic:      {topic}")
        print(f"  App:        {app_name}")
        print(f"  Tagline:    {app_tagline}")
        print(f"  Video:      {video_output}")
        print(f"  Thumbnail:  {thumbnail_path or 'N/A'}")
        print(f"{'='*60}")
        
        return video_output


if __name__ == "__main__":
    topic = sys.argv[1] if len(sys.argv) > 1 else "fitness"
    
    agent = UniversalDirectorAgent()
    agent.run(topic)
