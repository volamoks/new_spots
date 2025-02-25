import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcrypt"
import { prisma } from "./prisma"

if (!process.env.NEXTAUTH_SECRET) {
  console.error("NEXTAUTH_SECRET is not set in the environment variables")
  throw new Error("NEXTAUTH_SECRET must be set")
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error("Missing email or password")
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          console.error("User not found")
          return null
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          console.error("Invalid password")
          return null
        }

        if (user.role === "CATEGORY_MANAGER" && user.status !== "ACTIVE") {
          console.error("Category Manager account not active")
          throw new Error("Your account is pending approval or has been rejected")
        }

        console.log("Authentication successful", { userId: user.id, role: user.role })
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          category: user.category,
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      console.log("JWT Callback - User:", user ? JSON.stringify(user) : "No user");
      console.log("JWT Callback - Token before:", JSON.stringify(token));
      
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
        token.category = user.category;
      }
      
      console.log("JWT Callback - Token after:", JSON.stringify(token));
      return token;
    },
    session: async ({ session, token }) => {
      console.log("Session Callback - Token:", JSON.stringify(token));
      console.log("Session Callback - Session before:", JSON.stringify(session));
      
      if (token) {
        session.user.id = token.sub || token.id as string;
        session.user.role = token.role;
        session.user.status = token.status;
        session.user.category = token.category;
      }
      
      console.log("Session Callback - Session after:", JSON.stringify(session));
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}
