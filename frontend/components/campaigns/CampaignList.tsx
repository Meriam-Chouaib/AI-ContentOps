'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  Plus,
  ChevronDown,
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

// ─── Accordion ─────────────────────────────────────────────────────────────────

function ContentAccordion({ content }: { content: string }) {
  const [open, setOpen] = useState(false)

  // Extract summary: first non-empty line that isn't a heading marker
  const lines = content.split('\n').filter((l) => l.trim())
  const summary = lines.find((l) => !l.startsWith('#'))?.slice(0, 160) ?? ''

  return (
    <div className="mt-4 rounded-xl border border-white/[0.08] overflow-hidden">
      {/* Summary always visible */}
      <div className="px-4 py-3 bg-white/[0.03]">
        <div className="flex items-start gap-2">
          <FileText className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
            {summary}…
          </p>
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white/[0.02] hover:bg-white/[0.05] border-t border-white/[0.06] transition-colors text-left"
      >
        <span className="text-xs font-medium text-violet-400">
          {open ? 'Hide full article' : 'Read full article'}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-violet-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Full content */}
      {open && (
        <div className="px-4 py-4 bg-white/[0.02] border-t border-white/[0.06]">
          <pre className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
            {content}
          </pre>
        </div>
      )}
    </div>
  )
}

// ─── Campaign Card ─────────────────────────────────────────────────────────────

function CampaignCard({ campaign }: { campaign: AiGeneration }) {
  const formattedDate = new Date(campaign.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-5 flex flex-col gap-3 hover:bg-white/[0.06] transition-colors">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-white leading-snug flex-1">
          {campaign.subject}
        </h3>
        <StatusBadge status={campaign.status} />
      </div>

      {/* Date */}
      <p className="text-xs text-slate-500">{formattedDate}</p>

      {/* Generated content accordion */}
      {campaign.status === 'completed' && campaign.generatedContent && (
        <ContentAccordion content={campaign.generatedContent} />
      )}

      {/* Error message */}
      {campaign.status === 'failed' && campaign.errorMessage && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <p className="text-xs text-red-300">{campaign.errorMessage}</p>
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
}

export function CampaignList({ campaigns }: CampaignListProps) {
  if (campaigns?.length === 0) return <EmptyState />

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {campaigns.map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  )
}
