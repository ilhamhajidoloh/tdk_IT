export default function SkeletonTeacherPortal() {
  return (
    <div className="min-h-screen flex flex-col relative bg-background">
      <div className="pointer-events-none fixed inset-0 grid-backdrop opacity-50 -z-10" />

      {/* Header Skeleton */}
      <header className="header-gradient border-b border-border sticky top-0 z-20">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-muted animate-pulse shrink-0 border border-border" />
            <div className="min-w-0 flex flex-col gap-1.5">
              <div className="w-24 h-4 bg-muted rounded animate-pulse" />
              <div className="w-32 h-3 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="hidden sm:flex w-40 h-8 bg-muted rounded-2xl animate-pulse" />
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 bg-muted rounded-xl animate-pulse" />
            <div className="w-9 h-9 bg-muted rounded-xl animate-pulse" />
            <div className="w-24 h-9 bg-muted rounded-xl animate-pulse hidden sm:block" />
          </div>
        </div>
      </header>

      {/* Tab Nav Skeleton */}
      <div className="sticky top-16 z-10 py-3">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-1.5 overflow-x-auto scrollbar-none bg-muted/60 backdrop-blur-sm rounded-2xl p-1.5 border border-border shadow-sm">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-28 h-10 bg-muted rounded-xl animate-pulse shrink-0" />
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 py-6">
        <div className="space-y-5">
          <div className="card-modern overflow-hidden border-border">
            <div className="px-5 py-4 border-b border-border/60 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-muted animate-pulse shrink-0" />
              <div className="flex flex-col gap-1.5">
                <div className="w-24 h-4 bg-muted rounded animate-pulse" />
                <div className="w-40 h-3 bg-muted rounded animate-pulse" />
              </div>
            </div>
            <div className="p-5">
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-32 sm:w-40 h-16 bg-muted rounded-xl animate-pulse border border-border" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
