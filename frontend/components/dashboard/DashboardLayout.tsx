'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import {
  LayoutDashboard,
  Sparkles,
  LogOut,
  ChevronRight,
  Zap,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Campaigns', href: '/dashboard/campaigns', icon: Sparkles },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="flex flex-col w-64 shrink-0 border-r border-white/[0.07] bg-slate-950">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/[0.07]">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md shadow-violet-500/30">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-white tracking-tight">
            AI<span className="text-violet-400">ContentOps</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive =
              href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                    : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300'}`}
                />
                {label}
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-violet-400" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="px-3 py-4 border-t border-white/[0.07]">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30 shrink-0">
              <span className="text-xs font-bold text-violet-300">
                {user?.email?.[0]?.toUpperCase() ?? 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">
                {user?.email ?? 'Loading...'}
              </p>
              <p className="text-xs text-slate-500">
                {user?.credits ?? 0} credits
              </p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Subtle grid texture */}
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        <div className="relative z-10 max-w-5xl mx-auto px-8 py-10">
          {children}
        </div>
      </main>
    </div>
  )
}
