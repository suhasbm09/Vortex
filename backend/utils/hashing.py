import hashlib
 

def generate_post_hash(content: str, image_url: str, timestamp: str) -> str:
    raw_string = f"{content}|{image_url}|{timestamp}"
    return hashlib.sha256(raw_string.encode('utf-8')).hexdigest()
