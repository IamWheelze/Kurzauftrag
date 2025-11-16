# Community Services Platform 🏘️

A comprehensive community services platform connecting neighbors for errands, elderly assistance, local events, donations, and micro-jobs.

## 🌟 Features

### Core Services
- **Errands & Micro Tasks** - Paid or volunteered help (cleaning, dog walking, groceries)
- **Elderly Assistance Hub** - Schedule-based help, family monitoring, alerts
- **Community Forum & Events** - Local updates, lost pets, garage sales, meetups
- **Donations & Swaps** - Give away section for used goods, tool lending, food sharing
- **Mini-Jobs & Youth Tasks** - Earn credits or money helping neighbors
- **Business Listings** - Local service providers with promoted spots

### Key Features
- **Time Credits System** - Earn/give points for community participation
- **Trust & Safety** - Verification, reputation system, ratings
- **📅 Calendar Integration** - Sync with Google Calendar, Outlook, Apple Calendar
- **🔔 Smart Notifications** - Task reminders, community alerts, holiday notifications
- **🌍 Newcomer Support** - Holiday explanations, local customs, cultural context

## 🏗️ Architecture

```
community-services-platform/
├── backend/          # Node.js/Express API
├── frontend/         # React web application
├── mobile/           # React Native mobile app
├── shared/           # Shared types and utilities
└── docs/            # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Gmail account for OAuth
- Expo CLI (for mobile development)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd community-services-platform
```

2. **Install dependencies**
```bash
npm run install:all
```

3. **Configure environment variables**

Create `.env` files in backend, frontend, and mobile directories using the `.env.example` templates.

4. **Set up database**
```bash
cd backend
npm run db:setup
npm run db:migrate
npm run db:seed
```

5. **Start development servers**

Backend:
```bash
npm run dev:backend
```

Frontend:
```bash
npm run dev:frontend
```

Mobile:
```bash
npm run dev:mobile
```

## 📱 Mobile App

The mobile app is built with React Native and Expo for cross-platform support (iOS & Android).

```bash
cd mobile
npm start
# Press 'i' for iOS simulator
# Press 'a' for Android emulator
# Scan QR code with Expo Go app for physical device
```

## 🔑 Gmail Integration

The platform uses Gmail OAuth for authentication and Google Calendar API for calendar sync.

### Setup:
1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Gmail API and Google Calendar API
3. Create OAuth 2.0 credentials
4. Add credentials to backend `.env` file

## 📧 Contact & Feedback

Have suggestions or need adjustments? Drop us a message at:
- **Email**: [Your contact email]
- **Feedback Form**: Available in the app under Settings → Send Feedback

## 🛠️ Technology Stack

### Backend
- Node.js & Express
- PostgreSQL
- JWT & OAuth 2.0
- Socket.io (real-time notifications)
- Stripe (payments)
- Google Calendar API

### Frontend
- React 18
- TypeScript
- Material-UI / Tailwind CSS
- React Query
- Socket.io client

### Mobile
- React Native
- Expo
- TypeScript
- React Navigation
- Push notifications

## 📊 Database Schema

Key entities:
- Users (profiles, verification, reputation)
- Tasks (errands, jobs, assistance)
- Events (community gatherings, alerts)
- Donations (items, exchanges)
- TimeCredits (earned/spent)
- Ratings & Reviews
- Notifications
- Calendar Events

## 🔒 Security & Privacy

- Gmail OAuth authentication
- JWT token-based authorization
- User verification system
- Community reputation scores
- Data encryption in transit and at rest
- GDPR compliant

## 🌍 Localization

Currently supporting:
- English
- German (primary - Bavaria focus)
- More languages coming soon

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please read CONTRIBUTING.md for guidelines.

## 📞 Support

For issues or questions:
- Create an issue on GitHub
- Email support team
- Use in-app feedback form

---

**Example Use Case:**
> A senior in Bavaria posts: "Need someone to pick up my meds from the local pharmacy on Thursday."
>
> A student nearby accepts — gets 1 hour credit or €5 via app. The senior rates them 5⭐. Meanwhile, the pharmacy lists delivery hours on their verified profile.

Made with ❤️ for communities
