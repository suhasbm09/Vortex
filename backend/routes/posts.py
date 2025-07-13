from fastapi import APIRouter, HTTPException, status, Query, Path
from models.post import (
    PostCreate, PostOut, PostUpdate, CommentCreate, CommentOut,
    PostResponse, PostListResponse, CommentResponse, CommentListResponse
)
from services.firebase import (
    create_post, fetch_posts, soft_delete_post, get_user_posts, update_post_likes,
    update_post, get_post_by_id, create_comment, get_post_comments,
    update_comment_likes, delete_comment, clear_all_collections
)
from typing import Optional, List
import logging
from routes.ai import verify_post
from services.openrouter_client import call_openrouter

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/create", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_new_post(post: PostCreate):
    """
    Create a new post with text, image, or both, with AI moderation
    """
    try:
        # Validate content
        if (not post.text or post.text.strip() == "") and (not post.image_url or post.image_url.strip() == ""):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Post must have text, image, or both."
            )
        # Validate image size if provided
        if post.image_url and len(post.image_url.encode('utf-8')) > 1048487:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image is too large. Please upload an image smaller than 1MB."
            )
        # --- AI Moderation ---
        ai_result = await call_openrouter(post.text)
        trust_score = ai_result.get('trust_score', 50)
        trust_tag = ai_result.get('trust_tag', '🟡')
        ai_explanation = ai_result.get('explanation', 'AI moderation unavailable')
        # Only allow posts with trust_score >= 60
        if trust_score < 60:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Post rejected by AI moderation. Trust score: {trust_score}. Explanation: {ai_explanation}"
            )
        # Save post with AI moderation fields
        post_data = post.dict()
        post_data["ai_verified"] = trust_score >= 90
        post_data["ai_trust_score"] = trust_score
        post_data["ai_explanation"] = ai_explanation
        success = create_post(post_data)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create post. Please try again."
            )
        # Get created post
        created_post = get_post_by_id(post.post_id, for_backend=True)
        if not created_post:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Post created but could not be retrieved"
            )
        return PostResponse(
            success=True,
            message="Post created successfully",
            post=PostOut(**created_post)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating post: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during post creation"
        )

@router.get("/feed", response_model=List[PostOut])
async def get_post_feed(
    limit: int = Query(20, ge=1, le=100, description="Number of posts to fetch"),
    start_after: Optional[str] = Query(None, description="Cursor for pagination")
):
    """
    Get paginated feed of all posts
    """
    try:
        posts, _ = fetch_posts(limit=limit, start_after=start_after, for_backend=True)
        
        return posts
        
    except Exception as e:
        logger.error(f"Error fetching post feed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while fetching posts"
        )

@router.get("/all", response_model=List[PostOut])
async def get_all_posts(
    limit: int = Query(50, ge=1, le=100, description="Number of posts to fetch"),
    start_after: Optional[str] = Query(None, description="Cursor for pagination")
):
    """
    Get all posts (alias for /feed endpoint)
    """
    posts, _ = fetch_posts(limit=limit, start_after=start_after, for_backend=True)
    return posts

@router.get("/user/{wallet_address}", response_model=PostListResponse)
async def get_user_posts_route(
    wallet_address: str = Path(..., min_length=32, max_length=44),
    limit: int = Query(20, ge=1, le=100, description="Number of posts to fetch")
):
    """
    Get posts by specific user
    """
    try:
        posts = get_user_posts(wallet_address, limit=limit, for_backend=True)
        
        return PostListResponse(
            success=True,
            posts=posts,  # posts are already in PostOut format from fetch_posts
            total=len(posts),
            has_more=len(posts) == limit
        )
        
    except Exception as e:
        logger.error(f"Error fetching user posts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while fetching user posts"
        )

@router.get("/{post_id}", response_model=PostResponse)
async def get_post(post_id: str = Path(..., min_length=1, max_length=100)):
    """
    Get a specific post by ID
    """
    try:
        post = get_post_by_id(post_id, for_backend=True)
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )
        
        return PostResponse(
            success=True,
            message="Post retrieved successfully",
            post=PostOut(**post)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting post: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while retrieving post"
        )

@router.put("/{post_id}", response_model=PostResponse)
async def edit_post(
    post_update: PostUpdate,
    post_id: str = Path(..., min_length=1, max_length=100)
):
    """
    Edit an existing post
    """
    try:
        # Check if post exists
        existing_post = get_post_by_id(post_id, for_backend=True)
        if not existing_post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )
        
        # Update post
        success = update_post(post_id, post_update.dict(exclude_unset=True))
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update post. Please try again."
            )
        
        # Get updated post
        updated_post = get_post_by_id(post_id, for_backend=True)
        if not updated_post:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Post updated but could not be retrieved"
            )
        
        return PostResponse(
            success=True,
            message="Post updated successfully",
            post=PostOut(**updated_post)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating post: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while updating post"
        )

@router.delete("/{post_id}", response_model=dict)
async def delete_post(post_id: str = Path(..., min_length=1, max_length=100)):
    """
    Soft delete a post
    """
    try:
        # Check if post exists
        existing_post = get_post_by_id(post_id, for_backend=True)
        if not existing_post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )
        
        success = soft_delete_post(post_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete post. Please try again."
            )
        
        return {
            "success": True,
            "message": "Post deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting post: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while deleting post"
        )

@router.post("/{post_id}/like", response_model=dict)
async def like_post(post_id: str = Path(..., min_length=1, max_length=100)):
    """
    Like a post
    """
    try:
        # Check if post exists
        existing_post = get_post_by_id(post_id, for_backend=True)
        if not existing_post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )
        
        success = update_post_likes(post_id, increment=True)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to like post. Please try again."
            )
        
        return {
            "success": True,
            "message": "Post liked successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error liking post: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while liking post"
        )

@router.post("/{post_id}/unlike", response_model=dict)
async def unlike_post(post_id: str = Path(..., min_length=1, max_length=100)):
    """
    Unlike a post
    """
    try:
        # Check if post exists
        existing_post = get_post_by_id(post_id, for_backend=True)
        if not existing_post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )
        
        success = update_post_likes(post_id, increment=False)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to unlike post. Please try again."
            )
        
        return {
            "success": True,
            "message": "Post unliked successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unliking post: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while unliking post"
        )

# Comment endpoints
@router.post("/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_post_comment(
    comment: CommentCreate,
    post_id: str = Path(..., min_length=1, max_length=100)
):
    """
    Create a comment on a post
    """
    try:
        # Check if post exists
        existing_post = get_post_by_id(post_id, for_backend=True)
        if not existing_post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )
        
        # Set post_id from path
        comment.post_id = post_id
        
        # Create comment
        success = create_comment(comment.dict())
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create comment. Please try again."
            )
        
        return CommentResponse(
            success=True,
            message="Comment created successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating comment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during comment creation"
        )

@router.get("/{post_id}/comments", response_model=CommentListResponse)
async def get_post_comments_route(
    post_id: str = Path(..., min_length=1, max_length=100),
    limit: int = Query(50, ge=1, le=100, description="Number of comments to fetch")
):
    """
    Get comments for a post
    """
    try:
        # Check if post exists
        existing_post = get_post_by_id(post_id, for_backend=True)
        if not existing_post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )
        
        comments = get_post_comments(post_id, limit=limit)
        
        return CommentListResponse(
            success=True,
            comments=[CommentOut(**comment) for comment in comments],
            total=len(comments)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching comments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while fetching comments"
        )

@router.post("/comments/{comment_id}/like", response_model=dict)
async def like_comment(comment_id: str = Path(..., min_length=1, max_length=100)):
    """
    Like a comment
    """
    try:
        success = update_comment_likes(comment_id, increment=True)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to like comment. Please try again."
            )
        
        return {
            "success": True,
            "message": "Comment liked successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error liking comment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while liking comment"
        )

@router.post("/comments/{comment_id}/unlike", response_model=dict)
async def unlike_comment(comment_id: str = Path(..., min_length=1, max_length=100)):
    """
    Unlike a comment
    """
    try:
        success = update_comment_likes(comment_id, increment=False)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to unlike comment. Please try again."
            )
        
        return {
            "success": True,
            "message": "Comment unliked successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unliking comment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while unliking comment"
        )

@router.delete("/comments/{comment_id}", response_model=dict)
async def delete_comment_route(comment_id: str = Path(..., min_length=1, max_length=100)):
    """
    Delete a comment
    """
    try:
        success = delete_comment(comment_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete comment. Please try again."
            )
        
        return {
            "success": True,
            "message": "Comment deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting comment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while deleting comment"
        )

@router.delete("/clear-all", response_model=dict)
async def clear_all_data():
    """
    Clear all data from database (for testing only)
    """
    try:
        success = clear_all_collections()
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to clear database"
            )
        
        return {
            "success": True,
            "message": "All data cleared successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error clearing data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while clearing data"
        )
