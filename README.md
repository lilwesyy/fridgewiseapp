# FridgeWiseAI

A multilingual (English/Italian) mobile and web application that analyzes food photos to identify ingredients and generate recipes using AI.

## Features

- 📸 Photo analysis to identify ingredients
- 🤖 AI-powered recipe generation
- 🌍 Multilingual support (English/Italian)
- 📱 Cross-platform mobile app (iOS/Android)
- 🌐 Web application
- 💾 Recipe storage and history
- 👤 User profiles and preferences

## Tech Stack

### Frontend
- **Mobile**: React Native with Expo
- **Web**: React
- **Language**: TypeScript
- **Internationalization**: react-i18next

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Language**: TypeScript

### AI Services
- **Image Recognition**: Recognize Anything API
- **Recipe Generation**: Google Gemini AI

## Project Structure

```
fridgewiseaiapp/
├── backend/              # Backend API server
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── models/       # MongoDB models
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Custom middleware
│   │   └── utils/        # Utility functions
│   └── tests/           # Backend tests
├── frontend/
│   ├── mobile/          # React Native app
│   ├── web/             # React web app
│   └── shared/          # Shared components
├── localization/        # Translation files
└── docs/               # Documentation
```

## Getting Started

### Prerequisites
- Node.js 18+
- Docker (for AI services)
- MongoDB
- Expo CLI (`npm install -g @expo/cli`)

### Installation

1. Install dependencies:
   ```bash
   # Backend
   cd backend
   npm install
   
   # Mobile
   cd frontend/mobile
   npm install
   
   # Web
   cd frontend/web
   npm install
   ```

2. Setup environment variables:
   ```bash
   # Copy example files
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/mobile/.env.example frontend/mobile/.env
   ```

3. Configure your API keys in the .env files:
   - `GEMINI_API_KEY`: Get from Google AI Studio
   - `MONGODB_URI`: MongoDB connection string
   - `JWT_SECRET`: Random secret for JWT tokens

4. Start the services:
   ```bash
   # Start Docker services (MongoDB + AI recognition)
   ./scripts/start-services.sh
   
   # Or manually:
   docker-compose up -d
   ```

5. Start the development servers:
   ```bash
   # Backend API (Terminal 1)
   cd backend && npm run dev
   
   # Mobile App (Terminal 2)
   cd frontend/mobile && npm start
   
   # Web App (Terminal 3)
   cd frontend/web && npm start
   ```

### First Run Setup

1. Create a test user:
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
   ```

2. Access the applications:
   - **Mobile**: Use Expo Go app and scan QR code
   - **Web**: Open http://localhost:3000
   - **API**: http://localhost:3000/health

### API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/analysis/image` - Analyze photo for ingredients
- `POST /api/recipe/generate` - Generate recipe from ingredients
- `GET /api/recipes` - Get user's recipes

### Docker Services

- **MongoDB**: `mongodb://localhost:27017/fridgewiseai`
- **Recognize API**: `http://localhost:8000` (GPU) or `http://localhost:8001` (CPU)

### Troubleshooting

1. **Permission Issues**: Make sure Docker has proper permissions
2. **GPU Issues**: Use CPU-only version: `docker-compose --profile cpu up`
3. **Port Conflicts**: Check if ports 3000, 8000, 27017 are free
4. **Camera Issues**: Ensure proper permissions on mobile device

## License

MIT