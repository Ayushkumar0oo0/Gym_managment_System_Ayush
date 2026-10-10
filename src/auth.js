
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
};
      },
    }),
  ],

  // Persist login across browser restarts for up to 30 days.
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  // Set secure cookie options in production.
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

  const currentUser = await User.findById(token.id)
    .select("role isActive sessionVersion")
    .lean();

  if (
    !currentUser ||
    !currentUser.isActive ||
    currentUser.role !== token.role ||
    (currentUser.sessionVersion ?? 0) !== token.sessionVersion
  ) {
    return null;
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
