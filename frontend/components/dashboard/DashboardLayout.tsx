'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import {
  LayoutDashboard,
  Sparkles,
  LogOut,
  ChevronRight,
  Zap,
  User,
  Menu,
  X,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview',  href: '/dashboard',            icon: LayoutDashboard },
  { label: 'Campaigns', href: '/dashboard/campaigns',  icon: Sparkles        },
  { label: 'Profile',   href: '/dashboard/profile',    icon: User            },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

// ─── Shared nav link ──────────────────────────────────────────────────────────
function NavLink({
  item,
  isActive,
  onClick,
}: {
  item: NavItem
  isActive: boolean
  onClick?: () => void
}) {
  const { label, href, icon: Icon } = item
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
        isActive
          ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
          : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
      }`}
    >
      <Icon
        className={`w-4 h-4 shrink-0 ${
          isActive ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300'
        }`}
      />
      {label}
      {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-violet-400" />}
    </Link>
  )
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  const closeMobile = () => setMobileOpen(false)

  // ── Sidebar content (reused for desktop + drawer) ─────────────────────────
  const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/[0.07]">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md shadow-violet-500/30 shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-bold text-white tracking-tight">
          AI<span className="text-violet-400">ContentOps</span>
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={isActive(item.href)}
            onClick={onNavClick}
          />
        ))}
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
            <p className="text-xs text-slate-500">{user?.credits ?? 0} credits</p>
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
    </>
  )

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">

      {/* ── Desktop sidebar (hidden on mobile) ─────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-white/[0.07] bg-slate-950">
        <SidebarContent />
      </aside>

      {/* ── Mobile drawer backdrop ──────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile drawer ────────────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-slate-950 border-r border-white/[0.07] transition-transform duration-300 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close button */}
        <button
          onClick={closeMobile}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent onNavClick={closeMobile} />
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07] bg-slate-950 md:hidden shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold text-white">
              AI<span className="text-violet-400">ContentOps</span>
            </span>
          </div>
        </header>

        {/* Page content */}
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
          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
