# FridgeWiseAI Project Overview

## Purpose
FridgeWiseAI is a multilingual (English/Italian) mobile and web application that analyzes food photos to identify ingredients and generate recipes using AI.

## Key Features
- Photo analysis to identify ingredients
- AI-powered recipe generation
- Multilingual support (English/Italian)
- Cross-platform mobile app (iOS/Android)
- Web application
- Recipe storage and history
- User profiles and preferences

## Architecture
The project follows a full-stack architecture with:
- **Backend**: Node.js/Express REST API with MongoDB
- **Frontend Mobile**: React Native with Expo
- **Frontend Web**: React
- **AI Services**: Google Gemini AI for recipe generation, Recognize Anything API for image recognition

## Project Structure
```
fridgewiseaiapp/
├── backend/              # Backend API server (TypeScript)
├── frontend/mobile/      # React Native app
├── frontend/web/         # React web app  
├── localization/         # Translation files
└── scripts/             # Utility scripts
```