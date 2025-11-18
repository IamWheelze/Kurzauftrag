const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// Create transporter
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Email templates
const templates = {
  welcome: (user) => ({
    subject: 'Welcome to Community Services Platform! 🎉',
    html: `
      <h1>Welcome ${user.name}!</h1>
      <p>Thank you for joining our community platform.</p>
      <p>You're now part of a network of neighbors helping neighbors.</p>
      <h2>Get Started:</h2>
      <ul>
        <li>Complete your profile</li>
        <li>Browse available tasks</li>
        <li>Join community discussions</li>
        <li>Earn time credits by helping others</li>
      </ul>
      <p>Start earning credits today!</p>
      <a href="${process.env.FRONTEND_URL}">Visit Platform</a>
    `
  }),

  taskAssigned: (user, task) => ({
    subject: `New Task Assignment: ${task.title}`,
    html: `
      <h1>You have a new task!</h1>
      <p>Hi ${user.name},</p>
      <p>Someone accepted your task request:</p>
      <h2>${task.title}</h2>
      <p>${task.description}</p>
      <p><strong>Credits offered:</strong> ${task.credits_offered}</p>
      <p><strong>Location:</strong> ${task.location}</p>
      <a href="${process.env.FRONTEND_URL}/tasks/${task.id}">View Task Details</a>
    `
  }),

  taskCompleted: (user, task) => ({
    subject: `Task Completed: ${task.title}`,
    html: `
      <h1>Task Completed! ✅</h1>
      <p>Hi ${user.name},</p>
      <p>Great news! Your task "${task.title}" has been marked as complete.</p>
      <p>Don't forget to rate your helper to build trust in the community!</p>
      <a href="${process.env.FRONTEND_URL}/tasks/${task.id}">Rate & Review</a>
    `
  }),

  creditsReceived: (user, amount, fromUser) => ({
    subject: `You received ${amount} time credits!`,
    html: `
      <h1>Credits Received! ⭐</h1>
      <p>Hi ${user.name},</p>
      <p>You received <strong>${amount} time credits</strong> from ${fromUser}.</p>
      <p>Your new balance: Check your account</p>
      <a href="${process.env.FRONTEND_URL}/credits">View Credits</a>
    `
  }),

  holidayReminder: (user, holiday) => ({
    subject: `Upcoming Holiday: ${holiday.name} 📅`,
    html: `
      <h1>${holiday.name}</h1>
      <p>Hi ${user.name},</p>
      <p><strong>Date:</strong> ${new Date(holiday.date).toLocaleDateString()}</p>
      <p><strong>About:</strong> ${holiday.description}</p>
      ${holiday.cultural_context ? `
        <h3>Cultural Context:</h3>
        <p>${holiday.cultural_context}</p>
      ` : ''}
      ${holiday.traditions && holiday.traditions.length > 0 ? `
        <h3>Traditions:</h3>
        <ul>
          ${holiday.traditions.map(t => `<li>${t}</li>`).join('')}
        </ul>
      ` : ''}
      <p>Mark your calendar! 🎉</p>
    `
  }),

  verificationApproved: (user) => ({
    subject: 'Your Account is Verified! 🎉',
    html: `
      <h1>Congratulations ${user.name}!</h1>
      <p>Your account has been verified.</p>
      <p>You've received <strong>50 time credits</strong> as a welcome bonus!</p>
      <p>Verified users have access to:</p>
      <ul>
        <li>Higher trust ratings</li>
        <li>Premium features</li>
        <li>Priority support</li>
        <li>Exclusive community events</li>
      </ul>
      <a href="${process.env.FRONTEND_URL}/profile">View Profile</a>
    `
  }),

  eventReminder: (user, event) => ({
    subject: `Event Reminder: ${event.title} 📅`,
    html: `
      <h1>Event Tomorrow!</h1>
      <p>Hi ${user.name},</p>
      <p>This is a reminder about the event you registered for:</p>
      <h2>${event.title}</h2>
      <p><strong>Date:</strong> ${new Date(event.start_date).toLocaleString()}</p>
      <p><strong>Location:</strong> ${event.location}</p>
      <p>${event.description}</p>
      <a href="${process.env.FRONTEND_URL}/events/${event.id}">View Event Details</a>
    `
  }),

  newMessage: (user, fromUser, message) => ({
    subject: `New message from ${fromUser.name}`,
    html: `
      <h1>You have a new message</h1>
      <p>Hi ${user.name},</p>
      <p><strong>${fromUser.name}</strong> sent you a message:</p>
      <blockquote>${message.content}</blockquote>
      <a href="${process.env.FRONTEND_URL}/messages/${fromUser.id}">Reply to Message</a>
    `
  })
};

// Send email function
async function sendEmail(to, template, data) {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      logger.warn('Email service not configured. Skipping email.');
      return;
    }

    const emailContent = templates[template](data);

    const mailOptions = {
      from: `"Community Services" <${process.env.SMTP_USER}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${to}: ${emailContent.subject}`);
  } catch (error) {
    logger.error('Email sending error:', error);
  }
}

module.exports = { sendEmail, templates };
