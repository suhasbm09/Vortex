def get_moderation_prompt(post: str) -> str:
    return f"""
You are a content moderation AI for a social platform. Analyze the following post for:
1. Harmful content (hate speech, violence, harassment)
2. Misinformation or fake news
3. Spam or inappropriate content
4. Overall trustworthiness and community value

Post to analyze: "{post}"

Return ONLY a valid JSON object with these exact fields:
- trust_score: integer between 0-100 (higher = more trustworthy)
- trust_tag: exactly one of "🟢" (safe), "🟡" (caution), or "🔴" (unsafe)
- explanation: brief reason for the score (max 100 characters)

Example response format:
{{"trust_score": 85, "trust_tag": "🟢", "explanation": "Positive community content"}}

Respond with ONLY the JSON object, no other text:
""" 