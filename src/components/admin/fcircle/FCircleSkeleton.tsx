"use client";

export function FCircleSkeleton() {
  return (
    <div className="h-full flex flex-col overflow-hidden -m-4 lg:-m-8 animate-pulse">
      <div className="flex-1 min-h-0 flex flex-col mx-6 mt-5 mb-2 bg-card border border-border/60 rounded-xl overflow-hidden">
        <div className="shrink-0 px-5 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-6 w-32 bg-muted rounded-md" />
              <div className="h-3 w-48 bg-muted/40 rounded mt-2" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-28 bg-muted/30 rounded-lg" />
              <div className="h-9 w-24 bg-primary/20 rounded-lg" />
            </div>
          </div>
        </div>

        <div className="shrink-0 px-5 pb-3 flex gap-3">
          <div className="h-16 w-40 bg-muted/30 rounded-lg" />
          <div className="h-16 w-40 bg-muted/30 rounded-lg" />
          <div className="h-16 w-40 bg-muted/30 rounded-lg" />
        </div>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden border-t border-border/40">
          <div className="h-10 border-b border-border/40 bg-muted/10" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border/20">
              <div className="w-8 h-8 bg-muted/40 rounded-full shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-4 w-3/5 bg-muted/40 rounded" />
                <div className="h-3 w-2/5 bg-muted/20 rounded mt-1.5" />
              </div>
              <div className="h-4 w-24 bg-muted/20 rounded hidden sm:block" />
              <div className="h-4 w-32 bg-muted/20 rounded hidden md:block" />
            </div>
          ))}
        </div>

        <div className="shrink-0 flex items-center justify-between px-5 py-3 border-t border-border/30">
          <div className="h-4 w-32 bg-muted/30 rounded" />
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-7 h-7 bg-muted/30 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
