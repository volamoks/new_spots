import "next-auth";
import type { DefaultSession } from 'next-auth';
import { Role, UserStatus } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      status: UserStatus;
      category: string | null;
      inn: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    status: UserStatus;
    category: string | null;
    inn: string | null;
  }
}

declare module "next-auth/jwt" {
    interface JWT {
        role: Role;
        status: UserStatus;
        category: string | null;
        inn: string | null;
    }
}
