from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import logging
import os
from datetime import datetime
from dotenv import load_dotenv
from contextlib import asynccontextmanager

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('vortex_backend.log')
    ]
)
logger = logging.getLogger(__name__)

# Environment configuration
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DEBUG = ENVIRONMENT == "development"
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "*").split(",")

# CORS settings
CORS_ORIGINS = [
    "http://localhost:5173",  # Vite local dev
    "http://127.0.0.1:5173",
    "http://localhost:3000",  # Alternative dev port
    "http://127.0.0.1:3000",
    # Add production URLs here
]

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 Starting VORTEX Backend...")
    logger.info(f"Environment: {ENVIRONMENT}")
    logger.info(f"Debug mode: {DEBUG}")
    
    # Test Firebase connection
    try:
        from services.firebase import test_firestore_connection
        if test_firestore_connection():
            logger.info("✅ Firebase connection established")
        else:
            logger.error("❌ Firebase connection failed")
    except Exception as e:
        logger.error(f"❌ Firebase initialization error: {e}")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down VORTEX Backend...")

# Initialize app
app = FastAPI(
    title="VORTEX Backend API",
    description="Decentralized social media backend powered by FastAPI + Firebase Firestore",
    version="1.0.0",
    debug=DEBUG,
    lifespan=lifespan
)

# Security middleware
if ENVIRONMENT == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=ALLOWED_HOSTS
    )

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Global exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal server error. Please try again later.",
            "timestamp": datetime.utcnow().isoformat(),
            "path": str(request.url)
        }
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning(f"HTTP error {exc.status_code}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "timestamp": datetime.utcnow().isoformat(),
            "path": str(request.url)
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    # Convert all errors to string for JSON serialization
    errors = exc.errors()
    for err in errors:
        if 'ctx' in err and 'error' in err['ctx']:
            err['ctx']['error'] = str(err['ctx']['error'])
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": errors},
    )

# Health check endpoint
@app.get("/ping", tags=["Health"])
async def health_check():
    """Health check endpoint to verify service status"""
    try:
        from services.firebase import get_firestore_client, test_firestore_connection
        db = get_firestore_client()
        db_status = "connected" if db and test_firestore_connection() else "disconnected"
    except Exception as e:
        logger.error(f"Health check Firebase error: {e}")
        db_status = "error"
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": ENVIRONMENT,
        "firebase": db_status,
        "message": "VORTEX backend is live! 🚀"
    }

# API versioning
@app.get("/api/v1/status", tags=["API"])
async def api_status():
    """API status endpoint"""
    return {
        "version": "1.0.0",
        "status": "active",
        "timestamp": datetime.utcnow().isoformat()
    }

# Import and register routers
from routes.users import router as user_router
from routes.posts import router as post_router
from routes import ai

# Register routers with versioning
app.include_router(
    user_router, 
    prefix="/api/users", 
    tags=["Users"],
    responses={404: {"description": "Not found"}}
)

app.include_router(
    post_router, 
    prefix="/api/posts", 
    tags=["Posts"],
    responses={404: {"description": "Not found"}}
)

app.include_router(ai.router, prefix="/ai")

# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Welcome to VORTEX Backend API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/ping",
        "timestamp": datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=DEBUG,
        log_level="info"
    )
