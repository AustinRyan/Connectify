// src/pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "../../../../prisma";
import { compare } from "bcryptjs";
import jwt from "jsonwebtoken";

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (user && (await compare(credentials.password, user.password))) {
            const accessToken = jwt.sign(
              { userId: user.id, email: user.email },
              process.env.NEXTAUTH_SECRET, // Ensure you have a secret key in your environment variables
              { expiresIn: "365d" } // Token expiration time
            );
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              username: user.username,
              accessToken,
            };
          } else {
            return null;
          }
        } catch (error) {
          console.error("Authorize error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: null,
  },
  session: {
    jwt: true,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.username = user.username;
        token.accessToken = user.accessToken;
      }
      console.log("JWT Callback - Token:", token); // Debug log
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.name = token.name;
      session.user.email = token.email;
      session.user.username = token.username;
      session.accessToken = token.accessToken;
      console.log("Session Callback - Session:", session); // Debug log
      return session;
    },
  },
  debug: true,
});
