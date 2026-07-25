import sys
from ..demo.gemini_web_llm import GeminiWebLLM

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')


class ScriptWriter:
    """Uses Web Gemini (via Chromium browser) to write the voiceover narration.
    
    Flow:
    1. Opens Chromium browser → gemini.google.com
    2. Sends the generated HTML + asks Gemini to write a matching narration
    3. Returns the plain text voiceover script
    
    The narration is based on what Gemini ACTUALLY generated in the HTML,
    so the voiceover always matches the visuals on screen.
    """
    
    def __init__(self):
        self.llm = GeminiWebLLM()
    
    def write(self, topic: str, app_name: str, html_code: str = None) -> str:
        """Ask Web Gemini to write a voiceover narration for the generated animation."""
        
        # If we have the HTML, include a summary so Gemini knows what's on screen
        html_context = ""
        if html_code and len(html_code) > 100:
            # Extract visible text from HTML to give Gemini context
            import re
            # Remove style and script tags
            text = re.sub(r'<style[\s\S]*?</style>', '', html_code)
            text = re.sub(r'<script[\s\S]*?</script>', '', text)
            # Remove HTML tags
            text = re.sub(r'<[^>]+>', ' ', text)
            # Clean whitespace
            text = re.sub(r'\s+', ' ', text).strip()
            if len(text) > 50:
                html_context = f"\n\nThe app UI shows this visible text content:\n{text[:500]}"
        
        prompt = f"""You are a world-class voiceover narrator for Apple/Stripe-level product launches.

Write a 45-second high-energy voiceover narration script (approximately 130-140 words total) for a product demo video of "{app_name}", an app/product about "{topic}".
{html_context}

NARRATION INSTRUCTIONS:
- Write EXACTLY 130 to 140 words total.
- Match the visual story, features, and UI elements presented in the HTML text above.
- Make it sound energetic, inspiring, and high-converting.
- Mention "{app_name}" at least twice.
- Flow smoothly from the opening reveal to the mid-session features and closing call to action.

Return ONLY plain voiceover text. No scene markers, no brackets, no quotes."""
        
        print(f"[ScriptWriter] Opening Chromium → gemini.google.com")
        print(f"[ScriptWriter] Asking Gemini to write narration for '{app_name}'...")
        
        script_text = self.llm.ask_gemini(prompt, timeout=60)
        
        if script_text and len(script_text.split()) >= 40:
            script_text = self._clean_script(script_text)
            print(f"[ScriptWriter] Narration generated: {len(script_text.split())} words")
            return script_text
        
        # Retry with simpler prompt
        print("[ScriptWriter] First attempt short. Retrying...")
        return self._retry_write(topic, app_name)
    
    def _retry_write(self, topic: str, app_name: str) -> str:
        """Simplified retry."""
        
        prompt = (
            f'Write a 130-word professional voiceover for "{app_name}", '
            f'a {topic} mobile app with 4 scenes: dashboard, live tracking, '
            f'achievement, and brand outro. Be energetic and inspiring. '
            f'Return ONLY the narration text.'
        )
        
        script_text = self.llm.ask_gemini(prompt, timeout=60)
        
        if script_text and len(script_text.split()) >= 30:
            return self._clean_script(script_text)
        
        # Even the final fallback uses the Gemini-generated app name
        print("[ScriptWriter] Using fallback with AI-generated app name...")
        return (
            f"Welcome to {app_name}, the ultimate AI-powered {topic} companion "
            f"engineered to elevate your experience. Track your daily goals with "
            f"dynamic progress rings, real-time monitoring, and intelligent metrics. "
            f"Step into live mode, where smart tracking monitors your activity in real time, "
            f"keeping you informed and motivated every step of the way. "
            f"Celebrate every milestone as {app_name} automatically logs your achievements "
            f"and awards badges for your dedication. "
            f"Millions of users worldwide trust {app_name} to reach peak performance. "
            f"Download {app_name} today and transform your {topic} experience."
        )
    
    def _clean_script(self, text: str) -> str:
        """Clean up Gemini's response to get pure narration text."""
        text = text.strip()
        # Remove surrounding quotes
        if text.startswith('"') and text.endswith('"'):
            text = text[1:-1]
        if text.startswith("'") and text.endswith("'"):
            text = text[1:-1]
        # Remove any scene labels
        import re
        text = re.sub(r'\*\*Scene \d+.*?\*\*\s*', '', text)
        text = re.sub(r'Scene \d+:\s*', '', text)
        text = re.sub(r'\[.*?\]\s*', '', text)
        # Clean extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        return text
