'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  CalendarClock,
  Send,
  Calendar,

  Video,
  Copy,
  FileText,
  AlertTriangle,
  Sparkles,
  Plus,
} from 'lucide-react'
import { FaLinkedin, FaInstagram, FaFacebook, FaTiktok } from 'react-icons/fa';

import { AiGeneration } from './types'
import { apiRequest } from '@/services/api.service'
import { ShareHistory, ShareEvent } from './ShareHistory'

// ─── Status Config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    icon: Clock,
    className: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  },
  processing: {
    label: 'Processing',
    icon: Loader2,
    className: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    spin: true,
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    className: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    className: 'bg-red-500/15 text-red-400 border border-red-500/20',
  },
  queued: {
    label: 'Scheduled',
    icon: CalendarClock,
    className: 'bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/20',
  },
  posted: {
    label: 'Posted',
    icon: Send,
    className: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20',
  },
}

// ─── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AiGeneration['status'] }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  const Icon = config.icon
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.className}`}
    >
      <Icon className={`w-3 h-3 ${'spin' in config ? 'animate-spin' : ''}`} />
      {config.label}
    </span>
  )
}

// ─── Campaign Card ─────────────────────────────────────────────────────────────

interface CampaignCardProps {
  campaign: AiGeneration
  isSelected: boolean
  onClick: (campaign: AiGeneration) => void
  onUpdateCampaign?: (campaign: AiGeneration) => void
}

function CampaignCard({ campaign, isSelected, onClick, onUpdateCampaign }: CampaignCardProps) {
  const [mode, setMode] = useState<'idle' | 'sharing' | 'scheduling'>('idle')
  const [scheduledAt, setScheduledAt] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [shareHistory, setShareHistory] = useState<ShareEvent[]>([])
  const [loadingPlatform, setLoadingPlatform] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  // Fetch share history on mount
  useEffect(() => {
    if (campaign.status === 'completed' || campaign.status === 'posted') {
      apiRequest<ShareEvent[]>(`/subjects/${campaign.id}/history`)
        .then(setShareHistory)
        .catch((err) => console.error('Failed to fetch share history', err))
    }
  }, [campaign.id, campaign.status])

  const formattedDate = new Date(campaign.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const handlePlatformSelect = async (e: React.MouseEvent, platform: string) => {
    e.stopPropagation()

    // Copy to clipboard
    if (campaign.generatedContent) {
      await navigator.clipboard.writeText(campaign.generatedContent)
    }

    const placeholderUrl = typeof window !== 'undefined' ? window.location.origin : 'https://example.com'
    const encodedUrl = encodeURIComponent(placeholderUrl)

    setLoadingPlatform(platform)
    try {
      // 1. Mark as posted (existing logic)
      const updated = await apiRequest<AiGeneration>(`/subjects/${campaign.id}/post-now`, { method: 'POST' })
      onUpdateCampaign?.(updated)
      
      // 2. Log to sharing history
      const newEvent = await apiRequest<ShareEvent>(`/subjects/${campaign.id}/history`, {
        method: 'POST',
        body: { platform }
      })
      setShareHistory((prev) => [newEvent, ...prev])
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoadingPlatform(null)
    }

    if (platform === 'LinkedIn') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, '_blank')
    } else if (platform === 'Facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank')
    } else if (platform === 'TikTok') {
      window.open('https://www.tiktok.com', '_blank')
    } else {
      window.open('https://www.instagram.com', '_blank')
    }
  }

  const handleShareNowClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Toggle platform picker — stays open so user can reshare to multiple
    setMode((m) => m === 'sharing' ? 'idle' : 'sharing')
  }

  const handleScheduleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setMode('scheduling')
  }

  const handleCancelSchedule = (e: React.MouseEvent) => {
    e.stopPropagation()
    setMode('idle')
  }

  const handleConfirmSchedule = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!scheduledAt) return
    setIsSubmitting(true)
    try {
      const updated = await apiRequest<AiGeneration>(`/subjects/${campaign.id}/schedule`, {
        method: 'POST',
        body: { scheduledAt: new Date(scheduledAt).toISOString() }
      })
      onUpdateCampaign?.(updated)
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
      setMode('idle')
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(campaign) }}
      onClick={() => onClick(campaign)}
      className={`w-full text-left rounded-2xl border p-5 flex flex-col gap-3 transition-all duration-200 cursor-pointer group
        ${isSelected
          ? 'bg-violet-500/10 border-violet-500/40 shadow-lg shadow-violet-500/15'
          : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.07] hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/10'
        }`}
    >
      {/* Top row: title + History (posted) + status badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 flex-1">
          <h3 className="text-sm font-semibold text-white leading-snug group-hover:text-violet-200 transition-colors">
            {campaign.subject}
          </h3>
          {campaign.platform && (
            <span className="text-[10px] text-slate-400 font-medium">
              Target: {campaign.platform}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* History button — shown on posted cards always */}
          {campaign.status === 'posted' && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowHistory((v) => !v) }}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-semibold border transition-all
                ${showHistory
                  ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                  : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-slate-200 hover:bg-white/[0.08]'
                }`}
            >
              <CalendarClock className="w-2.5 h-2.5" />
              History
            </button>
          )}
          <StatusBadge status={campaign.status} />
        </div>
      </div>

      {/* Date */}
      <p className="text-xs text-slate-500">{formattedDate}</p>

      {/* Content preview */}
      {campaign.status === 'completed' && campaign.generatedContent && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <FileText className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
            {campaign.generatedContent.split('\n').find((l) => l.trim() && !l.startsWith('#'))?.slice(0, 140)}…
          </p>
        </div>
      )}

      {/* Error message */}
      {campaign.status === 'failed' && campaign.errorMessage && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <p className="text-xs text-red-300 line-clamp-2">{campaign.errorMessage}</p>
        </div>
      )}

      {/* Processing state */}
      {campaign.status === 'processing' && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
          <p className="text-xs text-blue-300">AI is generating your content…</p>
        </div>
      )}

      {/* Pending state */}
      {campaign.status === 'pending' && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-300">Queued — waiting to be processed</p>
        </div>
      )}

      {/* Share History — toggled via History button on Posted cards */}
      {showHistory && (
        <div onClick={(e) => e.stopPropagation()}>
          <ShareHistory events={shareHistory} />
        </div>
      )}

      {/* Action buttons — for completed AND posted (resharing) */}
      {(campaign.status === 'completed' || campaign.status === 'posted') && mode === 'idle' && (
        <div className="flex gap-2 mt-1">
          <button
            onClick={handleShareNowClick}
            disabled={!!loadingPlatform}
            className="flex-1 flex justify-center items-center gap-1.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-semibold transition-all shadow-md disabled:opacity-50"
          >
            <Send className="w-3 h-3" />
            Share Now
          </button>
          <button
            onClick={handleScheduleClick}
            disabled={!!loadingPlatform}
            className="flex-1 flex justify-center items-center gap-1.5 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 text-[11px] font-semibold transition-all shadow-sm disabled:opacity-50"
          >
            <Calendar className="w-3 h-3 text-slate-400" />
            Schedule
          </button>
        </div>
      )}

      {/* Platform picker — only visible after clicking Share Now; stays open for resharing */}
      {(campaign.status === 'completed' || campaign.status === 'posted') && mode === 'sharing' && (
        <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Select Platform</span>
            <button
              onClick={(e) => { e.stopPropagation(); setMode('idle') }}
              className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              Done
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { name: 'Facebook', icon: FaFacebook, color: 'text-blue-500 hover:bg-blue-500/10' },
              { name: 'LinkedIn', icon: FaLinkedin, color: 'text-sky-500 hover:bg-sky-500/10' },
              { name: 'Instagram', icon: FaInstagram, color: 'text-pink-500 hover:bg-pink-500/10' },
              { name: 'TikTok', icon: FaTiktok, color: 'text-slate-300 hover:bg-slate-300/10' },
            ].map((p) => {
              const isLoading = loadingPlatform === p.name
              const wasShared = shareHistory.some((e) => e.platform === p.name)
              return (
                <button
                  key={p.name}
                  onClick={(e) => handlePlatformSelect(e, p.name)}
                  disabled={!!loadingPlatform}
                  className={`relative flex flex-col items-center gap-1.5 py-2 rounded-lg bg-white/[0.03] border transition-all
                    ${wasShared ? 'border-emerald-500/40 ring-1 ring-emerald-500/30' : 'border-white/[0.05]'}
                    ${p.color}`}
                >
                  {wasShared && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                  {isLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <p.icon className="w-4 h-4" />
                  }
                  <span className="text-[9px] font-medium">{p.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Schedule date picker */}
      {(campaign.status === 'completed' || campaign.status === 'posted') && mode === 'scheduling' && (
        <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.12] text-white text-xs outline-none focus:border-violet-500/80 transition-colors shadow-inner"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCancelSchedule}
              className="px-3 py-1.5 rounded-lg bg-white/[0.05] text-slate-300 text-[11px] font-semibold hover:bg-white/[0.1] transition-all shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSchedule}
              disabled={isSubmitting}
              className="flex-1 flex justify-center items-center gap-1.5 py-1.5 rounded-lg bg-violet-600 text-white text-[11px] font-semibold hover:bg-violet-500 transition-all shadow-md disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Calendar className="w-3 h-3" />}
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* Click hint */}
      <p className="text-[11px] text-slate-600 group-hover:text-slate-500 transition-colors mt-auto pt-2">
        Click to view details →
      </p>
    </div>
  )
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-violet-500/10 border border-violet-500/20 mb-5">
        <Sparkles className="w-7 h-7 text-violet-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">No campaigns yet</h3>
      <p className="text-slate-400 text-sm mb-6 max-w-xs">
        Start your first AI content generation and it will appear here.
      </p>
      <Link
        href="/dashboard/campaigns"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25"
      >
        <Plus className="w-4 h-4" />
        Create your first campaign
      </Link>
    </div>
  )
}

// ─── Campaign List ─────────────────────────────────────────────────────────────

interface CampaignListProps {
  campaigns: AiGeneration[]
  /** The id of the currently-selected campaign (controlled by the parent) */
  selectedCampaignId: string | null
  /** Inform parent which campaign was clicked */
  onSelectCampaign: (campaign: AiGeneration) => void
  onUpdateCampaign?: (campaign: AiGeneration) => void
}

export function CampaignList({ campaigns, selectedCampaignId, onSelectCampaign, onUpdateCampaign }: CampaignListProps) {
  if (campaigns?.length === 0) return <EmptyState />

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {campaigns.map((campaign) => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          isSelected={selectedCampaignId === campaign.id}
          onClick={onSelectCampaign}
          onUpdateCampaign={onUpdateCampaign}
        />
      ))}
    </div>
  )
}
