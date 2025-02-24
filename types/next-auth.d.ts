import "next-auth";
import type { DefaultSession } from 'next-auth';
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/adapters" {
  interface AdapterUser {
    id: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | null;
    image?: string | null;
    role: Role;
  }
}
