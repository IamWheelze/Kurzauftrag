const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { pool } = require('./database');
const logger = require('./logger');

const configurePassport = (passport) => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_REDIRECT_URI || '/api/auth/google/callback'
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;
          const displayName = profile.displayName;
          const googleId = profile.id;
          const photo = profile.photos[0]?.value;

          // Check if user exists
          let result = await pool.query(
            'SELECT * FROM users WHERE google_id = $1',
            [googleId]
          );

          let user = result.rows[0];

          if (!user) {
            // Create new user
            result = await pool.query(
              `INSERT INTO users (email, name, google_id, profile_picture, auth_provider)
               VALUES ($1, $2, $3, $4, 'google')
               RETURNING *`,
              [email, displayName, googleId, photo]
            );
            user = result.rows[0];
            logger.info(`New user registered: ${email}`);
          } else {
            // Update last login
            await pool.query(
              'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
              [user.id]
            );
          }

          // Store Google tokens for calendar access
          await pool.query(
            `INSERT INTO user_tokens (user_id, access_token, refresh_token, provider)
             VALUES ($1, $2, $3, 'google')
             ON CONFLICT (user_id, provider)
             DO UPDATE SET access_token = $2, refresh_token = $3, updated_at = CURRENT_TIMESTAMP`,
            [user.id, accessToken, refreshToken]
          );

          return done(null, user);
        } catch (error) {
          logger.error('Google auth error:', error);
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      done(null, result.rows[0]);
    } catch (error) {
      done(error, null);
    }
  });
};

module.exports = { configurePassport };
