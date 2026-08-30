import dotenv from "dotenv";

dotenv.config();

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";


passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },

    async (
      accessToken,
      refreshToken,
      profile,
      done
    ) => {
      try {
        const googleUser = {
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails?.[0]?.value,
          profileImage: profile.photos?.[0]?.value,
        };

        return done(null, googleUser);

      } catch (error) {
        console.log(
          "Google strategy error:",
          error
        );

        return done(error, null);
      }
    }
  )
);

export default passport;