# Step 3: Build Authentication and Profiles

## Objective
Implement secure user sign-up, login, and personal profile management.

## Why this matters
Authentication is the foundation for private user materials and paid premium access.

## Deliverables
- Email/password sign up and login
- Google OAuth option
- JWT-based auth
- Protected API endpoints
- Profile page with user stats, goals, current learning roadmap, and current learning stage

## Tasks
1. ✅ Implement backend auth endpoints:
   - `POST /auth/register`
   - `POST /auth/login`
   - `POST /auth/google`
2. ✅ Implement JWT creation and validation middleware.
3. ✅ Secure routes for user-only data access.
4. ✅ Build profile page UI showing:
   - completed sessions
   - topics covered
   - knowledge score trend
   - learning goal and target date
   - current roadmap and milestone
   - current module stage and the next locked module
5. ✅ Create API for setting and updating learning goals.

## Onboarding notes
- Use secure password hashing (bcrypt / Argon2).
- Ensure auth errors are user-friendly and do not leak sensitive data.
- Keep frontend state in sync with token expiration and refresh logic.

## Implementation Summary

### Backend
- **Core modules:**
  - `app/core/security.py` - Password hashing with bcrypt, JWT token creation/validation
  - `app/core/auth.py` - Dependency for getting current authenticated user

- **Schemas:**
  - `app/schemas/auth.py` - Request/response models for auth endpoints
  - `app/schemas/user.py` - User profile and stats models

- **Routers:**
  - `app/routers/auth.py` - `/auth/register`, `/auth/login`, `/auth/google`, `/auth/logout`
  - `app/routers/users.py` - `/users/profile` endpoint with stats, goals, roadmap

### Frontend
- **Pages:**
  - `pages/login.tsx` - Login form with email/password and Google OAuth button
  - `pages/register.tsx` - Registration form with email, password, display name
  - `pages/profile.tsx` - User profile page showing stats, goals, and roadmap

- **API Proxy:**
  - `pages/api/profile.ts` - Proxy to backend profile endpoint

### Features
- Password hashing with bcrypt
- JWT tokens with 24-hour expiration
- Cookie-based token storage for browser clients
- Protected routes requiring authentication
- Profile page with:
  - Account information
  - Session statistics
  - Topics covered
  - Average knowledge score
  - Learning goals with target dates
  - Learning roadmap with current and next stages

### Testing
- Backend tests in `backend/tests/test_auth.py`
- Run tests with: `poetry run pytest -q`

### Notes
- Google OAuth is implemented as a placeholder for MVP. Full implementation requires:
  - Google Cloud Console setup with OAuth credentials
  - Proper ID token verification with Google's API
  - Frontend Google Sign-In integration

## Next Steps
- Step 4: Material Upload - Document ingestion, parsing, and vector storage
