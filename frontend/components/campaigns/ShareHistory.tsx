'use client'

import { FaFacebook, FaLinkedin, FaInstagram, FaTiktok } from 'react-icons/fa'
import type { IconType } from 'react-icons'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ShareEvent {
  platform: string
  sharedAt: Date | string
}

interface ShareHistoryProps {
  events: ShareEvent[]
}

// ─── Platform Config ────────────────────────────────────────────────────────────

const PLATFORM_CONFIG: Record<string, { icon: IconType; color: string; bg: string; border: string }> = {
  Facebook: {
    icon: FaFacebook,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/25',
  },
  LinkedIn: {
    icon: FaLinkedin,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/25',
  },
  Instagram: {
    icon: FaInstagram,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/25',
  },
  TikTok: {
    icon: FaTiktok,
    color: 'text-slate-300',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/25',
  },
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function ShareHistory({ events }: ShareHistoryProps) {
  if (events.length === 0) return null

  return (
    <div className="mt-4 flex flex-col gap-2">
      {/* Divider header */}
      <div className="flex items-center gap-2 mb-1">
        <div className="h-px flex-1 bg-white/[0.06]" />
        <span className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase">
          Share History
        </span>
        <div className="h-px flex-1 bg-white/[0.06]" />
      </div>

      {/* Timeline rows */}
      <div className="flex flex-col gap-1.5">
        {events.map((event, idx) => {
          const config = PLATFORM_CONFIG[event.platform] ?? {
            icon: FaFacebook,
            color: 'text-slate-400',
            bg: 'bg-white/[0.04]',
            border: 'border-white/[0.08]',
          }
          const Icon = config.icon
          const time = new Date(event.sharedAt).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
          })
          const date = new Date(event.sharedAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
          })

          return (
            <div
              key={idx}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${config.bg} ${config.border} transition-all`}
            >
              <div className={`shrink-0 ${config.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold ${config.color}`}>{event.platform}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Shared on {date}</p>
              </div>
              <div className={`shrink-0 px-2 py-1 rounded-md ${config.bg} border ${config.border}`}>
                <span className={`text-[10px] font-mono font-semibold ${config.color}`}>{time}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
