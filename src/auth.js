
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
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.toString().toLowerCase().trim();
        const password = credentials.password.toString();

        if (!email || !password) {
          return null;
        }

        const clientIp = getClientIp(request);

        const rateLimitIdentifier = createRateLimitIdentifier(
          "login",
          `${clientIp}:${email}`
        );

        const rateLimitResult =
          await loginRateLimit.limit(rateLimitIdentifier);

        if (!rateLimitResult.success) {
          return null;
        }

        await connectDB();

        const user = await User.findOne({ email }).select("+password");

        // Admin-blocked accounts must not be able to log in.
        if (!user || !user.isActive || !user.password) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(
          password,
          user.password
        );

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          sessionVersion: user.sessionVersion ?? 0,
          membershipAccessLocked:
            user.role === "member"
              ? user.membershipAccessLocked === true
              : false,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  useSecureCookies: process.env.NODE_ENV === "production",

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.sessionVersion = user.sessionVersion ?? 0;
      }

      if (!token.id || token.sessionVersion === undefined) {
        return null;
      }

      await connectDB();

      // Always recheck the current account status.
      const currentUser = await User.findById(token.id)
        .select("role isActive sessionVersion membershipAccessLocked")
        .lean();

      // Inactive accounts and invalidated sessions must be rejected.
      if (
        !currentUser ||
        !currentUser.isActive ||
        currentUser.role !== token.role ||
        (currentUser.sessionVersion ?? 0) !== token.sessionVersion
      ) {
        return null;
      }

      // Refresh this flag from the database rather than trusting
      // an old JWT value.
      token.membershipAccessLocked =
        currentUser.role === "member"
          ? currentUser.membershipAccessLocked === true
          : false;

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.membershipAccessLocked =
          token.membershipAccessLocked === true;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
});
