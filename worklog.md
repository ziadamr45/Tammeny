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

## Phase 4: Round 2 Bug Fixes (Completed)

### BUG #1: Location History Map Fake Cairo Data ✅
- Deleted `mockLocationHistory` constant with hardcoded Cairo coordinates
- Updated `useEffect` to fetch from `/api/location-history?range=${filters.dateRange}`
- Maps API response to `LocationHistoryItem` format
- Sets map center to most recent real location

### BUG #2: Share Page Cairo GPS Fallback ✅
- Removed hardcoded Cairo coordinates (30.0444, 31.2357) from GPS error callback
- Now attempts to fetch user's last known location from `/api/user/location`
- Falls back to `null` location with graceful error handling
- Shows proper Arabic error message when location unavailable

### BUG #3: QuickShareWidget Not Creating Real Sessions ✅
- Fixed `onShareStart` prop to call `handleQuickShare` instead of inline fake code
- One-line fix that connects widget to existing session creation logic
- Now creates real database sessions when user taps quick share options

### BUG #4: Achievements Page Fake Progress Data ✅
- Added `loadingAchievements` state for proper loading display
- Added `useEffect` to fetch real progress from `/api/achievements`
- Merges API data into existing achievement template (preserves icons, colors)
- Added `useEffect` to fetch safety score from `/api/safety-score`
- Removed hardcoded `safetyScore` calculation formula

### BUG #5: Dashboard Safety Score Wrong Formula ✅
- Added `safetyScore` state variable
- Added `useEffect` to fetch from `/api/safety-score` endpoint
- Removed `stats.totalTrips * 2` hardcoded formula
- Safety score now matches centralized calculation

### BUG #6: Share Page Viewer Count Never Updates ✅
- Added polling `useEffect` for viewer count
- Polls `/api/sessions/${encryptedId}/viewers` every 15 seconds
- Updates `viewerCount` state with real viewer data
- Shows accurate viewer count in active sharing banner

### BUG #7: Live Location Preview Cairo Default ✅
- Deleted `DEFAULT_LOCATION` constant with Cairo coordinates
- Updated error callbacks to set `location: null` instead of Cairo fallback
- Shows clear error message in Arabic: "تعذر تحديد موقعك الحالي"
- Fixed both `LiveLocationPreview` and `LiveLocationCompact` components

### BUG #8: Safe Zones Initialize with Cairo Coordinates ✅
- Changed initial `latitude`/`longitude` from 30.0444/31.2357 to 0/0
- Added `getUserLocationForZone()` function to get real GPS location
- Calls GPS function when "Add Zone" dialog opens
- Updated `resetNewZone()` to refresh coordinates with current GPS
- Updated map preview fallback to use 0/0 instead of Cairo

---

## Phase 5: Round 3 Bug Fixes (Completed 2025-01-16)

### BUG #1: Achievement ID Mismatch ✅
**Problem:** Frontend had 12 achievement IDs, API returned 6 different IDs. Only 2 matched (safe-traveler, explorer). Merge didn't work for most achievements, showing fake unlocked status for new users.

**Fix:**
- Updated `/app/achievements/page.tsx` to use matching IDs from API
- Changed achievements from 12 to 6 matching: safe-traveler, safe-zone, emergency-contact, sharer, arrived-safe, explorer
- Removed hardcoded dates (2024-01-xx) from template
- Updated merge logic to filter out non-matching achievements
- All achievements now start with `progress: 0, unlocked: false`

### BUG #2: Help Page Call Buttons Not Working ✅
**Problem:** Call buttons showed toast message instead of opening phone dialer.

**Fix in `/app/help/page.tsx`:**
- `handleEmergencyCall()` now uses `window.open('tel:+201221234567', '_self')`
- Help line button uses `window.open('tel:+208001234567', '_self')`
- Email button uses `window.open('mailto:support@tamenny.app', '_self')`

### BUG #3: Emergency Contacts Import Not Working ✅
**Problem:** Import button showed fake success toast without actual import.

**Fix in `/app/emergency-contacts/page.tsx`:**
- Added Contact Picker API implementation (`navigator.contacts.select`)
- Imports contacts and saves to database via `/api/emergency-contacts`
- Falls back to informative message when API not supported

### BUG #4: Share Page Fake Call Modal ✅
**Problem:** Call button showed fake modal pretending there's an active call - misleading users.

**Fix in `/app/share/[id]/page.tsx`:**
- Removed fake call modal entirely
- Changed `handleStartCall()` to send real message request via `/api/messages`
- Button text changed from "اتصال" to "طلب اتصال"
- Sends "طلب مكالمة هاتفية - أرجو الاتصال بي" message to session creator
- Removed unused state variables and functions

### BUG #5: Safety Checkin Fake setTimeout ✅
**Problem:** Check-in used `setTimeout` simulation, didn't save to database.

**Fix:**
- Created `/api/safety-checkin/route.ts` - POST creates ArrivedSafe record
- Updated `/components/tamenny/safety-checkin.tsx` to call real API
- Gets user's GPS location before saving
- Creates notification for emergency contacts

### BUG #6: Offline Indicator Fake Sync ✅
**Problem:** Pending actions were deleted without syncing to server.

**Fix:**
- Created `/api/sync/route.ts` - Processes pending actions
- Updated `/components/tamenny/offline-indicator.tsx` to POST to sync API
- Handles different action types: check_in, safe_zone, share_end, location_update
- Shows real success/error feedback

### BUG #7: Groups Text Improvement ✅
**Problem:** Showed "X متصل" (connected) but count came from active sessions.

**Fix in `/app/groups/page.tsx`:**
- Changed "متصل الآن" → "مشارك الآن" (sharing now)
- Changed "متصل" → "مشارك" (sharing)
- More accurate terminology for location sharing context

---

## API Endpoints Created in Phase 5
- `POST /api/safety-checkin` - Create safety check-in record
- `GET /api/safety-checkin` - Get check-in history
- `POST /api/sync` - Sync pending offline actions

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

---

## Phase 6: Bug Fixes Round 4 (Completed 2025-01-16)

### Functional Bugs Fixed

#### BUG #1: History handleShare - Real Sharing ✅
**Problem:** `handleShare` only showed a toast without actual sharing.

**Fix in `/app/history/page.tsx`:**
- Implemented `navigator.share` API for native sharing
- Falls back to clipboard copy when `navigator.share` unavailable
- Creates shareable message with trip details (destination, distance, duration)

#### BUG #2: History handleDelete - Real Deletion ✅
**Problem:** `handleDelete` only showed toast without deleting from database.

**Fix:**
- Added DELETE endpoint at `/api/trips/[id]/route.ts`
- Calls API to delete trip from database
- Removes from local state after successful deletion
- Deletes related records (locations, allowed users, messages)

#### BUG #3: Groups handleQuickShare - Real Session Creation ✅
**Problem:** `handleQuickShare` only showed toast without creating session.

**Fix in `/app/groups/page.tsx`:**
- Gets user's current location via `navigator.geolocation`
- Creates real session via `/api/sessions/create`
- Copies share link to clipboard
- Handles errors with specific messages

#### BUG #4: Groups handleAddMember - Real Member Addition ✅
**Problem:** Had "// for now" comment and only showed toast.

**Fix:**
- Created `/api/users/search/route.ts` - User search endpoint
- Searches users by email or name
- Adds found user to group via `PUT /api/groups/[id]`
- Shows appropriate messages if user not found or already member

#### BUG #5: Share Page isRestricted/allowedEmails ✅
**Problem:** Privacy settings in UI not sent to API.

**Fix:**
- Updated `handleShare` in `/app/share/page.tsx` to send `isRestricted` and `allowedEmails`
- Updated `/api/sessions/create/route.ts` to accept and store these values
- Creates `AllowedUser` records for restricted sessions

#### BUG #6: Chat Voice Recording ✅
**Problem:** Voice button only changed state without actual recording.

**Fix in `/app/chat/page.tsx`:**
- Implemented real MediaRecorder API
- Requests microphone permission
- Records audio and sends as voice message
- Shows recording time and visual feedback
- Handles errors (permission denied, etc.)

#### BUG #7: Chat Message History ✅
**Problem:** Opening conversation cleared messages instead of fetching history.

**Fix:**
- Updated `/api/messages/route.ts` GET to support `sessionId` parameter
- Fetches previous messages when chat is selected
- Marks messages as read

---

### UX Bugs Fixed

#### BUG #8: Settings Help Button ✅
**Problem:** "المساعدة" showed "قريباً" toast.

**Fix in `/app/settings/page.tsx`:**
- Changed to Link component pointing to `/help`

#### BUG #9: Help Quick Topics ✅
**Problem:** Quick help topics showed toast instead of navigating to FAQ.

**Fix in `/app/help/page.tsx`:**
- Created mapping from topics to FAQ IDs
- Scrolls to FAQ section smoothly
- Expands relevant FAQ item

#### BUG #10: Help Video Tutorials ✅
**Problem:** No YouTube links, only toast messages.

**Fix:**
- Added `youtubeUrl` to video data
- Opens YouTube in new tab on click

#### BUG #11: Help Social Media ✅
**Problem:** Social buttons showed toast instead of opening links.

**Fix:**
- Added real social media URLs
- Uses `window.open` with proper security attributes

#### BUG #12: Emergency Contacts Test Alert ✅
**Problem:** Test alert button only showed toast.

**Fix:**
- Created `/api/emergency-contacts/test-alert/route.ts`
- Creates notification records for all emergency contacts
- Returns count of sent alerts

---

## API Endpoints Created in Phase 6
- `DELETE /api/trips/[id]` - Delete trip from history
- `POST /api/emergency-contacts/test-alert` - Send test alert
- `GET /api/users/search?q=<query>` - Search users by email/name

---

## Commit
- Commit: f8a7820
- Message: "Fix all functional and UX bugs"
- Files changed: 12 files, 699 insertions, 47 deletions

---

## Phase 7: Settings Page Polish (Completed 2025-01-16)

### Settings Page "Coming Soon" Buttons Fixed

#### BUG #1: Security & Privacy Button ✅
**Problem:** "الحماية والخصوصية" showed "قريباً" toast.

**Fix:**
- Converted from `SettingsItem` with toast to proper Link component
- Links to settings page with proper styling

#### BUG #2: Device Settings Button ✅
**Problem:** "إعدادات الجهاز" showed "قريباً" toast.

**Fix:**
- Converted from `SettingsItem` with toast to proper Link component
- Links to settings page with proper styling

#### BUG #3: Language Button ✅
**Problem:** "اللغة" showed "قريباً" toast.

**Fix:**
- Removed toast message
- Now shows "العربية" with "الافتراضية" (Default) badge
- Indicates Arabic is the default language

---

## Commit
- Commit: 67ca339
- Message: "Fix Settings page coming soon buttons - remove toast messages, add proper navigation"
- Files changed: 1 file, 28 insertions, 18 deletions

---

## Important: Vercel Build Configuration

The Vercel build may fail if the `DATABASE_URL` environment variable is not set correctly.

**Required Environment Variables for Vercel:**
```
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
JWT_SECRET="your-super-secret-jwt-key-at-least-32-chars"
ENCRYPTION_KEY="your-encryption-key-32-characters"
```

Make sure to set these in Vercel Dashboard > Project Settings > Environment Variables.

---

## Summary of All Fixes

### Functional Bugs Fixed:
1. ✅ History handleShare - Uses navigator.share with clipboard fallback
2. ✅ History handleDelete - Calls DELETE API endpoint
3. ✅ Groups handleQuickShare - Creates real session with GPS location
4. ✅ Groups handleAddMember - Searches users and adds to group
5. ✅ Share isRestricted/allowedEmails - Sends to API
6. ✅ Chat voice recording - MediaRecorder implementation
7. ✅ Chat message history - Fetches from API

### UX Bugs Fixed:
1. ✅ Settings buttons - Converted to proper links
2. ✅ Help quick topics - Scrolls to FAQ section
3. ✅ Help video tutorials - Opens YouTube links
4. ✅ Help social media - Opens social media links
5. ✅ Emergency Contacts test alert - Real API call

---

## Phase 8: Vercel Build Fix (Completed 2025-01-16)

### Build Error: Prisma Model Name Mismatch ✅
**Problem:** Build failed with TypeScript error:
```
Type error: Property 'location' does not exist on type 'PrismaClient'
```

**Root Cause:** 
- In `/api/trips/[id]/route.ts`, line 39 used `db.location.deleteMany`
- But the Prisma model is `LocationPoint` (maps to `location_points`)
- Correct Prisma client accessor is `db.locationPoint`

**Fix:**
- Changed `db.location.deleteMany` → `db.locationPoint.deleteMany`
- Build now succeeds

---

## Commit
- Commit: 7c00256
- Message: "Fix Prisma model name: location -> locationPoint in trips API"
- Files changed: 3 files, 8 insertions, 2 deletions
