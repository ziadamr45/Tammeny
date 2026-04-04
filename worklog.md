# Tamenny (طمنّي) Project Worklog

## Current Status: In Progress
**Last Updated:** 2025-01-16
**Branch:** main
**GitHub:** https://github.com/ziadamr45/Tammeny

---

## Completed Work

### Phase 1: Build Fix & Schema Update
- Added `address` field to User model in Prisma schema
- Added `passwordResetOtp` and `passwordResetExpiry` fields to User model
- Added `SupportTicket` model for help form
- Generated Prisma client

### Phase 2: Critical Bug Fixes (Completed)

#### BUG #1: Forgot Password Flow ✅
- Created `/api/auth/forgot-password/route.ts` - Sends OTP
- Created `/api/auth/verify-otp/route.ts` - Verifies OTP
- Created `/api/auth/reset-password/route.ts` - Resets password with bcrypt hashing
- Updated frontend to use real API calls instead of setTimeout
- Added debug OTP banner for development mode

#### BUG #2: SOS Hardcoded Cairo Coordinates ✅
- Removed `MOCK_LOCATION` constant entirely
- Location now properly set to `null` on GPS failure
- Shows clear error message when location unavailable
- Uses last known location from user profile as fallback
- Removed fake ETA calculation
- Added "Time since alert" counter instead of random ETA

#### BUG #3: Location History Map ✅
- Created `/api/location-history/route.ts` - Real database queries
- Supports date range filtering (today/week/month/all)
- Returns grouped location points by session

#### BUG #6: Achievements Fake Data ✅
- Created `/api/achievements/route.ts` - Real progress calculation
- Calculates from actual database counts
- Returns progress, total, unlocked status per achievement

#### BUG #8: Notifications Button ✅
- Added `handleEnableNotifications` function
- Requests browser Notification permission
- Saves preference to user settings via API
- Banner hidden after enabling

#### BUG #9: Help Contact Form ✅
- Created `/api/help/contact/route.ts` - Saves to database
- Validates form fields
- Stores in SupportTicket table

#### BUG #11: Main Page Activities ✅
- Added `recentTrips` state
- Fetches from `/api/trips` API
- Shows real trips or empty state

#### BUG #12: Stats Card ✅
- Added `quickStats` state
- Fetches from `/api/trips` and `/api/contacts`
- Shows real trip count, distance, contacts

#### BUG #13: QuickShare Widget ✅
- Now creates real session via `/api/sessions/create`
- Starts location updates
- Returns shareable link

#### BUG #15: Safety Score Utility ✅
- Created `/api/safety-score/route.ts`
- Centralized safety score calculation
- Used across all components

#### BUG #16: Viewer Count Updates ✅
- Created `/api/sessions/[id]/viewers/route.ts`
- Returns count of viewers for session

#### BUG #4: Destination Modal ✅
- Fetches safe zones from `/api/safe-zones`
- Displays user's actual safe zones
- Shows empty state with link to add zones

---

## Phase 3: Additional Bug Fixes (Completed)

### BUG #5: Groups Fake Online Count ✅
- Updated `/api/groups` to query active sessions for group members
- Added `isOnline` field to each member based on active session status
- Added `onlineCount` field to each group
- Updated frontend to use real online count instead of simulated 60%

### BUG #7: Dashboard Export CSV ✅
- Implemented real CSV export functionality in dashboard
- Downloads trip data with Arabic headers
- Includes: date, distance, destination, status, duration
- Creates downloadable file with UTF-8 BOM for Arabic support

### BUG #10: Share Page Viewer Message ✅
- Updated `handleSendMessage` in `/share/[id]/page.tsx`
- Now calls real `/api/messages` POST endpoint
- Properly sends message content to session creator
- Shows success/error feedback to user

### BUG #14: Dashboard Chart Fake Data ✅
- Fixed monthly data calculation to group trips by actual week
- Weekly view now shows real trip counts per day
- Monthly view calculates trip distribution across 4 weeks
- All data derived from real `/api/trips` response

---

## Pending Work

None - All identified bugs have been fixed!

---

## Technology Stack
- **Framework:** Next.js 16.1.3 (App Router, Turbopack)
- **Database:** PostgreSQL (Neon) with Prisma ORM
- **Auth:** JWT in HTTP-only cookies
- **Maps:** Leaflet + OpenStreetMap
- **Language:** Arabic RTL
- **UI:** Tailwind CSS + shadcn/ui

---

## API Endpoints Created/Updated
- `POST /api/auth/forgot-password` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/reset-password` - Reset password
- `POST /api/help/contact` - Submit support ticket
- `GET /api/location-history` - Get location history
- `GET /api/achievements` - Get user achievements
- `GET /api/safety-score` - Get safety score
- `GET /api/sessions/[id]/viewers` - Get viewer count

---

## Database Schema Additions
```prisma
model User {
  passwordResetOtp     String?
  passwordResetExpiry  DateTime?
}

model SupportTicket {
  id        String   @id @default(cuid())
  name      String
  email     String
  message   String
  status    String   @default("open")
  createdAt DateTime @default(now())
}
```

---

## Notes
- All error messages are in Arabic
- Using `toArabicNumerals()` for number display
- JWT authentication via `auth-token` cookie
- `getCurrentUser()` returns `{ userId, email, name }` or `null`
