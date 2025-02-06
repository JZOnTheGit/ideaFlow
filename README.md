# IdeaFlow - AI Content Generation Platform

![IdeaFlow Logo](path/to/logo.png)

## 🌟 [Live Demo](https://ideaflow.uk)

IdeaFlow is a powerful AI-driven platform that transforms your PDF documents and website content into engaging social media content for multiple platforms.

## ✨ Features

### 📱 Multi-Platform Content Generation
- **Twitter Posts**: Generate engaging tweets from your content
- **YouTube Scripts**: Create video scripts optimized for YouTube
- **TikTok Content**: Transform your content into TikTok-friendly formats

### 📄 Document Processing
- **PDF Upload**: Upload and process PDF documents
- **Website Links**: Extract and process content from websites
- **Smart Content Extraction**: Advanced text extraction and processing

### 💎 Subscription Tiers

#### Free Plan
- 2 PDF uploads per day
- 1 website link per day
- 1 generation per content type
- Basic features access

#### Pro Plan
- 80 PDF uploads per month
- 50 website uploads per month
- 3 generations per content type
- Priority support
- Advanced features

### 🛡️ Security & Privacy
- Secure Firebase Authentication
- Protected API endpoints
- Stripe secure payments
- Data encryption

### 💫 User Experience
- Drag and drop file upload
- Real-time processing status
- Usage tracking dashboard
- Responsive design
- Intuitive interface

## 🚀 Technology Stack

- **Frontend**: React.js with Styled Components
- **Backend**: Node.js with Express
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Payments**: Stripe Integration
- **AI Processing**: Advanced AI Models
- **Hosting**: Vercel

## 🔒 Security

IdeaFlow implements industry-standard security practices:
- JWT Authentication
- Secure API endpoints
- CORS protection
- Environment variable protection
- Rate limiting

## 🎯 Use Cases

- Content Creators
- Digital Marketers
- Social Media Managers
- Business Owners
- Content Teams
- Freelancers

## 📈 Future Updates

- Enhanced UI/UX improvements
- Additional social media platforms
- Advanced analytics
- Team collaboration features
- Custom AI model training

## 🤝 Support

For support, email jass150505@gmail.com

## 📝 License

Copyright © 2024 IdeaFlow. All rights reserved.

---

<p align="center">Made with ❤️ by the IdeaFlow Team</p>

## 🚀 Getting Started

### Environment Setup
1. Copy `.env.example` to `.env`
2. Fill in your environment variables
3. For server setup, copy `ideaflow-server/.env.example` to `ideaflow-server/.env`
4. Add your Firebase service account key to `ideaflow-server/serviceAccountKey.json`

### Required Environment Variables
The following environment variables are required to run the application:

#### Frontend (.env)
- REACT_APP_FIREBASE_* (Firebase configuration)
- REACT_APP_STRIPE_* (Stripe public keys)
- REACT_APP_COHERE_API_KEY (Cohere API key)

#### Backend (ideaflow-server/.env)
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- FIREBASE_* (Firebase Admin SDK configuration)

## 🔐 Security Notice

Never commit sensitive environment files or API keys to the repository. The following files are ignored and should be kept secure:
- All `.env` files
- `serviceAccountKey.json`
- Any files containing API keys or secrets

Make sure to properly set up your environment variables in your deployment platform's settings.
