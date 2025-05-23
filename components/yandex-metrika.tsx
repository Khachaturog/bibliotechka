"use client"

import { useEffect } from "react"
import Script from "next/script"

export default function YandexMetrika() {
  useEffect(() => {
    // Инициализация Яндекс Метрики после загрузки скрипта
    const initYandexMetrika = () => {
      if (typeof window !== "undefined" && (window as any).ym) {
        ;(window as any).ym(101553574, "init", {
          clickmap: true,
          trackLinks: true,
          accurateTrackBounce: true,
          webvisor: true,
        })
      }
    }

    // Если скрипт уже загружен, инициализируем метрику
    if (typeof window !== "undefined" && (window as any).ym) {
      initYandexMetrika()
    }
  }, [])

  return (
    <>
      <Script
        id="yandex-metrika"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
            (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

            ym(101553574, "init", {
                clickmap:true,
                trackLinks:true,
                accurateTrackBounce:true,
                webvisor:true
            });
          `,
        }}
      />
      <noscript>
        <div>
          <img src="https://mc.yandex.ru/watch/101553574" style={{ position: "absolute", left: "-9999px" }} alt="" />
        </div>
      </noscript>
    </>
  )
}
