import os
import subprocess
from playwright.sync_api import sync_playwright

class VideoComposer:
    """Produces the final video by combining all elements."""
    
    def compose(self, timeline, audio_tracks: dict[int, str], captions_file: str) -> str:
        raw_output = "demo_raw.webm"
        final_output = "demo_final.mp4"
        voice_track = audio_tracks.get(1, "voiceover.mp3") # Using the unified voiceover
        
        print(f"Recording raw video to {raw_output}...")
        
        # Find the largest .webm file in exploration_output/videos
        import glob
        import shutil
        
        video_dir = os.path.abspath(os.path.join("exploration_output", "videos"))
        webm_files = glob.glob(os.path.join(video_dir, "*.webm"))
        
        if webm_files:
            # Sort by size to get the longest video
            largest_video = max(webm_files, key=os.path.getsize)
            print(f"Using actual Explorer crawl video: {os.path.basename(largest_video)}")
            shutil.copy2(largest_video, raw_output)
        else:
            print("No Explorer videos found! Falling back to empty video.")
            subprocess.run(["ffmpeg", "-f", "lavfi", "-i", "color=c=black:s=1920x1080:d=45", raw_output], check=True)
        
        # Merge Video, Audio, and Burn Subtitles using high-quality FFmpeg flags
        print(f"Merging AI voiceover {voice_track} and burning subtitles {captions_file}...")
        if os.path.exists(final_output):
            os.remove(final_output)
            
        ffmpeg_cmd = [
            "ffmpeg", 
            "-y", 
            "-i", raw_output,
            "-i", voice_track,
            "-c:v", "libx264", 
            "-preset", "slow", 
            "-crf", "18", # High quality video
            "-c:a", "aac", 
            "-b:a", "192k",
            "-vf", f"subtitles={captions_file}",
            "-shortest", # End when the shortest stream (video) ends
            final_output
        ]
        
        try:
            subprocess.run(ffmpeg_cmd, check=True)
            print("Video composition completed successfully!")
        except Exception as e:
            print(f"FFmpeg failed: {e}")
            return raw_output
            
        return final_output
