# API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Authentication Endpoints

#### Google OAuth Login
```
GET /api/auth/google
```
Redirects to Google OAuth consent screen.

#### OAuth Callback
```
GET /api/auth/google/callback
```
Handles OAuth callback and returns JWT token.

#### Get Current User
```
GET /api/auth/me
Headers: Authorization: Bearer <token>
```

Response:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "time_credits": 50,
    "reputation_score": 4.5
  }
}
```

## Tasks & Errands

#### Get All Tasks
```
GET /api/tasks?status=open&category=cleaning&city=Munich
```

Response:
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Dog Walking Needed",
      "description": "Need someone to walk my dog for 30 minutes",
      "category": "dog_walking",
      "credits_offered": 10,
      "location": "Munich, Germany",
      "creator_name": "Jane Doe",
      "status": "open"
    }
  ]
}
```

#### Create Task
```
POST /api/tasks
Headers: Authorization: Bearer <token>
Body: {
  "title": "Pick up groceries",
  "description": "Need help getting groceries from the store",
  "category": "groceries",
  "location": "Munich",
  "credits_offered": 15
}
```

#### Accept Task
```
POST /api/tasks/:taskId/accept
Headers: Authorization: Bearer <token>
```

#### Complete Task
```
POST /api/tasks/:taskId/complete
Headers: Authorization: Bearer <token>
```

## Elderly Assistance

#### Get Assistance Requests
```
GET /api/elderly?status=pending
```

#### Create Assistance Request
```
POST /api/elderly
Body: {
  "assistance_type": "medication_pickup",
  "description": "Need someone to pick up prescription",
  "emergency_contact": "+49123456789"
}
```

#### Accept Request
```
POST /api/elderly/:requestId/accept
```

#### Check-In
```
POST /api/elderly/:requestId/checkin
```

## Community Forum

#### Get Forum Posts
```
GET /api/forum/posts?category=lost_pet&search=dog
```

#### Get Single Post with Comments
```
GET /api/forum/posts/:postId
```

#### Create Post
```
POST /api/forum/posts
Body: {
  "title": "Lost Dog - Golden Retriever",
  "content": "Last seen near central park...",
  "category": "lost_pet",
  "tags": ["dog", "golden-retriever"]
}
```

#### Add Comment
```
POST /api/forum/posts/:postId/comments
Body: {
  "content": "I saw a similar dog yesterday"
}
```

#### Like Post
```
POST /api/forum/posts/:postId/like
```

## Donations & Swaps

#### Get Donations
```
GET /api/donations?status=available&category=furniture
```

#### Create Donation
```
POST /api/donations
Body: {
  "title": "Used Sofa",
  "description": "Comfortable 3-seater sofa in good condition",
  "category": "furniture",
  "donation_type": "give_away",
  "location": "Munich"
}
```

#### Claim Donation
```
POST /api/donations/:donationId/claim
```

## Mini-Jobs

#### Get Jobs
```
GET /api/jobs?status=open&is_youth_friendly=true
```

#### Create Job
```
POST /api/jobs
Body: {
  "title": "Help with yard work",
  "description": "Need help raking leaves",
  "category": "gardening",
  "payment_type": "cash",
  "payment_amount": 20,
  "is_youth_friendly": true
}
```

#### Apply for Job
```
POST /api/jobs/:jobId/apply
```

## Time Credits

#### Get Balance
```
GET /api/credits/balance
```

Response:
```json
{
  "balance": 50
}
```

#### Get Transactions
```
GET /api/credits/transactions
```

#### Transfer Credits
```
POST /api/credits/transfer
Body: {
  "to_user_id": "uuid",
  "amount": 10,
  "description": "Thanks for the help!"
}
```

#### Get Leaderboard
```
GET /api/credits/leaderboard
```

## Calendar & Events

#### Get Calendar Events
```
GET /api/calendar/events?start_date=2024-01-01&end_date=2024-12-31
```

#### Get Holidays
```
GET /api/calendar/holidays?country=Germany&year=2024
```

#### Get Upcoming Holidays
```
GET /api/calendar/holidays/upcoming?days=30
```

Response:
```json
{
  "holidays": [
    {
      "name": "Christmas Day",
      "date": "2024-12-25",
      "description": "Celebration of Jesus' birth",
      "cultural_context": "Religious observances and family time",
      "is_public_holiday": true
    }
  ]
}
```

#### Sync Google Calendar
```
POST /api/calendar/sync/google
```

#### Create Calendar Event
```
POST /api/calendar/events
Body: {
  "title": "Community Meetup",
  "description": "Monthly neighborhood gathering",
  "start_time": "2024-12-15T18:00:00Z",
  "end_time": "2024-12-15T20:00:00Z",
  "location": "Community Center"
}
```

## Notifications

#### Get Notifications
```
GET /api/notifications?is_read=false&limit=50
```

#### Mark as Read
```
PUT /api/notifications/:notificationId/read
```

#### Mark All as Read
```
PUT /api/notifications/mark-all-read
```

#### Get Unread Count
```
GET /api/notifications/unread/count
```

## Ratings & Reviews

#### Get User Ratings
```
GET /api/ratings/user/:userId
```

#### Create Rating
```
POST /api/ratings
Body: {
  "ratee_id": "uuid",
  "reference_type": "task",
  "reference_id": "task_uuid",
  "rating": 5,
  "review": "Excellent helper, very reliable!",
  "tags": ["reliable", "friendly"]
}
```

## Feedback

#### Submit Feedback
```
POST /api/feedback
Body: {
  "subject": "Feature Request",
  "message": "It would be great to have...",
  "category": "feature"
}
```

## Error Responses

All endpoints may return the following error responses:

```json
{
  "error": "Error message description"
}
```

Common status codes:
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

## Rate Limiting

API requests are limited to 100 requests per 15 minutes per IP address.

## WebSocket Events

Connect to: `http://localhost:5000`

Events:
- `new_task` - New task posted
- `user_{userId}` - User-specific notifications
- `task_accepted` - Task was accepted
- `credits_received` - Credits transferred to you

---

For more details, check the source code in `/backend/src/routes/`
