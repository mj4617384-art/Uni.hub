export default function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0B1D3A] to-[#13294B] px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F6F5F1]/10 backdrop-blur-sm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#F6F5F1"
          strokeWidth="1.5"
          className="h-8 w-8"
        >
          <path d="M12 3L2 8l10 5 10-5-10-5z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 10.5V16c0 1 2.5 3 6 3s6-2 6-3v-5.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-[#F6F5F1] sm:text-4xl">
        Uni.hub
      </h1>
      <p className="mt-3 max-w-xs text-sm text-[#F6F5F1]/70 sm:text-base">
        Your campus, all in one place. We're building something good — check back soon.
      </p>

      <div className="mt-8 flex gap-1.5">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#F6F5F1]/80" style={{ animationDelay: "0ms" }} />
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#F6F5F1]/80" style={{ animationDelay: "200ms" }} />
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#F6F5F1]/80" style={{ animationDelay: "400ms" }} />
      </div>
    </div>
  );
}
