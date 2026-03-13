# Auth

Purpose: user authentication, registration, sign-out, and password reset/update flows.

Main components:
- `components/LoginScreen.tsx`
- `components/RegisterScreen.tsx`
- `components/ForgotPasswordScreen.tsx`
- `components/CompleteProfileScreen.tsx`
- `auth.service.ts`

Dependencies and integration points:
- Uses `src/lib/supabase.ts` through `auth.service.ts`
- Expo Router auth routes under `apps/mobile/app/(auth)`
- Auth state consumed via `src/store/auth.store.ts`
