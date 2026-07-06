export default function LoadingScreen({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-5 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-backdrop opacity-60" />
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-border" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
      </div>
      <div className="text-center relative z-10">
        <p className="text-foreground font-bold text-lg">{title}</p>
        {subtitle && <p className="text-muted-foreground text-sm mt-1.5">{subtitle}</p>}
      </div>
    </div>
  );
}
