export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative bg-navy overflow-hidden">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "repeating-linear-gradient(90deg, white 0 2px, transparent 2px 120px)",
        }}
      />
      <svg
        viewBox="0 0 200 120"
        className="absolute -right-16 -bottom-20 h-72 w-72 sm:h-96 sm:w-96 text-chalk/[0.06] rotate-[18deg]"
        fill="currentColor"
      >
        <ellipse cx="100" cy="60" rx="95" ry="55" />
        <g stroke="#041e42" strokeWidth="3" opacity="0.5">
          <line x1="60" y1="60" x2="140" y2="60" />
          <line x1="80" y1="48" x2="80" y2="72" />
          <line x1="95" y1="48" x2="95" y2="72" />
          <line x1="110" y1="48" x2="110" y2="72" />
          <line x1="125" y1="48" x2="125" y2="72" />
        </g>
      </svg>

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24 flex justify-center">
        <div className="w-full max-w-sm bg-chalk text-ink p-8 shadow-2xl">{children}</div>
      </div>
    </div>
  );
}
