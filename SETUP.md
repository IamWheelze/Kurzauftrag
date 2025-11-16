# Community Services Platform - Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher
- **npm** or **yarn**
- **PostgreSQL** 14.x or higher
- **Git**
- **Expo CLI** (for mobile development): `npm install -g expo-cli`

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd community-services-platform
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Install mobile dependencies
cd ../mobile && npm install
```

### 3. Set Up PostgreSQL Database

#### Option A: Local PostgreSQL

1. Install PostgreSQL on your system
2. Create a database:

```sql
CREATE DATABASE community_services;
```

3. Create a PostgreSQL user (if needed):

```sql
CREATE USER your_username WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE community_services TO your_username;
```

#### Option B: Using Docker

```bash
docker run --name community-db \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=community_services \
  -p 5432:5432 \
  -d postgres:14
```

### 4. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Google+ API
   - Google Calendar API
   - Gmail API

4. Create OAuth 2.0 credentials:
   - Go to **Credentials** → **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Authorized redirect URIs:
     - `http://localhost:5000/api/auth/google/callback`
     - `http://localhost:3000/auth/callback`

5. Download the credentials and note:
   - Client ID
   - Client Secret

### 5. Configure Environment Variables

#### Backend (.env)

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your values:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=community_services
DB_USER=your_username
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Email (Optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

#### Frontend (.env)

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

#### Mobile (.env)

Create `mobile/.env`:

```env
API_URL=http://localhost:5000
GOOGLE_CLIENT_ID=your_google_client_id
```

### 6. Initialize Database

```bash
cd backend

# Create database and tables
npm run db:setup

# Seed with initial data (holidays, etc.)
npm run db:seed
```

### 7. Start the Application

#### Terminal 1: Backend

```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:5000`

#### Terminal 2: Frontend

```bash
cd frontend
npm start
```

The frontend will start on `http://localhost:3000`

#### Terminal 3: Mobile (Optional)

```bash
cd mobile
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## Testing the Application

1. Open your browser to `http://localhost:3000`
2. Click **"Sign in with Google"**
3. Complete the Google OAuth flow
4. You should be redirected to the home page

## Common Issues

### Database Connection Error

**Error**: `ECONNREFUSED 127.0.0.1:5432`

**Solution**: Make sure PostgreSQL is running:

```bash
# On macOS with Homebrew
brew services start postgresql

# On Linux
sudo systemctl start postgresql

# Using Docker
docker start community-db
```

### Google OAuth Error

**Error**: `redirect_uri_mismatch`

**Solution**:
1. Verify your redirect URI in Google Cloud Console matches exactly
2. Ensure `GOOGLE_REDIRECT_URI` in `.env` matches the one in Google Console

### Port Already in Use

**Error**: `EADDRINUSE :::5000`

**Solution**: Change the port in `backend/.env` or kill the process using the port:

```bash
# Find process
lsof -i :5000

# Kill process
kill -9 <PID>
```

## Next Steps

- Read the [API Documentation](./API.md) to understand available endpoints
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
- See [CONTRIBUTING.md](./CONTRIBUTING.md) to contribute to the project

## Support

If you encounter any issues:

1. Check the logs in the terminal
2. Review the `.env` files for correct configuration
3. Ensure all services (PostgreSQL, backend, frontend) are running
4. Use the in-app feedback form to report issues

---

Happy coding! 🚀
