import type { Metadata } from "next"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { RegisterForm } from "./register-form"

export const metadata: Metadata = {
  title: "Регистрация",
  description: "Создайте новый аккаунт",
}

export default function RegisterPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Link href="/" className={cn(buttonVariants({ variant: "ghost" }), "absolute left-4 top-4 md:left-8 md:top-8")}>
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-4 w-4"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Назад
        </>
      </Link>
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Создать аккаунт</h1>
          <p className="text-sm text-muted-foreground">Введите свои данные ниже, чтобы создать аккаунт</p>
        </div>
        <RegisterForm />
        <p className="px-8 text-center text-sm text-muted-foreground">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="underline underline-offset-4 hover:text-primary">
            Войти
          </Link>
        </p>
      </div>
    </div>
  )
}

