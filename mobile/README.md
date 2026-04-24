# Coastal Corridor — Mobile App

React Native (Expo) mobile application for the Coastal Corridor platform.

## Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 51 + Expo Router v3 |
| Language | TypeScript |
| Auth | Clerk (`@clerk/clerk-expo`) |
| Navigation | Expo Router (file-based, tab + stack) |
| Styling | React Native StyleSheet (design tokens match web) |
| API | Coastal Corridor REST API (`https://coastalcorridor.africa`) |

## Screens

| Screen | Route | Auth required |
|---|---|---|
| Sign In | `/(auth)/sign-in` | No |
| Sign Up | `/(auth)/sign-up` | No |
| Explore | `/(tabs)/` | No |
| Properties | `/(tabs)/properties` | No |
| Fractional | `/(tabs)/fractional` | No |
| Account | `/(tabs)/account` | Yes |
| Property Detail | `/property/[slug]` | No |

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set environment variables

Create `.env.local`:

```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
```

Get the publishable key from your Clerk dashboard at `coastalcorridor.africa`.

### 3. Start the development server

```bash
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or press `i` for iOS simulator / `a` for Android emulator.

## Building for production

### EAS Build (recommended)

```bash
npm install -g eas-cli
eas login
eas build --platform all
```

### Local build

```bash
# iOS (requires macOS + Xcode)
npx expo run:ios

# Android (requires Android Studio)
npx expo run:android
```

## Design tokens

The mobile app uses the same colour palette as the web platform:

| Token | Hex | Usage |
|---|---|---|
| `ink` | `#0a0e12` | Background |
| `paper` | `#f5f0e8` | Text |
| `ochre` | `#d4a24c` | Accent / prices |
| `laterite` | `#c96a3f` | Primary action |
| `sage` | `#8aa876` | Success / yield |
| `ocean` | `#4db3b3` | Infrastructure |

## API endpoints used

All API calls go to `https://coastalcorridor.africa`:

- `GET /api/destinations` — Corridor destinations list
- `GET /api/properties?page=&limit=` — Paginated property listings
- `GET /api/properties/[slug]` — Property detail
- `GET /api/search?q=&limit=` — Full-text search
- `POST /api/inquiries` — Submit property inquiry
- `GET /api/buyer/summary` — Buyer account summary (auth)
- `GET /api/fractional/schemes` — Fractional investment schemes
- `POST /api/fractional/purchase` — Purchase fractional shares (auth)
