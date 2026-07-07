'use client'

import Link from 'next/link'
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  Plus,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import { AiGeneration } from './types'

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
}

function CampaignCard({ campaign, isSelected, onClick }: CampaignCardProps) {
  const formattedDate = new Date(campaign.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <button
      onClick={() => onClick(campaign)}
      className={`w-full text-left rounded-2xl border p-5 flex flex-col gap-3 transition-all duration-200 cursor-pointer group
        ${isSelected
          ? 'bg-violet-500/10 border-violet-500/40 shadow-lg shadow-violet-500/15'
          : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.07] hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/10'
        }`}
    >
      {/* Top row */}
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
        <StatusBadge status={campaign.status} />
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

      {/* Click hint */}
      <p className="text-[11px] text-slate-600 group-hover:text-slate-500 transition-colors">
        Click to view details →
      </p>
    </button>
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
}

export function CampaignList({ campaigns, selectedCampaignId, onSelectCampaign }: CampaignListProps) {
  if (campaigns?.length === 0) return <EmptyState />

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {campaigns.map((campaign) => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          isSelected={selectedCampaignId === campaign.id}
          onClick={onSelectCampaign}
        />
      ))}
    </div>
  )
}
