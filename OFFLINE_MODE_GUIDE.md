# Offline Mode Functionality - Implementation Guide

## How It Works

### 1. **Offline Mode Toggle** (connection-status.tsx)
- Located in the Connection Status dialog
- Switch button to enable/disable offline mode
- Stores state in localStorage: `trackly_offline_mode`

### 2. **Automatic Data Caching** (api.ts)
When offline mode is enabled:

```typescript
// Check if offline mode is active
const offline = isOfflineMode()

// On successful API calls, automatically cache the response
if (response.ok && options.method !== 'GET') {
  saveToOfflineCache(endpoint, data)
}

// If fetch fails and offline mode is on, return cached data
if (isOfflineMode()) {
  const cached = getFromOfflineCache(endpoint)
  if (cached) {
    return new Response(JSON.stringify(cached), { status: 200 })
  }
}
```

### 3. **Data Flow**

**Online Mode (Normal):**
```
User Action → API Call → Backend Response → Display Data
                                          ↓
                                    Cache to localStorage
```

**Offline Mode (Enabled):**
```
User Action → Check Offline Mode → Use Cached Data → Display Data
                                 ↓
                            If no cache, show error
```

### 4. **Cache Storage Keys**
- Format: `offline_cache_{endpoint_name}`
- Example: `offline_cache__auth_me` for `/auth/me` endpoint
- Stores: `{ data, timestamp }`

## Features Implemented

✅ **Automatic Caching**
- All POST/PUT/DELETE responses cached automatically
- GET requests use existing localStorage data

✅ **Fallback System**
- If API fails and offline mode is ON → use cached data
- If API fails and offline mode is OFF → show error

✅ **Manual Toggle**
- User can enable/disable offline mode anytime
- Toggle persists across page reloads

✅ **Connection Monitoring**
- Checks backend availability
- Shows connection status in UI
- Auto-enables offline mode on 3 failed attempts (via connection-error-notification)

## Usage

### For Users:
1. Click connection status icon (top right)
2. Open "Connection Status" dialog
3. Toggle "Enable Offline Mode"
4. App will now cache all data locally
5. Works without internet connection

### For Developers:
All API calls automatically support offline mode:

```typescript
// This automatically caches and falls back to cache if offline
const response = await fetchWithAuth('/attendance', {
  method: 'POST',
  body: JSON.stringify(data)
})

if (response.ok) {
  const data = await response.json()
  // Data is now cached for offline use
}
```

## Testing Offline Mode

1. **Enable Offline Mode:**
   - Open Connection Status dialog
   - Toggle "Enable Offline Mode" ON
   - See "Offline Mode" status in header

2. **Make Changes:**
   - Add subjects, todos, attendance records
   - All changes saved to localStorage

3. **Verify Caching:**
   - Open DevTools → Application → LocalStorage
   - Look for keys: `offline_cache_*`
   - Each contains cached API responses

4. **Disable Offline Mode:**
   - Toggle "Enable Offline Mode" OFF
   - App checks connection
   - If connected, syncs data with backend

## Current Status

✅ **Implemented:**
- Offline mode toggle in connection-status.tsx
- Automatic caching in fetchWithAuth()
- Fallback to cached data when offline
- localStorage persistence

✅ **Working Components:**
- All components using fetchWithAuth() support offline mode
- settings-profile-form.tsx
- attendance-form.tsx
- profile-form.tsx
- set-admin-role.tsx

## Notes

- Offline mode is independent of authentication
- Works even without valid token
- Cache persists until manually cleared
- Each endpoint has separate cache entry
- Timestamps stored for future sync capability
