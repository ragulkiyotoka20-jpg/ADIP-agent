import os
from .gemini_web_llm import GeminiWebLLM

class HtmlGenerator:
    """Generates dynamic HTML/CSS animations matching the voiceover script."""
    
    def __init__(self):
        self.llm = GeminiWebLLM()
        
    def generate_html(self, scripts: dict, output_path: str = "animation/dynamic_demo.html") -> str:
        print("[HtmlGenerator] Asking Gemini Web to generate dynamic HTML/CSS animation...")
        script_text = "\n".join([f"Scene {k}: {v}" for k, v in scripts.items() if v])
        
        prompt = (
            "You are an expert frontend developer and animator.\n"
            "Create a single self-contained HTML file (with embedded CSS/JS) that acts as a 45-second product demonstration video.\n"
            f"The visual animation MUST visually represent the following script narration:\n{script_text}\n\n"
            "Rules:\n"
            "1. Use smooth CSS keyframe animations, modern styling, and dynamic UI elements.\n"
            "2. Make the animation exactly 45 seconds long (e.g. chaining animations or using setTimeout).\n"
            "3. DO NOT include any audio tags or play buttons. It should start animating automatically on load.\n"
            "4. Make it look like a highly polished SaaS product demo with fake dashboards, graphs, or UI mimicking the script.\n"
            "5. The background should be a clean, modern gradient.\n"
            "IMPORTANT: Output ONLY the raw HTML code starting with <!DOCTYPE html>. Do not use markdown backticks."
        )
        
        html_content = self.llm.ask_gemini(prompt)
        
        # Clean up markdown backticks if Gemini includes them
        if html_content.startswith("```html"):
            html_content = html_content[7:]
        if html_content.startswith("```"):
            html_content = html_content[3:]
        if html_content.endswith("```"):
            html_content = html_content[:-3]
            
        abs_output_path = os.path.abspath(output_path)
        os.makedirs(os.path.dirname(abs_output_path), exist_ok=True)
        with open(abs_output_path, "w", encoding="utf-8") as f:
            f.write(html_content.strip())
            
        print(f"[HtmlGenerator] Dynamic HTML animation saved to {abs_output_path}")
        return abs_output_path
