# VORTEX Backend API

A decentralized social media backend powered by FastAPI and Firebase Firestore.

## 🚀 Features

- **User Management**: Registration, profile updates, and authentication
- **Post Management**: Create, read, update, delete posts with images
- **Comment System**: Full comment functionality with nested replies
- **Like System**: Like/unlike posts and comments
- **Real-time Database**: Firebase Firestore integration
- **RESTful API**: Clean, documented API endpoints
- **Error Handling**: Comprehensive error handling and validation
- **Pagination**: Efficient pagination for large datasets
- **Security**: Input validation and sanitization

## 📋 Prerequisites

- Python 3.8+
- Firebase project with Firestore enabled
- Firebase service account key

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore Database
   - Generate a service account key:
     - Go to Project Settings > Service Accounts
     - Click "Generate new private key"
     - Save as `serviceAccount.json` in the backend directory

5. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase configuration
   ```

## ⚙️ Configuration

Create a `.env` file with the following variables:

```env
# Environment
ENVIRONMENT=development
DEBUG=true

# Firebase
FIREBASE_SERVICE_ACCOUNT_PATH=serviceAccount.json
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com

# Server
HOST=0.0.0.0
PORT=8000
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Logging
LOG_LEVEL=INFO
LOG_FILE=vortex_backend.log
```

## 🤖 AI Moderation API

### .env
```
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### Endpoint
- `POST /ai/verify-content` — Moderate post content using OpenRouter LLM
  - Request: `{ "text": "..." }`
  - Response: `{ "trust_score": 0-100, "trust_tag": "🟢/🟡/🔴", "explanation": "..." }`

## 🚀 Running the Server

### Development Mode
```bash
python start.py
```

### Production Mode
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

### With Docker
```bash
docker build -t vortex-backend .
docker run -p 8000:8000 vortex-backend
```

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/ping

## 🔌 API Endpoints

### Users
- `POST /api/users/register` - Register new user
- `GET /api/users/me/{wallet_address}` - Get user profile
- `GET /api/users/username/{username}` - Get user by username
- `PUT /api/users/profile/{wallet_address}` - Update user profile
- `GET /api/users/check/{wallet_address}` - Check profile completion
- `DELETE /api/users/{wallet_address}` - Delete user account

### Posts
- `POST /api/posts/create` - Create new post
- `GET /api/posts/feed` - Get paginated feed
- `GET /api/posts/all` - Get all posts (alias for feed)
- `GET /api/posts/user/{wallet_address}` - Get user posts
- `GET /api/posts/{post_id}` - Get specific post
- `PUT /api/posts/{post_id}` - Edit post
- `DELETE /api/posts/{post_id}` - Delete post
- `POST /api/posts/{post_id}/like` - Like post
- `POST /api/posts/{post_id}/unlike` - Unlike post

### Comments
- `POST /api/posts/{post_id}/comments` - Create comment
- `GET /api/posts/{post_id}/comments` - Get post comments
- `POST /api/posts/comments/{comment_id}/like` - Like comment
- `POST /api/posts/comments/{comment_id}/unlike` - Unlike comment
- `DELETE /api/posts/comments/{comment_id}` - Delete comment

## 🗄️ Database Schema

### Users Collection
```json
{
  "wallet_address": "string",
  "username": "string",
  "display_name": "string",
  "profile_image": "string?",
  "bio": "string?",
  "website": "string?",
  "twitter": "string?",
  "instagram": "string?",
  "location": "string?",
  "email": "string?",
  "created_at": "datetime",
  "updated_at": "datetime",
  "is_deleted": "boolean",
  "profile_completed": "boolean"
}
```

### Posts Collection
```json
{
  "post_id": "string",
  "wallet_address": "string",
  "display_name": "string",
  "text": "string",
  "image_url": "string?",
  "timestamp": "datetime",
  "created_at": "datetime",
  "updated_at": "datetime",
  "is_deleted": "boolean",
  "likes": "number",
  "comments": "number",
  "solana_tx_hash": "string?",
  "post_hash": "string",
  "action_type": "number",
  "tags": "array",
  "location": "string?"
}
```

### Comments Collection
```json
{
  "comment_id": "string",
  "post_id": "string",
  "wallet_address": "string",
  "display_name": "string",
  "text": "string",
  "created_at": "datetime",
  "updated_at": "datetime",
  "is_deleted": "boolean",
  "likes": "number",
  "parent_comment_id": "string?"
}
```

## 🔧 Development

### Project Structure
```
backend/
├── main.py              # FastAPI application
├── start.py             # Startup script
├── requirements.txt     # Dependencies
├── serviceAccount.json  # Firebase credentials
├── models/              # Pydantic models
│   ├── user.py
│   └── post.py
├── routes/              # API routes
│   ├── users.py
│   └── posts.py
├── services/            # Business logic
│   └── firebase.py
└── utils/               # Utility functions
```

### Adding New Endpoints

1. **Create model** in `models/`
2. **Add service function** in `services/firebase.py`
3. **Create route** in `routes/`
4. **Register route** in `main.py`

### Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=.

# Run specific test
pytest tests/test_users.py
```

## 🚀 Deployment

### Docker
```bash
docker build -t vortex-backend .
docker run -p 8000:8000 -e ENVIRONMENT=production vortex-backend
```

### Heroku
```bash
heroku create vortex-backend
heroku config:set ENVIRONMENT=production
git push heroku main
```

### AWS/GCP
- Use containerized deployment
- Set up environment variables
- Configure Firebase credentials
- Set up monitoring and logging

## 📊 Monitoring

- **Health Check**: `/ping` endpoint
- **Connection Status**: `/api/users/status/connection`
- **Logs**: Check `vortex_backend.log`

## 🔒 Security

- Input validation with Pydantic
- CORS configuration
- Rate limiting (can be added)
- Authentication (can be added)
- HTTPS in production
 