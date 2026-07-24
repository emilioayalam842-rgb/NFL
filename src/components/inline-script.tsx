// React 19 warns in dev when rendering produces a raw <script> tag directly
// (it looks like content, but only ever runs on the initial HTML parse, not
// on client re-renders). The documented workaround for scripts that must run
// before hydration (theme-flash prevention here) is to flip the `type` so
// the browser executes it during SSR but React sees an inert tag on the
// client. See: node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
