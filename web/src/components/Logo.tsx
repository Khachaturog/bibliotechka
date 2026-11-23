export function Logo({ className = 'header-logo' }: { className?: string }) {
  return (
    <div className={className} aria-hidden>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
      >
        <path
          d="M17.4497 4.50582C23.25 4.84461 23.4156 10.7781 22.7138 13.2172C29.7324 10.9869 32.4228 14.1466 32.8908 16.0053C33.7331 20.4655 29.4984 21.813 27.2759 21.9291C31.7678 27.5044 29.6154 30.292 27.9777 30.9889C22.9244 32.3829 20.0232 28.7821 19.2044 26.8075C16.9584 31.5465 13.1216 31.8021 11.4839 31.3374C6.7112 29.9436 8.79338 24.949 10.4311 22.626C3.6932 21.5109 2.71059 18.2122 3.06152 16.7022C4.18451 11.1268 10.0802 12.0559 12.8876 13.2172C11.7647 5.96934 15.4611 4.38966 17.4497 4.50582Z"
          fill="#7767E5"
          stroke="#7767E5"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18.75 19.5L15.75 23.25"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14.25 18.75L18.75 19.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18 14.25L18.75 19.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M23.25 18L18.75 19.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18.75 19.5L22.5 22.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
