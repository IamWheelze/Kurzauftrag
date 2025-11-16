# World Changers Mentorship Platform

A comprehensive mentorship and LMS platform for Egbodofo Joshua's "World Changers" program. This platform combines high-converting marketing pages with interactive learning management features to support intentional individuals in transforming their vision into world-changing impact.

## Project Overview

**Program Name:** World Changers
**Mentor:** Egbodofo Joshua - Global Impact Strategist & Founder
**Duration:** 3 months initial commitment / 2-year growth journey
**Focus:** Ethical leadership, strategic results, and transformative business development

## Features

### Marketing Website

- **Professional Deep Blue Luxury Theme** - Navy blue primary color with metallic gold/silver accents
- **High-Converting Landing Pages:**
  - Home page with hero section and value proposition
  - About page featuring Egbodofo Joshua's credentials and expertise
  - Curriculum page detailing the 4-week deep dive program
  - Testimonials page for social proof
  - Application page with comprehensive form
  - Contact page

### LMS Platform (Member Area)

1. **Goal-Setting & Accountability Hub**
   - Weekly goal creation and tracking
   - Three-part goal framework: What, How, Currently Working On
   - Target date tracking
   - Automated email reminders (configured via environment variables)

2. **Progress Feed (Social Stream)**
   - Instagram-style progress sharing
   - Image upload support
   - "Value Added" voting system for peer recognition
   - Real-time feed of member achievements

3. **Mentor Reporting System**
   - Weekly personalized feedback from Egbodofo Joshua
   - Progress monitoring and strategic guidance
   - Private communication channel

4. **Member Dashboard**
   - Personal progress tracking
   - Goal management interface
   - Community interaction
   - Report access

### Mentor Admin Dashboard

- **Application Management:** Review and approve/reject applicants
- **Member Management:** View all program members and their stats
- **Goal Oversight:** Monitor all member goals across the program
- **Progress Monitoring:** Access all member progress posts and engagement
- **Reporting Tools:** Write personalized mentor reports
- **Content Management:** Add testimonials and manage social proof

## Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` file with your settings:

```env
# Mentor/Admin credentials (Egbodofo Joshua)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password_here

# Session secret (use a strong random string)
SESSION_SECRET=your-random-secret-key-here

# Server port
PORT=3000

# Email configuration (optional - for automated reminders)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Egbodofo Joshua <noreply@worldchangers.com>
```

### 3. Add Mentor Profile Image

Place Egbodofo Joshua's profile image (`application picture.jpg`) in the uploads directory:

```bash
# Create uploads directory if it doesn't exist
mkdir -p uploads

# Copy your profile image (rename to mentor-profile.jpg)
cp /path/to/application_picture.jpg uploads/mentor-profile.jpg
```

### 4. Start the Server

Development mode (with auto-reload):

```bash
npm run dev
```

Production mode:

```bash
npm start
```

### 5. Access the Platform

- **Public Website:** http://localhost:3000
- **Member Login:** http://localhost:3000/login.html
- **Member Dashboard:** http://localhost:3000/dashboard.html
- **Mentor Admin Panel:** http://localhost:3000/admin.html

## Core Curriculum

The World Changers program features a transformative 4-week curriculum:

1. **Week 1: Hope vs. Faith** - Understanding conviction needed for real change
2. **Week 2: Wishes vs. Desires** - Differentiating passive longing from committed action
3. **Week 3: Why People Don't Have Desires** - Removing barriers to ambition
4. **Week 4: Cultivating Desires** - Practical strategies for sustaining massive goals

## Technology Stack

- **Backend:** Node.js + Express
- **Database:** SQLite with comprehensive schema
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **File Upload:** Multer for image handling
- **Authentication:** Express Session + bcryptjs
- **Styling:** Custom CSS with CSS variables for theming

## Database Schema

Main tables:

- **users** - Member accounts and profiles
- **applications** - Program application submissions
- **goals** - Weekly goal tracking
- **progress_posts** - Member progress updates
- **progress_likes** - Value Added voting
- **mentor_reports** - Personalized feedback from mentor
- **testimonials** - Social proof and success stories
- **email_reminders** - Automated notification log

## File Structure

```
.
├── server.js              # Express server and API routes
├── database.js            # SQLite database configuration
├── package.json           # Dependencies and scripts
├── .env                   # Configuration (create from .env.example)
├── .env.example           # Example environment configuration
├── public/                # Frontend files
│   ├── index.html         # Home page
│   ├── about.html         # About Egbodofo Joshua
│   ├── curriculum.html    # 4-week curriculum
│   ├── testimonials.html  # Success stories
│   ├── apply.html         # Application form
│   ├── contact.html       # Contact page
│   ├── login.html         # Member login
│   ├── dashboard.html     # Member dashboard (LMS)
│   ├── admin.html         # Mentor admin panel
│   └── styles.css         # Luxury theme styling
└── uploads/               # User-uploaded files (auto-created)
```

## Usage Guide

### For Egbodofo Joshua (Mentor/Admin):

1. Login at `/admin.html` with admin credentials
2. Review applications in the Applications tab
3. Approve worthy applicants and set their initial password
4. Monitor member progress through Goals and Progress tabs
5. Write personalized weekly reports in the Reports section
6. Add testimonials to build social proof

### For Program Members:

1. Apply through the website application form
2. Wait for approval from Egbodofo Joshua
3. Receive login credentials
4. Login at `/login.html`
5. Set weekly goals in the Goals section
6. Share progress updates with the community
7. Support peers through Value Added voting
8. Receive and review personalized mentor reports

## Security Features

- Session-based authentication for members and admin
- Password hashing with bcryptjs
- SQL injection prevention through parameterized queries
- File upload validation (images only, 10MB limit)
- Secure session management
- User-based content access control

## Deployment

### Recommended Steps for Production:

1. **Set Strong Passwords** - Change admin credentials in .env
2. **Enable HTTPS** - Set `cookie.secure: true` in session config (server.js:58)
3. **Environment Variables** - Never commit .env file to version control
4. **Database Backups** - Regularly backup `mentorship.db`
5. **Email Configuration** - Configure SMTP for automated reminders

### Deployment Platforms:

**Heroku:**
```bash
echo "web: node server.js" > Procfile
heroku create
git push heroku main
```

**DigitalOcean/VPS:**
```bash
npm install -g pm2
pm2 start server.js --name worldchangers
pm2 save
pm2 startup
```

## Customization

### Updating Colors

The deep blue luxury theme uses CSS variables in `public/styles.css`:

```css
:root {
  --primary-blue: #0B1A4D;      /* Deep navy/midnight blue */
  --accent-gold: #D4AF37;        /* Metallic gold */
}
```

## Troubleshooting

**Cannot access admin panel:**
- Verify .env file exists with ADMIN_USERNAME and ADMIN_PASSWORD
- Check that the server is running

**Database errors:**
- Ensure write permissions on the project directory
- Restart the server to reinitialize database

**Image uploads failing:**
- Verify uploads/ directory exists and is writable
- Check file size is under 10MB

**Session issues:**
- Verify SESSION_SECRET is set in .env
- Clear browser cookies

## License

ISC

## Credits

**Founded by:** Egbodofo Joshua
**Program Name:** World Changers
**Mission:** Transforming intentional individuals into global impact strategists

---

**© 2024 World Changers Mentorship Program. All rights reserved.**
