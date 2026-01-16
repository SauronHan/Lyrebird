
import logging
import json
from typing import List, Dict, Optional
from openai import OpenAI
from app.config import settings

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self._initialize_client()

    def _initialize_client(self):
        self.client = None
        if settings.OPENAI_API_KEY:
            try:
                self.client = OpenAI(
                    api_key=settings.OPENAI_API_KEY,
                    base_url=settings.OPENAI_BASE_URL
                )
                logger.info(f"LLMService initialized with OpenAI client (Model: {settings.LLM_MODEL}, Base: {settings.OPENAI_BASE_URL}).")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}")
        else:
            logger.warning("OPENAI_API_KEY not set. LLM features will be disabled.")

    def ensure_initialized(self):
        """Re-check settings and initialize if not already done."""
        if not self.client and settings.OPENAI_API_KEY:
            logger.info("Re-attempting LLMService initialization...")
            self._initialize_client()

    def generate_podcast_script(
        self, 
        context_text: str, 
        host_name: str = "Host", 
        guest_name: str = "Guest",
        mode: str = "solo",
        style: str = "Deep Dive",
        language: str = "Chinese",
        n_rounds: int = 5
    ) -> List[Dict[str, str]]:
        """
        Generate a podcast script from the given context text.
        Returns a list of dicts: [{"speaker": "Host", "text": "..."}]
        """
        self.ensure_initialized()
        if not self.client:
            raise ValueError(f"LLM Service is not configured. Please ensure OPENAI_API_KEY is set in backend/.env. Current key status: {'set' if settings.OPENAI_API_KEY else 'empty'}")

        system_prompt = self._build_system_prompt(host_name, guest_name, mode, style, language, n_rounds)
        
        try:
            logging.info(f"Sending request to LLM (style={style}, lang={language})...")
            # Using text response format now, not JSON object
            response = self.client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Here is the source material to discuss:\n\n{context_text}"}
                ],
                temperature=0.7
            )
            
            content = response.choices[0].message.content
            logger.info("Received response from LLM.")
            
            if content is None:
                logger.error("LLM returned an empty content (None).")
                raise ValueError("LLM returned an empty response. Please check your API key or model availability.")
            
            # Parse text format "Host: ... \n Guest: ..." -> List[Dict]
            return self._parse_script_text(content, host_name, guest_name)

        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
            raise

    def _build_system_prompt(self, host_name: str, guest_name: str, mode: str, style: str, language: str, n_rounds: int = 5) -> str:
        # Map style to filename
        style_map = {
            "Deep Dive": "Deep Dive.dm",
            "Debate": "Debate.dm",
            "Critique": "Critique.dm"
        }
        filename = style_map.get(style, "Deep Dive.dm")
        
        # Load prompt content
        prompt_path = settings.PROMPT_DIR / filename
        try:
            print(f"\n--- [Backend] Loading prompt file: {filename} ---")
            logger.info(f"Loading prompt file: {prompt_path}")
            with open(prompt_path, "r", encoding="utf-8") as f:
                base_prompt = f.read()
        except Exception as e:
            logger.error(f"Failed to load prompt file {filename}: {e}")
            # Fallback prompt if file missing
            base_prompt = "You are a podcast script writer."

        # Inject Language instruction if not explicitly in file (files seem to have Chinese instruction mainly)
        # The user said prompt files have format requirement.
        # We need to append or ensure language requirement. 
        # The dm files allow specific language output? 
        # User request: "Need to pass prompt + content + language requirement"
        
        # Inject Language instruction
        lang_map = {
            "Chinese": "Simplified Chinese (简体中文)",
            "Japanese": "Japanese (日本語)",
            "English": "English"
        }
        target_lang = lang_map.get(language, "English")
        lang_instruction = (
            f"\n\n# Language Requirement\n"
            f"CRITICAL: You MUST generate the dialogue strictly in {target_lang}. "
            f"Even if the system instructions and source text are in Chinese, the final output dialogue MUST be in {target_lang}.\n"
        )
        
        # Inject Turns instruction
        turns_instruction = f"\nIMPORTANT: Generate a dialogue with exactly {n_rounds} rounds of interaction (where each round is Host+Guest).\n"

        return base_prompt + lang_instruction + turns_instruction

    def _parse_script_text(self, text: str, host_name: str, guest_name: str) -> List[Dict[str, str]]:
        """
        Parses text like:
        Host: Hello there.
        Guest: Hi!
        
        Into:
        [
            {"speaker": "Host", "text": "Hello there."},
            {"speaker": "Guest", "text": "Hi!"}
        ]
        """
        lines = text.strip().split('\n')
        script = []
        
        current_speaker = None
        current_text = []

        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Check for "SpeakerName: " pattern
            # We check if the line contains a colon and if the part before it matches 
            # either the generic "Host"/"Guest" or the specific names provided (like 寒松/夏天)
            if ":" in line:
                parts = line.split(":", 1)
                potential_name = parts[0].strip()
                
                # If the name is one of the recognized roles
                # We also check common Chinese equivalents or just specific names if passed
                is_host_line = potential_name in ["Host", host_name, "寒松"]
                is_guest_line = potential_name in ["Guest", guest_name, "夏天"]
                
                if is_host_line or is_guest_line:
                    # Save previous speaker's text
                    if current_speaker:
                        script.append({"speaker": current_speaker, "text": " ".join(current_text)})
                    
                    # Start new speaker
                    current_speaker = host_name if is_host_line else guest_name
                    if len(parts) > 1:
                        current_text = [parts[1].strip()]
                    else:
                        current_text = []
                    continue

            # If not a new speaker line, append to current text
            if current_speaker:
                current_text.append(line)
        
        # Append last one
        if current_speaker:
            script.append({"speaker": current_speaker, "text": " ".join(current_text)})
            
        logger.info(f"Parsed {len(script)} dialogue lines from LLM response.")
        return script

    def optimize_script_emotions(self, script_lines: List[Dict]) -> List[Dict]:
        """
        Optimize the script by adding Lyrebird-compatible emotion and prosody tags.
        """
        logger.info("Optimizing script for emotions and prosody...")
        self.ensure_initialized()
        if not self.client:
             return script_lines

        try:
            # 1. Serialize script for the prompt
            script_text = ""
            for i, line in enumerate(script_lines):
                script_text += f"Line {i}: [{line.get('speaker', 'Unknown')}]: {line.get('text', '')}\n"

            # 2. Build Prompt
            # 2. Build Prompt
            try:
                prompt_path = settings.PROMPT_DIR / "Emotion_Optimization.md"
                with open(prompt_path, "r", encoding="utf-8") as f:
                    system_prompt = f.read()
            except Exception as e:
                logger.warning(f"Failed to load Emotion_Optimization.md, using default: {e}")
                system_prompt = (
                    "You are an expert Podcast Director and Speech Coach using Lyrebird Lyrebird technology.\n"
                    "Your task is to polish the following dialogue script to make it sound EXTREMELY natural, vivid, and human-like.\n"
                    "You MUST insert specific audio tags into the text to control prosody and emotion.\n"
                    "\n"
                    "### Allowed Tags (Use these strictly):\n"
                    "- [laughter] : Insert for jokes, funny moments, chuckles, or lighthearted sarcasm.\n"
                    "- [breath] : Insert for natural pauses, taking a breath after long sentences, or before a thoughtful statement.\n"
                    "- [sight], [cough], [lipsmack] : Use VERY sparingly for extreme realism (e.g. hesitation).\n"
                    "- <happy> : For excitement, joy, or enthusiasm.\n"
                    "- <sad> : For regret, sorrow, or heavy-heartedness.\n"
                    "- <angry> : For arguments or strong disagreement.\n"
                    "- <fearful> : For worry or panic.\n"
                    "- <surprised> : For shock or disbelief.\n"
                    "- <disgusted> : For rejection or disdain.\n"
                    "- <neutral> : For calm narration.\n"
                    "- <affectionate> : For warm, caring moments.\n"
                    "- <serious> : For deep analysis or severe points.\n"
                    "- <whisper> : For secrets or quiet/intimate emphasis.\n"
                    "\n"
                    "### Rules:\n"
                    "1. DO NOT change the original semantic meaning or words of the dialogue, unless necessary to fit a tag (e.g. breaking a sentence).\n"
                    "2. Focus on adding [breath] for comfortable pacing.\n"
                    "3. Use [laughter] where the context implies humor or friendly agreement.\n"
                    "4. Return the result as a raw JSON list of objects: [{\"id\": \"...\", \"speaker\": \"...\", \"text\": \"...\"}].\n"
                    "5. Ensure the 'id' and 'speaker' fields remain exactly the same as the input (or map correctly back to line numbers if needed, but best to return the full object).\n"
                    "6. Output ONLY valid JSON. No markdown formatting."
                )

            user_prompt = (
                f"Here is the script to optimize:\n\n{script_text}\n\n"
                "Please return the JSON list with optimized 'text' fields containing the tags."
            )

            # 3. Call LLM
            response = self.client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7, # Slightly creative for emotions
            )
            
            content = response.choices[0].message.content
            
            # 4. Parse JSON
            # Clean potential markdown
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()

            optimized_data = json.loads(content)
            
            # 5. Validate and Merge
            # We trust the LLM mostly, but we MUST ensure 'speaker' is exactly "Host" or "Guest" for the UI.
            if isinstance(optimized_data, list):
                for line in optimized_data:
                    # Robust speaker mapping
                    orig_spk = str(line.get("speaker", "")).lower()
                    if "host" in orig_spk or "寒松" in orig_spk or "h" == orig_spk:
                        line["speaker"] = "Host"
                    elif "guest" in orig_spk or "夏天" in orig_spk or "g" == orig_spk:
                        line["speaker"] = "Guest"
                    else:
                        # Fallback to Host if unknown, to avoid UI breakage
                        line["speaker"] = "Host"
                        
                return optimized_data
            else:
                 logger.warning("LLM did not return a list. Returning original.")
                 return script_lines

        except Exception as e:
            logger.error(f"Error optimizing emotions: {e}")
            # Fallback to original
            return script_lines
