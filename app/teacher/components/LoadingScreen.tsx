export default function LoadingScreen({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 grid-backdrop opacity-60 -z-10" />
      <div className="flex flex-col items-center gap-5 animate-fade-in-scale">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-border" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
        </div>
        <div className="text-center">
          <p className="brand-text font-extrabold text-lg">{title}</p>
          {subtitle && <p className="text-muted-foreground text-sm mt-2 font-medium">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
