import firebase_admin
from firebase_admin import credentials, firestore
from typing import Optional, List, Dict, Any, Tuple
import logging
import os
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

# Configuration
FIREBASE_SERVICE_ACCOUNT_PATH = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH', 'serviceAccount.json')
FIREBASE_PROJECT_ID = os.getenv('FIREBASE_PROJECT_ID')
FIREBASE_DATABASE_URL = os.getenv('FIREBASE_DATABASE_URL')

# Initialize Firebase Admin SDK
firebase_initialized = False
firebase_app = None

def initialize_firebase():
    """Initialize Firebase Admin SDK with proper error handling"""
    global firebase_initialized, firebase_app
    
    if firebase_initialized:
        return True
    
    try:
        # Check if service account file exists
        if not os.path.exists(FIREBASE_SERVICE_ACCOUNT_PATH):
            logger.error(f"Firebase service account file not found: {FIREBASE_SERVICE_ACCOUNT_PATH}")
            return False
        
        # Initialize with service account
        cred = credentials.Certificate(FIREBASE_SERVICE_ACCOUNT_PATH)
        
        # Initialize app with project ID if provided
        app_options = {}
        if FIREBASE_PROJECT_ID:
            app_options['projectId'] = FIREBASE_PROJECT_ID
        if FIREBASE_DATABASE_URL:
            app_options['databaseURL'] = FIREBASE_DATABASE_URL
            
        firebase_app = firebase_admin.initialize_app(cred, options=app_options)
        firebase_initialized = True
        
        logger.info("✅ Firebase Admin SDK initialized successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize Firebase: {e}")
        return False

def get_firestore_client():
    """Get Firestore client with connection validation"""
    if not firebase_initialized:
        if not initialize_firebase():
            logger.error("Firebase not initialized. Cannot get Firestore client.")
            return None
    
    try:
        client = firestore.client()
        # Test connection
        client.collection('_health_check').document('test').get()
        return client
    except Exception as e:
        logger.error(f"Failed to get Firestore client: {e}")
        return None

def test_firestore_connection():
    """Test Firestore connection with timeout"""
    try:
        db = get_firestore_client()
        if not db:
            return False
        
        # Try to read a non-existent document
        db.collection('test').document('connection_test').get()
        logger.info("✅ Firestore connection test succeeded")
        return True
    except Exception as e:
        logger.error(f"❌ Firestore connection test failed: {e}")
        return False

def get_connection_status():
    """Get detailed connection status"""
    try:
        db = get_firestore_client()
        if db:
            # Test with a simple operation
            db.collection('_health_check').document('status').get()
            return {
                "status": "connected",
                "timestamp": datetime.utcnow().isoformat(),
                "project_id": FIREBASE_PROJECT_ID or "default"
            }
        else:
            return {
                "status": "disconnected",
                "timestamp": datetime.utcnow().isoformat(),
                "error": "Failed to get Firestore client"
            }
    except Exception as e:
        return {
            "status": "error",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }

# User operations with improved error handling
def create_user(wallet_address: str, username: str, display_name: str, 
                profile_image: Optional[str] = None, bio: Optional[str] = None, 
                website: Optional[str] = None, twitter: Optional[str] = None,
                instagram: Optional[str] = None, location: Optional[str] = None,
                email: Optional[str] = None) -> bool:
    """Create or update user with comprehensive validation"""
    try:
        db = get_firestore_client()
        if not db:
            logger.error("No Firestore client available")
            return False
        
        # Validate profile_image size if provided
        if profile_image and len(profile_image.encode('utf-8')) > 500000:  # ~500KB limit
            logger.warning(f"Profile image too large for user {wallet_address}, skipping image")
            profile_image = None
        
        # Check if profile is completed (display_name is not default wallet format)
        default_display_name = f"{wallet_address[:8]}...{wallet_address[-4:]}"
        profile_completed = display_name != default_display_name and display_name.strip() != ""
        
        # Check if username is already taken
        existing_user = db.collection('users').where('username', '==', username).limit(1).stream()
        if list(existing_user) and username != "":  # Allow empty username for wallet-only users
            logger.warning(f"Username {username} already taken")
            return False
        
        user_data = {
            'wallet_address': wallet_address,
            'username': username,
            'display_name': display_name,
            'profile_image': profile_image,
            'bio': bio,
            'website': website,
            'twitter': twitter,
            'instagram': instagram,
            'location': location,
            'email': email,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
            'is_deleted': False,
            'profile_completed': profile_completed
        }
        
        db.collection('users').document(wallet_address).set(user_data, merge=True)
        logger.info(f"✅ User created/updated successfully: {wallet_address}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to create user: {e}")
        return False

def get_user(wallet_address: str) -> Optional[Dict[str, Any]]:
    """Get user by wallet address"""
    try:
        db = get_firestore_client()
        if not db:
            return None
            
        doc = db.collection('users').document(wallet_address).get()
        if doc.exists:
            user_data = doc.to_dict()
            if user_data.get('is_deleted', False):
                return None
            return user_data
        return None
        
    except Exception as e:
        logger.error(f"❌ Failed to get user: {e}")
        return None

def update_user_profile(wallet_address: str, display_name: str, 
                       profile_image: Optional[str] = None, bio: Optional[str] = None, 
                       website: Optional[str] = None, twitter: Optional[str] = None,
                       instagram: Optional[str] = None, location: Optional[str] = None,
                       email: Optional[str] = None) -> bool:
    """Update user profile with validation"""
    try:
        db = get_firestore_client()
        if not db:
            return False
        
        # Validate profile_image size if provided
        if profile_image and len(profile_image.encode('utf-8')) > 500000:
            logger.warning(f"Profile image too large for user {wallet_address}, skipping image update")
            profile_image = None
        
        # Check if profile is completed
        default_display_name = f"{wallet_address[:8]}...{wallet_address[-4:]}"
        profile_completed = display_name != default_display_name and display_name.strip() != ""
        
        update_data = {
            'display_name': display_name,
            'updated_at': datetime.utcnow().isoformat(),
            'bio': bio,
            'website': website,
            'twitter': twitter,
            'instagram': instagram,
            'location': location,
            'email': email,
            'profile_completed': profile_completed
        }
        
        if profile_image:
            update_data['profile_image'] = profile_image
            
        db.collection('users').document(wallet_address).update(update_data)
        logger.info(f"✅ User profile updated: {wallet_address}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to update user profile: {e}")
        return False

def check_user_exists(wallet_address: str) -> bool:
    """Check if user exists and profile is completed"""
    try:
        user = get_user(wallet_address)
        return user is not None and user.get('profile_completed', False)
    except Exception as e:
        logger.error(f"❌ Failed to check user existence: {e}")
        return False

def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    """Get user by username"""
    try:
        db = get_firestore_client()
        if not db:
            return None
            
        users = db.collection('users').where('username', '==', username).where('is_deleted', '==', False).limit(1).stream()
        user_list = list(users)
        return user_list[0].to_dict() if user_list else None
        
    except Exception as e:
        logger.error(f"❌ Failed to get user by username: {e}")
        return None

# Post operations with improved error handling and pagination
def create_post(post_data: Dict[str, Any]) -> bool:
    """Create new post with validation"""
    try:
        db = get_firestore_client()
        if not db:
            return False
            
        # Validate content
        if (not post_data.get('text', '').strip() and 
            not post_data.get('image_url', '').strip()):
            logger.error("Post must have text, image, or both")
            return False
        
        # Add metadata
        post_data['created_at'] = datetime.utcnow().isoformat()
        post_data['updated_at'] = datetime.utcnow().isoformat()
        post_data['is_deleted'] = False
        post_data['likes'] = 0
        post_data['comments'] = 0
        post_data['tags'] = post_data.get('tags', [])
        post_data['location'] = post_data.get('location')
        
        db.collection('posts').document(post_data['post_id']).set(post_data)
        logger.info(f"✅ Post created successfully: {post_data['post_id']}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to create post: {e}")
        return False

def update_post(post_id: str, update_data: Dict[str, Any]) -> bool:
    """Update existing post"""
    try:
        db = get_firestore_client()
        if not db:
            return False
            
        # Validate content
        if (not update_data.get('text', '').strip() and 
            not update_data.get('image_url', '').strip()):
            logger.error("Post must have text, image, or both")
            return False
        
        update_data['updated_at'] = datetime.utcnow().isoformat()
        update_data['action_type'] = 1  # Edit action
        
        db.collection('posts').document(post_id).update(update_data)
        logger.info(f"✅ Post updated successfully: {post_id}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to update post: {e}")
        return False

def map_post_firestore_to_frontend(post: dict) -> dict:
    """Map Firestore post data to frontend format"""
    return {
        "id": post.get("post_id", ""),
        "content": post.get("text", ""),
        "image": post.get("image_url", ""),
        "timestamp": post.get("timestamp", post.get("created_at", "")),
        "author": {
            "address": post.get("wallet_address", ""),
            "displayName": post.get("display_name", "")
        },
        "likes": post.get("likes", 0),
        "comments": post.get("comments", 0),
        "post_hash": post.get("post_hash", ""),
        "solanaTxHash": post.get("solana_tx_hash", None),
        "is_deleted": post.get("is_deleted", False),
        "action_type": post.get("action_type", 0),
        "created_at": post.get("created_at", ""),
        "updated_at": post.get("updated_at", ""),
        # Add more fields as needed
    }

def map_post_firestore_to_backend(post: dict) -> dict:
    """Map Firestore post data to backend API format (PostOut model)"""
    return {
        "post_id": post.get("post_id", ""),
        "wallet_address": post.get("wallet_address", ""),
        "display_name": post.get("display_name", ""),
        "text": post.get("text", ""),
        "image_url": post.get("image_url", ""),
        "timestamp": post.get("timestamp", post.get("created_at", "")),
        "created_at": post.get("created_at", ""),
        "updated_at": post.get("updated_at", ""),
        "is_deleted": post.get("is_deleted", False),
        "likes": post.get("likes", 0),
        "comments": post.get("comments", 0),
        "solana_tx_hash": post.get("solana_tx_hash", None),
        "post_hash": post.get("post_hash", ""),
        "action_type": post.get("action_type", 0),
        "tags": post.get("tags", []),
        "location": post.get("location", None),
        "user_liked": False  # Default value, can be updated later
    }

def fetch_posts(limit: int = 50, start_after: Optional[str] = None, 
                wallet_address: Optional[str] = None, for_backend: bool = False) -> Tuple[List[Dict[str, Any]], bool]:
    """Fetch posts with pagination and filtering"""
    try:
        db = get_firestore_client()
        if not db:
            return [], False
        posts_ref = db.collection('posts').where('is_deleted', '==', False)
        if wallet_address:
            posts_ref = posts_ref.where('wallet_address', '==', wallet_address)
        posts_ref = posts_ref.order_by('created_at', direction=firestore.Query.DESCENDING)
        if start_after:
            posts_ref = posts_ref.start_after({"created_at": start_after})
        posts_ref = posts_ref.limit(limit + 1)
        posts_docs = list(posts_ref.stream())
        has_more = len(posts_docs) > limit
        
        # Use appropriate mapping based on target
        if for_backend:
            posts = [map_post_firestore_to_backend(doc.to_dict()) for doc in posts_docs[:limit]]
        else:
            posts = [map_post_firestore_to_frontend(doc.to_dict()) for doc in posts_docs[:limit]]
            
        logger.info(f"✅ Fetched {len(posts)} posts (has_more: {has_more})")
        return posts, has_more
    except Exception as e:
        logger.error(f"❌ Failed to fetch posts: {e}")
        return [], False

def get_user_posts(wallet_address: str, limit: int = 20, for_backend: bool = False) -> List[Dict[str, Any]]:
    posts, _ = fetch_posts(limit=limit, wallet_address=wallet_address, for_backend=for_backend)
    return posts

def get_post_by_id(post_id: str, for_backend: bool = False) -> Optional[Dict[str, Any]]:
    """Get single post by ID"""
    try:
        db = get_firestore_client()
        if not db:
            return None
            
        doc = db.collection('posts').document(post_id).get()
        if doc.exists:
            post_data = doc.to_dict()
            if post_data.get('is_deleted', False):
                return None
            
            # Use appropriate mapping based on target
            if for_backend:
                return map_post_firestore_to_backend(post_data)
            else:
                return post_data
        return None
        
    except Exception as e:
        logger.error(f"❌ Failed to get post: {e}")
        return None

def soft_delete_post(post_id: str) -> bool:
    """Soft delete post"""
    try:
        db = get_firestore_client()
        if not db:
            return False
            
        db.collection('posts').document(post_id).update({
            'is_deleted': True,
            'updated_at': datetime.utcnow().isoformat(),
            'action_type': 2  # Delete action
        })
        logger.info(f"✅ Post soft deleted: {post_id}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to delete post: {e}")
        return False

def update_post_likes(post_id: str, increment: bool = True) -> bool:
    """Update post likes count"""
    try:
        db = get_firestore_client()
        if not db:
            return False
            
        if increment:
            db.collection('posts').document(post_id).update({
                'likes': firestore.Increment(1),
                'updated_at': datetime.utcnow().isoformat()
            })
        else:
            db.collection('posts').document(post_id).update({
                'likes': firestore.Increment(-1),
                'updated_at': datetime.utcnow().isoformat()
            })
        logger.info(f"✅ Post likes updated: {post_id} ({'increment' if increment else 'decrement'})")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to update post likes: {e}")
        return False

# Comment operations
def create_comment(comment_data: Dict[str, Any]) -> bool:
    """Create new comment"""
    try:
        db = get_firestore_client()
        if not db:
            return False
            
        # Generate comment ID if not provided
        if 'comment_id' not in comment_data:
            comment_data['comment_id'] = str(uuid.uuid4())
        
        # Add metadata
        comment_data['created_at'] = datetime.utcnow().isoformat()
        comment_data['updated_at'] = datetime.utcnow().isoformat()
        comment_data['is_deleted'] = False
        comment_data['likes'] = 0
        
        # Create comment
        db.collection('comments').document(comment_data['comment_id']).set(comment_data)
        
        # Update post comment count
        db.collection('posts').document(comment_data['post_id']).update({
            'comments': firestore.Increment(1),
            'updated_at': datetime.utcnow().isoformat()
        })
        
        logger.info(f"✅ Comment created successfully: {comment_data['comment_id']}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to create comment: {e}")
        return False

def get_post_comments(post_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """Get comments for a post"""
    try:
        db = get_firestore_client()
        if not db:
            return []
            
        comments_ref = db.collection('comments').where('post_id', '==', post_id).where('is_deleted', '==', False)
        comments_ref = comments_ref.order_by('created_at', direction=firestore.Query.ASCENDING).limit(limit)
        
        comments = [doc.to_dict() for doc in comments_ref.stream()]
        logger.info(f"✅ Fetched {len(comments)} comments for post: {post_id}")
        return comments
        
    except Exception as e:
        logger.error(f"❌ Failed to fetch comments: {e}")
        return []

def update_comment_likes(comment_id: str, increment: bool = True) -> bool:
    """Update comment likes count"""
    try:
        db = get_firestore_client()
        if not db:
            return False
            
        if increment:
            db.collection('comments').document(comment_id).update({
                'likes': firestore.Increment(1),
                'updated_at': datetime.utcnow().isoformat()
            })
        else:
            db.collection('comments').document(comment_id).update({
                'likes': firestore.Increment(-1),
                'updated_at': datetime.utcnow().isoformat()
            })
        logger.info(f"✅ Comment likes updated: {comment_id}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to update comment likes: {e}")
        return False

def delete_comment(comment_id: str) -> bool:
    """Soft delete comment"""
    try:
        db = get_firestore_client()
        if not db:
            return False
            
        # Get comment to update post count
        comment_doc = db.collection('comments').document(comment_id).get()
        if comment_doc.exists:
            comment_data = comment_doc.to_dict()
            post_id = comment_data.get('post_id')
            
            # Soft delete comment
            db.collection('comments').document(comment_id).update({
                'is_deleted': True,
                'updated_at': datetime.utcnow().isoformat()
            })
            
            # Update post comment count
            if post_id:
                db.collection('posts').document(post_id).update({
                    'comments': firestore.Increment(-1),
                    'updated_at': datetime.utcnow().isoformat()
                })
        
        logger.info(f"✅ Comment deleted: {comment_id}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to delete comment: {e}")
        return False

def clear_all_collections():
    """Clear all collections from Firestore (for testing)"""
    try:
        db = get_firestore_client()
        if not db:
            return False
        
        # Clear posts collection
        posts_ref = db.collection('posts')
        for doc in posts_ref.stream():
            doc.reference.delete()
        
        # Clear users collection
        users_ref = db.collection('users')
        for doc in users_ref.stream():
            doc.reference.delete()
        
        # Clear comments collection
        comments_ref = db.collection('comments')
        for doc in comments_ref.stream():
            doc.reference.delete()
        
        logger.info("✅ All collections cleared successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to clear collections: {e}")
        return False

# Initialize Firebase on module import
if not firebase_initialized:
    initialize_firebase()
    test_firestore_connection() 