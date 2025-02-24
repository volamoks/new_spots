"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function useAuth(requiredRole?: string) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/login")
    } else if (requiredRole && session.user.role !== requiredRole) {
      router.push("/")
    }
  }, [session, status, requiredRole, router])

  return {
    session,
    isLoading: status === "loading",
    isAuthenticated: !!session,
    user: session?.user,
  }
}

