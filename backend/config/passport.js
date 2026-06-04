import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

// Lazy Google strategy initialization — allows server.js to set
// GOOGLE_CALLBACK_URL after dynamic port discovery.
export const initGoogleStrategy = () => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️ Google OAuth strategy skipped — missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ email: profile.emails[0].value });

          if (!user) {
            user = await User.create({
              name: profile.displayName,
              email: profile.emails[0].value,
              avatar: profile.photos[0]?.value,
              googleId: profile.id,
              isVerified: true,
              role: 'user',
            });
          } else {
            if (!user.googleId) user.googleId = profile.id;
            user.avatar = profile.photos[0]?.value || user.avatar;
            user.name = profile.displayName || user.name;
          }

          user.lastLogin = new Date();
          await user.save();

          done(null, user);
        } catch (error) {
          done(error, false);
        }
      }
    )
  );

  console.log('✅ Google OAuth strategy initialized');
};

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (error) {
    done(error, false);
  }
});

export default passport;