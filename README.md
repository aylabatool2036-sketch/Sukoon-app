# Sukoon 🌙

A mental wellness and emotional support application built with React, Firebase, and AI integration.

## Overview

Sukoon is a comprehensive mental health companion app that provides users with guided emotional support, AI-powered chat assistance, and personalized wellness tracking. The application combines modern web technologies with thoughtful UX design to create a calming and supportive digital sanctuary.

## Features

- 🤖 **AI-Powered Chat** - Intelligent conversational support using Groq SDK
- 🏠 **Guided Home Flow** - Structured onboarding and wellness journey
- 🧘 **Calm Sanctuary** - Dedicated space for mindfulness and relaxation
- 📝 **Future Me** - Goal setting and reflection tools
- 🔐 **Firebase Authentication** - Secure user authentication and data management
- 📱 **Mobile Support** - Capacitor integration for Android deployment
- 🌐 **Multilingual** - Built-in translation support

## Tech Stack

### Frontend
- **React 19** - UI library
- **TypeScript** - Type-safe development
- **Vite** - Build tool and dev server
- **Tailwind CSS 4** - Utility-first styling
- **Motion** - Animation library
- **Zustand** - State management
- **Lucide React** - Icon system

### Backend & Services
- **Express** - Node.js web server
- **Firebase** - Authentication and Firestore database
- **Groq SDK** - AI chat integration
- **Express Rate Limit** - API protection

### Mobile
- **Capacitor** - Cross-platform native runtime
- **Android Support** - Native Android app

## Prerequisites

- Node.js (v18 or higher)
- pnpm (recommended) or npm
- Firebase account
- Groq API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/aylabatool2036-sketch/Sukoon.git
cd Sukoon
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file with:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

GROQ_API_KEY=your_groq_api_key
GROQ_CHAT_MODEL=llama-3.3-70b-versatile
GROQ_REASSURANCE_MODEL=llama-3.3-70b-versatile
```

## Development

Start the development server:
```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

## Building

Create a production build:
```bash
pnpm build
```

Preview the production build:
```bash
pnpm preview
```

## Mobile Development

### Android

1. Build the web assets:
```bash
pnpm build
```

2. Sync with Capacitor:
```bash
npx cap sync android
```

3. Open in Android Studio:
```bash
npx cap open android
```

## Project Structure

```
sukoon_app/
├── src/
│   ├── components/      # Reusable UI components
│   │   └── ui/         # Base UI components (Button, Card, Input)
│   ├── features/       # Feature-based modules
│   │   ├── calm/       # Calm Sanctuary feature
│   │   ├── chat/       # AI Chat feature
│   │   └── home/       # Home & Timeline
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility libraries
│   ├── services/       # API & external services
│   ├── store/          # Zustand state management
│   ├── types/          # TypeScript type definitions
│   └── translations.ts # i18n translations
├── public/             # Static assets
├── android/            # Android native project
├── server.ts           # Express backend server
└── firestore.rules     # Firestore security rules
```

## Scripts

- `pnpm dev` - Start development server with backend
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Type check with TypeScript
- `pnpm clean` - Remove build artifacts

## Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Copy your Firebase config to `.env`
5. Deploy Firestore rules:
```bash
firebase deploy --only firestore:rules
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is private and proprietary.

## Support

For support, please open an issue in the GitHub repository.

---

Built with ❤️ for mental wellness
