"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserCircle } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function Navigation() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // const handleRoleChange = async (role: string) => {
  //   // Here you would typically make an API call to update the user's role
  //   console.log(`Changing role to: ${role}`)
  //   // After updating, you might want to refresh the session
  //   // This is a placeholder and would need to be implemented
  // }

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push("/login")
  }

  const renderRoleSpecificLinks = (role: string) => {
    switch (role) {
      case "SUPPLIER":
        return (
          <>
            <Link href="/zones">
              <Button variant="ghost">Зоны продажи</Button>
            </Link>
            <Link href="/supplier">
              <Button variant="ghost">Создать бронирование</Button>
            </Link>
            <Link href="/supplier/bookings">
              <Button variant="ghost">Мои бронирования</Button>
            </Link>
          </>
        )
      case "CATEGORY_MANAGER":
        return (
          <Link href="/category-manager">
            <Button variant="ghost">Панель КМ</Button>
          </Link>
        )
      case "DMP_MANAGER":
        return (
          <>
            <Link href="/dmp-manager">
              <Button variant="ghost">Панель ДМП</Button>
            </Link>
            <Link href="/dmp-manager/upload">
              <Button variant="ghost">Загрузка данных</Button>
            </Link>
            <Link href="/dmp-manager/verify-km">
              <Button variant="ghost">Подтверждение КМ</Button>
            </Link>
          </>
        )
      default:
        return null
    }
  }

  return (
    <nav className="bg-primary text-primary-foreground p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          StoreSpotsBooking
        </Link>
        <div className="space-x-4 flex items-center">
          {status === "authenticated" && session?.user ? (
            <>
              {renderRoleSpecificLinks(session.user.role)}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost">
                    <UserCircle className="mr-2 h-4 w-4" />
                    {session.user.name}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/profile")}>Профиль</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>Выйти</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Войти</Button>
              </Link>
              <Link href="/register">
                <Button variant="ghost">Зарегистрироваться</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

