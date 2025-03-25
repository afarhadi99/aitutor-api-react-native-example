![AI Tutor API Logo](https://raw.githubusercontent.com/Tech-in-Schools-Initiative/aitutor-api-saas-starter/main/public/logo-long.png)

# AI Tutor API React Native Example

A comprehensive React Native mobile application demonstrating the integration and usage of AI Tutor API and AI Tutor RAG API for building intelligent, conversational experiences.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Screens](#screens)
  - [Home Screen](#home-screen)
  - [Workflow Screen](#workflow-screen)
  - [Chatbot Screen](#chatbot-screen)
  - [Streaming Screen](#streaming-screen)
  - [Streaming RAG Screen](#streaming-rag-screen)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
  - [Running the Development Server](#running-the-development-server)
- [Android Development](#android-development)
  - [Running on Android Emulator](#running-on-android-emulator)
  - [Running on Physical Android Device](#running-on-physical-android-device)
  - [Building for Production](#building-for-production)
  - [Publishing to Google Play Store](#publishing-to-google-play-store)
- [iOS Development](#ios-development)
  - [Running on iOS Simulator](#running-on-ios-simulator)
  - [Running on Physical iOS Device](#running-on-physical-ios-device)
  - [Building for Production](#building-for-production-ios)
  - [Publishing to App Store](#publishing-to-app-store)
- [Project Structure](#project-structure)
- [Customization](#customization)
- [Troubleshooting](#troubleshooting)

## Overview

This project serves as a reference implementation for integrating AI Tutor API's capabilities into a mobile application. It demonstrates how to leverage AI-powered workflows, chatbots, streaming responses, and Retrieval Augmented Generation (RAG) to create engaging and intelligent user experiences.

<div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin: 20px 0;">
  <img src="https://img.mytsi.org/i/6ESy973.png" alt="Home Screen" width="18%" />
  <img src="https://img.mytsi.org/i/eVrz974.png" alt="Workflow Screen" width="18%" />
  <img src="https://img.mytsi.org/i/mCep975.png" alt="Chatbot Screen" width="18%" />
  <img src="https://img.mytsi.org/i/3QKj976.png" alt="Streaming Chat" width="18%" />
  <img src="https://img.mytsi.org/i/TcZH977.png" alt="RAG Screen" width="18%" />
</div>

## Tech Stack

The application is built using the following technologies:

- [React Native](https://reactnative.dev/) (v0.78.1) - Core framework for building cross-platform mobile applications
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript superset
- [React Navigation](https://reactnavigation.org/) (v7.0.18) - Navigation library for React Native
- [React Native Paper](https://callstack.github.io/react-native-paper/) (v5.13.1) - Material Design components for React Native
- [AI Tutor API](https://aitutor-api.vercel.app/) - AI-powered API for creating intelligent chatbots and workflows
- [AI Tutor RAG API](https://rag-api-aitutor-beta.up.railway.app/) - Retrieval Augmented Generation API for document-based Q&A
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) (v3.17.1) - Animation library
- [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) (v2.24.0) - Touch handling
- [React Native Linear Gradient](https://github.com/react-native-linear-gradient/react-native-linear-gradient) (v2.8.3) - Gradient effects
- [React Native Markdown Display](https://github.com/iamacup/react-native-markdown-display) (v7.0.2) - Markdown rendering
- [Lottie React Native](https://github.com/lottie-react-native/lottie-react-native) (v7.2.2) - Animation rendering
- [React Native Vector Icons](https://github.com/oblador/react-native-vector-icons) (v10.2.0) - Icon library
- [React Native WebView](https://github.com/react-native-webview/react-native-webview) (v13.13.4) - Web content rendering
- [React Native Async Storage](https://github.com/react-native-async-storage/async-storage) (v2.1.2) - Data persistence
- [React Native FS](https://github.com/itinance/react-native-fs) (v2.20.0) - File system access
- [React Native Documents Picker](https://github.com/rnmods/react-native-document-picker) (v10.1.1) - File selection

## Features

- **AI-Powered Workflows**: Create and execute AI workflows with variable inputs
- **Embedded Chatbots**: Integrate pre-built AI chatbots directly into your app
- **Streaming Responses**: Real-time streaming of AI-generated content
- **Document-Based Q&A**: Upload documents and ask questions based on their content
- **Persistent Chat History**: Save and manage conversation history
- **Markdown Support**: Rich text formatting for AI responses
- **File Management**: Upload, manage, and reference documents for RAG
- **Responsive UI**: Beautiful, animated user interface with gradient effects
- **Cross-Platform**: Works on both iOS and Android

## Screens

### Home Screen

The main entry point of the application showcasing all available features with a modern, animated UI.

### Workflow Screen

Demonstrates how to use AI Tutor API's workflow capabilities to generate content based on user input. Features include:

- Input form for workflow parameters
- Real-time response display with Markdown support
- History of previous workflow executions
- Automatic saving of results

### Chatbot Screen

Showcases embedding a pre-built AI Tutor chatbot using WebView integration:

- Seamless WebView integration with AI Tutor chatbot
- Token-based authentication
- Error handling and retry mechanisms
- Loading animations

### Streaming Screen

Implements a custom chat interface with real-time streaming of AI responses:

- Real-time streaming of AI-generated text
- Chat history management
- Conversation persistence
- Custom UI with animations and gradients

### Streaming RAG Screen

Advanced implementation combining streaming chat with document-based question answering:

- Document upload and management
- Context-aware responses based on uploaded documents
- File attachment to conversations
- Enhanced chat experience with document context

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or newer)
- [npm](https://www.npmjs.com/) (v8 or newer) or [Yarn](https://yarnpkg.com/) (v1.22 or newer)
- [Git](https://git-scm.com/)
- [Watchman](https://facebook.github.io/watchman/docs/install) (for macOS users)
- [Xcode](https://developer.apple.com/xcode/) (for iOS development, macOS only)
- [Android Studio](https://developer.android.com/studio) (for Android development)
- [CocoaPods](https://cocoapods.org/) (for iOS dependencies)
- [JDK](https://www.oracle.com/java/technologies/javase-jdk11-downloads.html) (v11 or newer)

### Installation

1. Clone the repository:

```sh
git clone https://github.com/yourusername/aitutor-api-react-native-example.git
cd aitutor-api-react-native-example
```

2. Install dependencies:

```sh
npm install
# or
yarn install
```

3. For iOS, install CocoaPods dependencies:

```sh
cd ios
bundle install
bundle exec pod install
cd ..
```

### Environment Setup

Create a `.env` file in the root directory with the following variables:

```
API_BASE_URL=https://aitutor-api.vercel.app/api/v1
AI_TUTOR_API_KEY=your_api_key_here
WORKFLOW_ID=your_workflow_id_here
CHATBOT_ID=your_chatbot_id_here
AITUTOR_TOKEN=your_public_token_here
AITUTOR_RAG_KEY=your_rag_api_key_here
RAG_API_URL=https://rag-api-llm.up.railway.app
```

Replace the placeholder values with your actual API keys and IDs.

### Running the Development Server

Start the Metro bundler:

```sh
npm start
# or
yarn start
```

## Android Development

### Running on Android Emulator

1. Start an Android emulator from Android Studio's AVD Manager

2. Run the app on the emulator:

```sh
npm run android
# or
yarn android
```

### Running on Physical Android Device

1. Connect your Android device via USB and ensure USB debugging is enabled

2. Check if your device is properly connected:

```sh
adb devices
```

3. Run the app on your device:

```sh
npm run android
# or
yarn android
```

### Building for Production

1. Generate a signing key (if you haven't already):

```sh
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. Place the keystore file in `android/app` directory

3. Configure signing in `android/gradle.properties`:

```
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=*****
MYAPP_RELEASE_KEY_PASSWORD=*****
```

4. Build the release APK:

```sh
cd android
./gradlew assembleRelease
```

The APK will be generated at `android/app/build/outputs/apk/release/app-release.apk`

### Publishing to Google Play Store

1. Create an AAB (Android App Bundle) for the Play Store:

```sh
cd android
./gradlew bundleRelease
```

2. The AAB will be generated at `android/app/build/outputs/bundle/release/app-release.aab`

3. Sign in to the [Google Play Console](https://play.google.com/console/developers)

4. Create a new application or select an existing one

5. Navigate to "Release > Production" and create a new release

6. Upload the AAB file and follow the prompts to complete the submission

## iOS Development

### Running on iOS Simulator

1. Run the app on the iOS Simulator:

```sh
npm run ios
# or
yarn ios
```

2. To specify a particular simulator:

```sh
npm run ios -- --simulator="iPhone 14 Pro"
# or
yarn ios --simulator="iPhone 14 Pro"
```

### Running on Physical iOS Device

1. Open the `ios/AITutorApiApp.xcworkspace` file in Xcode

2. Connect your iOS device to your Mac

3. Select your device from the device dropdown in Xcode

4. Sign the app with your Apple Developer account in the "Signing & Capabilities" tab

5. Build and run the app from Xcode

### Building for Production (iOS)

1. Open the project in Xcode:

```sh
open ios/AITutorApiApp.xcworkspace
```

2. Select "Product > Archive" from the menu

3. Once the archive is created, the Organizer window will appear

4. Select your archive and click "Distribute App"

5. Choose the appropriate distribution method (App Store Connect, Ad Hoc, Enterprise, etc.)

6. Follow the prompts to complete the build process

### Publishing to App Store

1. Create an archive as described in the previous section

2. Choose "App Store Connect" as the distribution method

3. Select "Upload" to send your build to App Store Connect

4. Sign in to [App Store Connect](https://appstoreconnect.apple.com/)

5. Navigate to your app and create a new version

6. Select the build you uploaded and complete the required information

7. Submit for review

## Project Structure

```
aitutor-api-react-native-example/
├── android/                  # Android native code
├── ios/                      # iOS native code
├── src/
│   ├── api/                  # API service functions
│   │   ├── apiService.ts     # Core API functions
│   │   └── chatApi.ts        # Chat-specific API handlers
│   ├── assets/               # Static assets
│   │   └── animations/       # Lottie animation files
│   ├── config/               # Configuration files
│   │   └── env.ts            # Environment variables
│   ├── navigation/           # Navigation setup
│   │   └── index.tsx         # Main navigation configuration
│   ├── screens/              # App screens
│   │   ├── HomeScreen.tsx    # Main menu screen
│   │   ├── WorkflowScreen.tsx # AI workflow demo
│   │   ├── ChatbotScreen.tsx # Embedded chatbot
│   │   ├── StreamingScreen.tsx # Streaming chat
│   │   └── StreamingRagScreen.tsx # RAG-enabled chat
│   └── styles/               # Global styles
│       └── theme.ts          # Theme configuration
├── .env                      # Environment variables (create this)
├── App.tsx                   # Main app component
├── index.js                  # Entry point
├── metro.config.js           # Metro bundler config
├── package.json              # Dependencies and scripts
└── tsconfig.json             # TypeScript configuration
```

## Customization

### Modifying the Theme

Edit the `src/styles/theme.ts` file to customize colors, fonts, and other UI elements.

### Adding New Screens

1. Create a new screen component in the `src/screens` directory
2. Add the screen to the navigation stack in `src/navigation/index.tsx`
3. Update the home screen to include a link to your new screen

### Connecting to Your Own AI Tutor API Instance

1. Obtain API keys from your AI Tutor API instance
2. Update the `.env` file with your API keys and endpoints
3. If necessary, modify the API service functions in `src/api/` to match your API's requirements

## Troubleshooting

### Common Issues

#### Metro Bundler Issues

If you encounter issues with the Metro bundler, try:

```sh
npm start -- --reset-cache
# or
yarn start --reset-cache
```

#### React Native Doctor

Run the React Native Doctor to diagnose and fix common setup issues:

```sh
npx react-native doctor
```

#### iOS Build Failures

If you encounter build failures on iOS:

1. Clean the build folder:

```sh
cd ios
xcodebuild clean
cd ..
```

2. Reinstall pods:

```sh
cd ios
bundle exec pod install --repo-update
cd ..
```

#### Android Build Failures

For Android build issues:

1. Clean the Gradle cache:

```sh
cd android
./gradlew clean
cd ..
```

2. Check for Java version compatibility:

```sh
java -version
```

Ensure you're using a compatible JDK version (JDK 11 is recommended).
