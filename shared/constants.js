// Task Categories
const TASK_CATEGORIES = {
  CLEANING: 'cleaning',
  DOG_WALKING: 'dog_walking',
  GROCERIES: 'groceries',
  ERRANDS: 'errands',
  GARDENING: 'gardening',
  TECH_HELP: 'tech_help',
  TRANSPORTATION: 'transportation',
  GENERAL: 'general'
};

// Task Status
const TASK_STATUS = {
  OPEN: 'open',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Payment Types
const PAYMENT_TYPES = {
  CREDITS: 'credits',
  CASH: 'cash',
  VOLUNTEER: 'volunteer'
};

// User Roles
const USER_ROLES = {
  USER: 'user',
  VERIFIED: 'verified',
  MODERATOR: 'moderator',
  ADMIN: 'admin'
};

// Forum Categories
const FORUM_CATEGORIES = {
  GENERAL: 'general',
  LOST_PET: 'lost_pet',
  GARAGE_SALE: 'garage_sale',
  LOCAL_NEWS: 'local_news',
  EVENTS: 'events',
  SAFETY: 'safety',
  RECOMMENDATIONS: 'recommendations'
};

// Event Types
const EVENT_TYPES = {
  COMMUNITY: 'community',
  SOCIAL: 'social',
  SPORTS: 'sports',
  CULTURAL: 'cultural',
  EDUCATIONAL: 'educational',
  CHARITY: 'charity'
};

// Donation Types
const DONATION_TYPES = {
  GIVE_AWAY: 'give_away',
  LEND: 'lend',
  SWAP: 'swap',
  FOOD_SHARE: 'food_share'
};

// Notification Types
const NOTIFICATION_TYPES = {
  TASK_ACCEPTED: 'task_accepted',
  TASK_COMPLETED: 'task_completed',
  NEW_MESSAGE: 'new_message',
  CREDITS_RECEIVED: 'credits_received',
  NEW_RATING: 'new_rating',
  EVENT_REMINDER: 'event_reminder',
  HOLIDAY_REMINDER: 'holiday_reminder',
  VERIFICATION_APPROVED: 'verification_approved'
};

// Priority Levels
const PRIORITY_LEVELS = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
};

module.exports = {
  TASK_CATEGORIES,
  TASK_STATUS,
  PAYMENT_TYPES,
  USER_ROLES,
  FORUM_CATEGORIES,
  EVENT_TYPES,
  DONATION_TYPES,
  NOTIFICATION_TYPES,
  PRIORITY_LEVELS
};
