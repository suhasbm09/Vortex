import os
import httpx
from utils.prompt_template import get_moderation_prompt
import ast
import logging
logger = logging.getLogger(__name__)

async def call_openrouter(post_text: str):
    # Check if API key is available
    api_key = os.getenv('OPENROUTER_API_KEY')
    if not api_key:
        logger.warning("[OpenRouter] No API key found, using fallback moderation")
        return {
            "trust_score": 75,
            "trust_tag": "🟡",
            "explanation": "AI moderation unavailable - no API key configured"
        }
    
    prompt = get_moderation_prompt(post_text)
    payload = {
        "model": "mistralai/mistral-7b-instruct:free",  # Free model, widely available
        "messages": [
            {"role": "system", "content": "You are a content moderation AI for a social platform."},
            {"role": "user", "content": prompt}
        ]
    }
    
    try:
        logger.info(f"[OpenRouter] Sending moderation request for text: {post_text[:50]}...")
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post("https://openrouter.ai/api/v1/chat/completions", headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }, json=payload)
            
            logger.info(f"[OpenRouter] Response status: {response.status_code}")
            
            if response.status_code != 200:
                logger.error(f"[OpenRouter] API error: {response.status_code} - {response.text}")
                raise Exception(f"API returned status {response.status_code}")
            
            result = response.json()
            
            if 'choices' not in result or not result['choices']:
                raise Exception("No choices in API response")
            
            content = result['choices'][0]['message']['content']
            logger.info(f"[OpenRouter] Raw AI response: {content}")
            
            # Try to parse the JSON response
            try:
                parsed_result = ast.literal_eval(content.strip())
                if isinstance(parsed_result, dict) and 'trust_score' in parsed_result:
                    return parsed_result
                else:
                    raise Exception("Invalid response format")
            except (ValueError, SyntaxError) as parse_error:
                logger.error(f"[OpenRouter] Failed to parse AI response: {parse_error}")
                # Fallback: analyze content manually
                return analyze_content_manually(post_text)
                
    except Exception as e:
        logger.error(f"[OpenRouter] AI moderation failed: {e}")
        # Fallback: analyze content manually
        return analyze_content_manually(post_text)

def analyze_content_manually(text: str):
    """Fallback content analysis when AI is unavailable"""
    text_lower = text.lower()
    
    # Simple keyword-based analysis
    harmful_keywords = ['hate', 'violence', 'abuse', 'spam', 'scam', 'fake']
    positive_keywords = ['love', 'peace', 'help', 'support', 'community', 'positive']
    
    harmful_count = sum(1 for word in harmful_keywords if word in text_lower)
    positive_count = sum(1 for word in positive_keywords if word in text_lower)
    
    # Calculate basic trust score
    if harmful_count > 0:
        trust_score = max(30, 100 - (harmful_count * 20))
        trust_tag = "🔴" if harmful_count > 2 else "🟡"
        explanation = f"Content contains potentially harmful keywords"
    elif positive_count > 0:
        trust_score = min(95, 70 + (positive_count * 5))
        trust_tag = "🟢"
        explanation = "Content appears positive and community-friendly"
    else:
        trust_score = 75
        trust_tag = "🟡"
        explanation = "Content appears neutral"
    
    return {
        "trust_score": trust_score,
        "trust_tag": trust_tag,
        "explanation": explanation
    } 