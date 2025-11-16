# Instagram-Style Shop Platform

A modern e-commerce platform for showcasing and selling products (shoes, bags, and accessories) with Instagram-like features.

## Features

- **Admin Panel**: Secure admin interface for uploading products
- **Product Management**: Upload images with title, description, category, and price
- **Like System**: Customers can like products (tracked by IP address)
- **WhatsApp Integration**: Direct purchase inquiries via WhatsApp
- **Category Filtering**: Filter products by category (shoes, bags, accessories)
- **Responsive Design**: Works beautifully on mobile and desktop
- **Real-time Updates**: Products appear immediately after upload

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and edit it with your settings:

```bash
cp .env.example .env
```

Edit `.env` file:

```env
# Admin credentials (change these!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password

# WhatsApp number (include country code, no + or spaces)
# Example: For +1 234 567 8900, use: 12345678900
WHATSAPP_NUMBER=12345678900

# Session secret (use a random string)
SESSION_SECRET=your-random-secret-key-here

# Server port
PORT=3000
```

### 3. Start the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

### 4. Access the Platform

- **Public Shop**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin.html

## Usage

### Admin Operations

1. Navigate to http://localhost:3000/admin.html
2. Login with your admin credentials (from .env file)
3. Upload products with:
   - Product title
   - Category (shoes, bags, accessories, other)
   - Price
   - Description (optional)
   - Product image
4. Manage existing products (view, delete)

### Customer Experience

1. Browse products at http://localhost:3000
2. Filter by category
3. Like favorite products
4. Click "Buy on WhatsApp" to contact you directly on WhatsApp with pre-filled message

## File Structure

```
.
├── server.js           # Express server and API routes
├── database.js         # SQLite database setup
├── package.json        # Dependencies
├── .env               # Configuration (create from .env.example)
├── public/            # Frontend files
│   ├── index.html     # Public shop page
│   ├── admin.html     # Admin panel
│   ├── styles.css     # Styling
│   ├── app.js        # Public shop JavaScript
│   └── admin.js      # Admin panel JavaScript
└── uploads/          # Product images (auto-created)
```

## Technology Stack

- **Backend**: Node.js + Express
- **Database**: SQLite
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **File Upload**: Multer
- **Authentication**: Express Session + bcryptjs

## Security Features

- Session-based admin authentication
- File upload validation (images only)
- SQL injection prevention (parameterized queries)
- IP-based like tracking
- Secure password handling

## Deployment Tips

### For Production:

1. **Use HTTPS**: Set `cookie.secure: true` in session config
2. **Strong Passwords**: Use strong admin password in .env
3. **Environment Variables**: Never commit .env file
4. **File Permissions**: Ensure proper permissions on uploads directory
5. **Rate Limiting**: Consider adding rate limiting middleware
6. **Database Backups**: Regularly backup shop.db file

### Deploy to Cloud Platforms:

**Heroku**:
```bash
# Add Procfile
echo "web: node server.js" > Procfile

# Deploy
heroku create
git push heroku main
```

**DigitalOcean/VPS**:
```bash
# Install PM2 for process management
npm install -g pm2
pm2 start server.js
pm2 save
```

## Customization

### Change Colors:

Edit `public/styles.css` and modify the CSS variables:

```css
:root {
  --primary-color: #405de6;
  --accent-color: #e1306c;
  /* ... other colors */
}
```

### Add More Categories:

Edit `public/admin.html` and add options to the category select:

```html
<option value="new-category">New Category</option>
```

### Modify WhatsApp Message:

Edit `public/app.js`, find the `whatsappMessage` variable and customize the template.

## Troubleshooting

**Cannot upload images**:
- Check that uploads/ directory exists and is writable
- Verify file size is under 10MB
- Ensure file is an image (jpg, png, gif, webp)

**Cannot login to admin**:
- Verify .env file exists and has correct credentials
- Check ADMIN_USERNAME and ADMIN_PASSWORD are set

**WhatsApp button not working**:
- Verify WHATSAPP_NUMBER in .env is correct format (country code + number, no spaces or +)
- Example: For +1-234-567-8900, use: 12345678900

## License

ISC

## Support

For issues or questions, please open an issue on the GitHub repository.
