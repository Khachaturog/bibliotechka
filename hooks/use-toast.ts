"use client"

import { useState, createContext, useContext } from "react"

const ToastContext = createContext({
  toast: ({ title, description, variant }) => {},
})

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = ({ title, description, variant = "default" }) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, title, description, variant }])

    // Автоматически удаляем toast через 5 секунд
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-4 rounded-md shadow-lg transition-all transform translate-y-0 opacity-100 ${
              t.variant === "destructive"
                ? "bg-red-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            }`}
          >
            {t.title && <h4 className="font-medium">{t.title}</h4>}
            {t.description && <p className="text-sm mt-1">{t.description}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
