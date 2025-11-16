# Deployment Guide

## Production Deployment

### Option 1: Deploy to Heroku

#### Backend Deployment

1. **Create a Heroku app**:
```bash
heroku create your-app-name-api
```

2. **Add PostgreSQL addon**:
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

3. **Set environment variables**:
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_production_secret
heroku config:set GOOGLE_CLIENT_ID=your_client_id
heroku config:set GOOGLE_CLIENT_SECRET=your_client_secret
heroku config:set FRONTEND_URL=https://your-frontend.herokuapp.com
```

4. **Deploy**:
```bash
cd backend
git init
heroku git:remote -a your-app-name-api
git add .
git commit -m "Initial deployment"
git push heroku master
```

5. **Run database setup**:
```bash
heroku run npm run db:setup
heroku run npm run db:seed
```

#### Frontend Deployment

1. **Build the frontend**:
```bash
cd frontend
npm run build
```

2. **Deploy to Netlify/Vercel**:

**Netlify**:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=build
```

**Vercel**:
```bash
npm install -g vercel
vercel --prod
```

3. **Set environment variables** in Netlify/Vercel dashboard:
```
REACT_APP_API_URL=https://your-app-name-api.herokuapp.com
REACT_APP_SOCKET_URL=https://your-app-name-api.herokuapp.com
REACT_APP_GOOGLE_CLIENT_ID=your_client_id
```

### Option 2: Deploy to VPS (DigitalOcean, AWS, etc.)

#### Prerequisites

- Ubuntu 20.04+ server
- Domain name
- SSL certificate (Let's Encrypt)

#### Setup

1. **Install Node.js and PostgreSQL**:
```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# PM2 (process manager)
sudo npm install -g pm2
```

2. **Clone and setup**:
```bash
git clone <your-repo> /var/www/community-services
cd /var/www/community-services
npm run install:all
```

3. **Configure PostgreSQL**:
```bash
sudo -u postgres psql
CREATE DATABASE community_services;
CREATE USER app_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE community_services TO app_user;
\q
```

4. **Setup environment variables**:
```bash
cd backend
cp .env.example .env
# Edit .env with production values
nano .env
```

5. **Initialize database**:
```bash
npm run db:setup
npm run db:seed
```

6. **Start with PM2**:
```bash
cd backend
pm2 start src/server.js --name community-api
pm2 save
pm2 startup
```

7. **Setup Nginx as reverse proxy**:
```bash
sudo apt-get install nginx

# Create nginx config
sudo nano /etc/nginx/sites-available/community-services
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/community-services/frontend/build;
    index index.html;

    location / {
        try_files $uri /index.html;
    }
}
```

8. **Enable site and SSL**:
```bash
sudo ln -s /etc/nginx/sites-available/community-services /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Setup SSL with Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

9. **Build and deploy frontend**:
```bash
cd /var/www/community-services/frontend
npm run build
```

### Mobile App Deployment

#### iOS (App Store)

1. **Configure app**:
```bash
cd mobile
# Update app.json with production values
```

2. **Build**:
```bash
expo build:ios
```

3. **Submit to App Store**:
- Download the .ipa file
- Upload using Transporter app
- Submit via App Store Connect

#### Android (Google Play)

1. **Build**:
```bash
expo build:android
```

2. **Submit to Google Play**:
- Download the .aab file
- Upload to Google Play Console
- Complete store listing and submit

## Environment Variables Checklist

### Backend (.env)
- [ ] `NODE_ENV=production`
- [ ] `PORT=5000`
- [ ] `DB_HOST`
- [ ] `DB_PORT`
- [ ] `DB_NAME`
- [ ] `DB_USER`
- [ ] `DB_PASSWORD`
- [ ] `JWT_SECRET` (strong, random)
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `GOOGLE_REDIRECT_URI`
- [ ] `FRONTEND_URL`
- [ ] `SMTP_*` (if using email)
- [ ] `STRIPE_*` (if using payments)

### Frontend (.env)
- [ ] `REACT_APP_API_URL`
- [ ] `REACT_APP_SOCKET_URL`
- [ ] `REACT_APP_GOOGLE_CLIENT_ID`

### Mobile (.env)
- [ ] `API_URL`
- [ ] `GOOGLE_CLIENT_ID`

## Post-Deployment Checklist

- [ ] Database is seeded with holidays
- [ ] Google OAuth is configured with production URLs
- [ ] SSL certificates are installed and working
- [ ] All environment variables are set correctly
- [ ] Backend health check returns 200: `curl https://api.yourdomain.com/`
- [ ] Frontend loads correctly
- [ ] Google sign-in works
- [ ] WebSocket connections work
- [ ] Email notifications work (if configured)
- [ ] Monitoring is setup (e.g., PM2, Sentry)
- [ ] Backups are configured for database
- [ ] Rate limiting is enabled
- [ ] CORS is properly configured

## Monitoring

### PM2 Monitoring
```bash
pm2 monit
pm2 logs community-api
pm2 restart community-api
```

### Database Backups
```bash
# Create backup
pg_dump -U app_user community_services > backup_$(date +%Y%m%d).sql

# Restore backup
psql -U app_user community_services < backup_20241215.sql
```

### Setup automated backups
```bash
# Add to crontab
crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * pg_dump -U app_user community_services > /backups/db_$(date +\%Y\%m\%d).sql
```

## Security Considerations

1. **Use strong JWT secret** in production
2. **Enable HTTPS** everywhere
3. **Set secure CORS** policies
4. **Use environment variables** for all secrets
5. **Enable rate limiting** on API
6. **Regular security updates** for dependencies
7. **Database encryption** at rest and in transit
8. **Regular backups**
9. **Monitor logs** for suspicious activity
10. **Use security headers** (Helmet.js is already configured)

## Scaling

### Horizontal Scaling
- Use load balancer (Nginx, AWS ELB)
- Multiple backend instances with PM2 cluster mode
- Shared PostgreSQL database or read replicas

### Vertical Scaling
- Upgrade server resources (CPU, RAM)
- Optimize database queries
- Add caching layer (Redis)

---

For support, contact: support@communityservices.com
