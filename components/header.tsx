"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { ThemeToggle } from "./theme-toggle"
import { Button } from "./ui/button"
import { Mail, Plus, RefreshCw } from "lucide-react"
import { createClientComponentClient } from "@/utils/supabase/client"

export function Header() {
  const [logoUrl, setLogoUrl] = useState("/placeholder.svg?height=40&width=180&text=Библиотечка")
  const [isScrolled, setIsScrolled] = useState(false)

  // Загружаем логотип из Supabase
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const supabase = createClientComponentClient()
        const { data } = await supabase.storage.from("cover").getPublicUrl("logo.svg")

        if (data?.publicUrl) {
          setLogoUrl(data.publicUrl)
        }
      } catch (error) {
        console.error("Error fetching logo:", error)
      }
    }

    fetchLogo()
  }, [])

  // Добавляем тень к хедеру при скролле
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b bg-background transition-shadow duration-200 ${isScrolled ? "shadow-md" : ""}`}
    >
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src={logoUrl || "/placeholder.svg"}
              alt="Библиотечка"
              width={180}
              height={40}
              className="h-8 w-auto"
              unoptimized
            />
          </Link>

          <nav className="hidden md:flex items-center space-x-4">
            <Link
              href="/updates"
              className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Обновления
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2" asChild>
            <Link href="https://t.me/Khach_tur" target="_blank" rel="noopener noreferrer">
              <Mail className="h-4 w-4" />
              <span>Написать мне</span>
            </Link>
          </Button>

          <Button variant="default" size="sm" className="hidden sm:flex items-center gap-2" asChild>
            <Link href="https://t.me/Khach_tur" target="_blank" rel="noopener noreferrer">
              <Plus className="h-4 w-4" />
              <span>Предложить материал</span>
            </Link>
          </Button>

          {/* Мобильные кнопки */}
          <Button variant="ghost" size="icon" className="sm:hidden" asChild>
            <Link href="https://t.me/Khach_tur" target="_blank" rel="noopener noreferrer">
              <Mail className="h-5 w-5" />
              <span className="sr-only">Написать мне</span>
            </Link>
          </Button>

          <Button variant="ghost" size="icon" className="sm:hidden" asChild>
            <Link href="https://t.me/Khach_tur" target="_blank" rel="noopener noreferrer">
              <Plus className="h-5 w-5" />
              <span className="sr-only">Предложить материал</span>
            </Link>
          </Button>

          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
