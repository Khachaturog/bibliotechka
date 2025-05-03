import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import YandexMetrika from "@/components/yandex-metrika"
import AnalyticsProvider from "@/components/analytics-provider"
import { Suspense } from "react"
import { Header } from "@/components/header"

const inter = Inter({ subsets: ["latin", "cyrillic"] })

export const metadata = {
  title: "Библиотечка - Коллекция полезных ресурсов",
  description: "Библиотека полезных ресурсов, статей и материалов",
    generator: 'v0.dev'
}

export default function RootLayout({ children }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <YandexMetrika />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <Suspense>
            <AnalyticsProvider>
              <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1">{children}</main>
              </div>
            </AnalyticsProvider>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  )
}
