export function FormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-4 w-24 bg-white/10 rounded-lg mb-3" />
        <div className="h-12 w-full bg-white/10 rounded-xl" />
        <div className="h-3 w-64 bg-white/5 rounded mt-2" />
      </div>
      <div>
        <div className="h-4 w-20 bg-white/10 rounded-lg mb-3" />
        <div className="h-28 w-full bg-white/10 rounded-xl" />
        <div className="h-3 w-48 bg-white/5 rounded mt-2" />
      </div>
      <div className="h-12 w-full bg-violet-500/20 rounded-xl" />
    </div>
  )
}

export function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-white/[0.04] border border-white/10 p-5 animate-pulse"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 h-4 bg-white/10 rounded-lg" />
            <div className="h-6 w-20 bg-white/10 rounded-full" />
          </div>
          <div className="h-3 w-24 bg-white/5 rounded mb-4" />
          <div className="h-20 bg-white/5 rounded-xl" />
        </div>
      ))}
    </div>
  )
}
