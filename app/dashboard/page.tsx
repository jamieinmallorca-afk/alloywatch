export default function Dashboard() {
  return (
    <main className="min-h-screen bg-[#080c0a] text-white flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="text-4xl mb-6">◈</div>
        <h1 className="text-2xl font-bold mb-3">AlloyWatch Dashboard</h1>
        <p className="text-white/50 mb-8">
          Full materials intelligence dashboard — lead times, supplier health,
          commodity prices, and geopolitical alerts across 30 aerospace materials.
        </p>
        <button className="btn-primary w-full">
          Create free account →
        </button>
        <p className="text-xs text-white/30 mt-4 font-mono">
          Free tier includes 5 materials with 30-day lagged data. No credit card required.
        </p>
      </div>
    </main>
  )
}
