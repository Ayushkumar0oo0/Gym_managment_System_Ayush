import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import {
  loginRateLimit,
  getClientIp,
  createRateLimitIdentifier,
} from "@/lib/rateLimit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },

        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials, request) {
        console.log("========== LOGIN START ==========");

        /*
         * 1. BASIC INPUT CHECK
         */

        if (!credentials?.email || !credentials?.password) {
          console.log("LOGIN FAILED: Missing email or password");
          return null;
        }

        const email = credentials.email
          .toString()
          .toLowerCase()
          .trim();

        const password = credentials.password.toString();

        console.log("LOGIN EMAIL:", email);

        if (!email || !password) {
          console.log("LOGIN FAILED: Empty email or password");
          return null;
        }

        /*
         * 2. RATE LIMIT
         */

        const clientIp = getClientIp(request);

        const rateLimitIdentifier = createRateLimitIdentifier(
          "login",
          `${clientIp}:${email}`
        );

        const rateLimitResult = await loginRateLimit.limit(
          rateLimitIdentifier
        );

        console.log(
          "RATE LIMIT:",
          rateLimitResult.success,
          "remaining:",
          rateLimitResult.remaining
        );

        if (!rateLimitResult.success) {
          console.warn("LOGIN FAILED: RATE LIMIT EXCEEDED");
          return null;
        }

        /*
         * 3. DATABASE
         */

        console.log("Connecting to database...");

        await connectDB();

        console.log("Database connected");

        /*
         * 4. FIND USER
         */

        const user = await User.findOne({
          email,
        }).select("+password");

        if (!user) {
          console.log("LOGIN FAILED: USER NOT FOUND");
          return null;
        }

        console.log("USER FOUND:", {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          hasPasswordHash: Boolean(user.password),
        });

        /*
         * 5. ACCOUNT STATUS
         */

        if (!user.isActive) {
          console.log("LOGIN FAILED: USER ACCOUNT IS INACTIVE");
          return null;
        }

        /*
         * 6. PASSWORD
         */

        const passwordMatch = await bcrypt.compare(
          password,
          user.password
        );

        console.log("PASSWORD MATCH:", passwordMatch);

        if (!passwordMatch) {
          console.log("LOGIN FAILED: PASSWORD DOES NOT MATCH");
          return null;
        }

        /*
         * 7. SUCCESS
         */

        const safeUser = {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };

        console.log("LOGIN SUCCESS:", safeUser);
        console.log("========== LOGIN END ==========");

        return safeUser;
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
});