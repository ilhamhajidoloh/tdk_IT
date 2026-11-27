export default function SkeletonTeacherPortal() {
  return (
    <div className="min-h-screen flex flex-col relative bg-background">
      <div className="pointer-events-none fixed inset-0 grid-backdrop opacity-50 -z-10" />

      {/* Header Skeleton */}
      <header className="border-b border-border bg-card/85 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-muted animate-pulse shrink-0 border border-border" />
            <div className="min-w-0 flex flex-col gap-1.5">
              <div className="w-24 h-4 bg-muted rounded animate-pulse" />
              <div className="w-32 h-3 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="hidden md:flex w-40 h-8 bg-muted rounded-full animate-pulse" />
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 bg-muted rounded-xl animate-pulse" />
            <div className="w-9 h-9 bg-muted rounded-xl animate-pulse" />
            <div className="w-24 h-9 bg-muted rounded-xl animate-pulse hidden sm:block" />
          </div>
        </div>
      </header>

      {/* Tab Nav Skeleton */}
      <div className="sticky top-16 z-20 border-b border-border bg-card/75 backdrop-blur-xl py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="w-28 h-9 bg-muted rounded-xl animate-pulse shrink-0" />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        <div className="space-y-5">
          <div className="ui-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-muted animate-pulse shrink-0" />
              <div className="flex flex-col gap-1.5">
                <div className="w-24 h-4 bg-muted rounded animate-pulse" />
                <div className="w-40 h-3 bg-muted rounded animate-pulse" />
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-muted rounded-xl animate-pulse border border-border" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
