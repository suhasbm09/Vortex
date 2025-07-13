from fastapi import APIRouter, HTTPException, status, Query, Path
from models.user import UserCreate, UserOut, UserProfileUpdate, UserResponse, UserListResponse
from services.firebase import (
    create_user, get_user, update_user_profile, check_user_exists, 
    get_user_by_username, get_connection_status
)
from typing import Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate):
    """
    Register a new user with wallet address and profile information
    """
    try:
        # Check if user already exists
        existing_user = get_user(user.wallet_address)
        if existing_user:
            return UserResponse(
                success=False,
                message="User already exists",
                user=UserOut(**existing_user)
            )
        
        # Create user
        success = create_user(
            wallet_address=user.wallet_address,
            username=user.username,
            display_name=user.display_name,
            profile_image=user.profile_image,
            bio=user.bio,
            website=user.website,
            twitter=user.twitter,
            instagram=user.instagram,
            location=user.location,
            email=user.email
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user. Please try again."
            )
        
        # Get created user
        created_user = get_user(user.wallet_address)
        if not created_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="User created but could not be retrieved"
            )
        
        return UserResponse(
            success=True,
            message="User registered successfully",
            user=UserOut(**created_user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during user registration"
        )

@router.get("/me/{wallet_address}", response_model=UserResponse)
async def get_user_profile(wallet_address: str = Path(..., min_length=32, max_length=44)):
    """
    Get user profile by wallet address - auto-creates if doesn't exist
    """
    try:
        user = get_user(wallet_address)
        if not user:
            # Auto-create new user with default values
            logger.info(f"Auto-creating new user: {wallet_address}")
            success = create_user(
                wallet_address=wallet_address,
                username="",  # Empty username for wallet-only users
                display_name=f"{wallet_address[:8]}...{wallet_address[-4:]}",  # Default display name
                profile_image=None,
                bio=None,
                website=None,
                twitter=None,
                instagram=None,
                location=None,
                email=None
            )
            
            if not success:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create new user"
                )
            
            # Get the newly created user
            user = get_user(wallet_address)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="User created but could not be retrieved"
                )
            
            return UserResponse(
                success=True,
                message="New user created successfully",
                user=UserOut(**user)
            )
        
        return UserResponse(
            success=True,
            message="User profile retrieved successfully",
            user=UserOut(**user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while retrieving user profile"
        )

@router.get("/username/{username}", response_model=UserResponse)
async def get_user_by_username_route(username: str = Path(..., min_length=3, max_length=30)):
    """
    Get user profile by username
    """
    try:
        user = get_user_by_username(username)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserResponse(
            success=True,
            message="User profile retrieved successfully",
            user=UserOut(**user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user by username: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while retrieving user profile"
        )

@router.put("/profile/{wallet_address}", response_model=UserResponse)
async def update_profile(
    profile: UserProfileUpdate,
    wallet_address: str = Path(..., min_length=32, max_length=44)
):
    """
    Update user profile information
    """
    try:
        # Check if user exists
        existing_user = get_user(wallet_address)
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update profile
        success = update_user_profile(
            wallet_address=wallet_address,
            display_name=profile.display_name,
            profile_image=profile.profile_image,
            bio=profile.bio,
            website=profile.website,
            twitter=profile.twitter,
            instagram=profile.instagram,
            location=profile.location,
            email=profile.email
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update profile. Please try again."
            )
        
        # Get updated user
        updated_user = get_user(wallet_address)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Profile updated but could not be retrieved"
            )
        
        return UserResponse(
            success=True,
            message="Profile updated successfully",
            user=UserOut(**updated_user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while updating profile"
        )

@router.get("/check/{wallet_address}", response_model=dict)
async def check_profile_completion(wallet_address: str = Path(..., min_length=32, max_length=44)):
    """
    Check if user profile is completed
    """
    try:
        exists = check_user_exists(wallet_address)
        return {
            "success": True,
            "profile_completed": exists,
            "message": "Profile completion status checked successfully"
        }
        
    except Exception as e:
        logger.error(f"Error checking profile completion: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while checking profile completion"
        )

@router.delete("/{wallet_address}", response_model=dict)
async def delete_user(wallet_address: str = Path(..., min_length=32, max_length=44)):
    """
    Soft delete user account
    """
    try:
        # Check if user exists
        existing_user = get_user(wallet_address)
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Soft delete user (mark as deleted)
        from services.firebase import get_firestore_client
        db = get_firestore_client()
        if not db:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection error"
            )
        
        db.collection('users').document(wallet_address).update({
            'is_deleted': True,
            'updated_at': '2025-01-08T12:00:00Z'  # Use proper datetime
        })
        
        return {
            "success": True,
            "message": "User account deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while deleting user account"
        )

@router.get("/status/connection", response_model=dict)
async def get_connection_status_route():
    """
    Get database connection status
    """
    try:
        status_info = get_connection_status()
        return {
            "success": True,
            "connection": status_info,
            "message": "Connection status retrieved successfully"
        }
        
    except Exception as e:
        logger.error(f"Error getting connection status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while checking connection status"
        )
