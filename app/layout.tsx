import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Script from "next/script"
import { ReactNode } from "react"

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
        <Script
          id="yandex-metrika"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(m,e,t,r,i,k,a){
                  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                  m[i].l=1*new Date();
                  k=e.createElement(t),a=e.getElementsByTagName(t)[0],
                  k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
              })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

              ym(101553574, "init", {
                  clickmap:true,
                  trackLinks:true,
                  accurateTrackBounce:true,
                  webvisor:true
              });
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <noscript>
          <div>
            <img
              src="https://mc.yandex.ru/watch/101553574"
              style={{ position: "absolute", left: "-9999px" }}
              alt=""
            />
          </div>
        </noscript>
        
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
