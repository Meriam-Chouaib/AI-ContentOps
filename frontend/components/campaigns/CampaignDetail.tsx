'use client'

import {
  X,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  AlertTriangle,
  FileText,
  CalendarDays,
  Hash,
  Tag,
} from 'lucide-react'
import { AiGeneration } from './types'

// ─── Props ─────────────────────────────────────────────────────────────────────

interface CampaignDetailProps {
  campaign: AiGeneration | null
  onClose: () => void
}

// ─── Status Config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    icon: Clock,
    badge: 'bg-amber-500/15 text-amber-300 border border-amber-500/25',
    glow: 'from-amber-500/10 to-transparent',
  },
  processing: {
    label: 'Processing',
    icon: Loader2,
    badge: 'bg-blue-500/15 text-blue-300 border border-blue-500/25',
    glow: 'from-blue-500/10 to-transparent',
    spin: true,
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    badge: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',
    glow: 'from-emerald-500/10 to-transparent',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    badge: 'bg-red-500/15 text-red-300 border border-red-500/25',
    glow: 'from-red-500/10 to-transparent',
  },
}

// ─── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AiGeneration['status'] }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${config.badge}`}>
      <Icon className={`w-3.5 h-3.5 ${'spin' in config ? 'animate-spin' : ''}`} />
      {config.label}
    </span>
  )
}

// ─── Meta Item ─────────────────────────────────────────────────────────────────

function MetaItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold">{label}</span>
      </div>
      <p className="text-sm text-slate-200 font-medium pl-5 break-all">{value}</p>
    </div>
  )
}

// ─── Article Panel ─────────────────────────────────────────────────────────────

function ArticlePanel({ content }: { content: string }) {
  return (
    <div className="flex flex-col h-full">
      {/* Article header */}
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-white/[0.07] shrink-0">
        <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
          <FileText className="w-3.5 h-3.5 text-violet-400" />
        </div>
        <span className="text-sm font-semibold text-white">Generated Article</span>
        <span className="ml-auto text-xs text-slate-500 font-mono">
          {content.length.toLocaleString()} chars
        </span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <pre className="text-[13.5px] text-slate-300 leading-7 whitespace-pre-wrap font-sans">
          {content}
        </pre>
      </div>
    </div>
  )
}

// ─── CampaignDetail Modal ───────────────────────────────────────────────────────

export function CampaignDetail({ campaign, onClose }: CampaignDetailProps) {
  if (!campaign) return null

  const config = STATUS_CONFIG[campaign.status] ?? STATUS_CONFIG.pending

  const formattedDate = new Date(campaign.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const isCompleted = campaign.status === 'completed' && !!campaign.generatedContent

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 z-40 bg-black/75 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Modal ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Campaign detail: ${campaign.subject}`}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      >
        <div className="
          w-full max-w-5xl h-full max-h-[88vh]
          bg-[#0d0f16] border border-white/[0.09]
          rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.7)]
          flex flex-col overflow-hidden
          animate-modal-in
        ">

          {/* ── Top gradient glow (status-coloured) ── */}
          <div className={`h-1 w-full bg-gradient-to-r ${config.glow} opacity-80`} />

          {/* ── Header ── */}
          <div className="flex items-start justify-between gap-6 px-8 py-6 border-b border-white/[0.07] shrink-0">
            <div className="flex flex-col gap-3 min-w-0">
              <StatusBadge status={campaign.status} />
              <h2 className="text-2xl font-bold text-white leading-tight truncate">
                {campaign.subject}
              </h2>
            </div>

            <button
              onClick={onClose}
              aria-label="Close modal"
              className="w-9 h-9 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white transition-all shrink-0 mt-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">

            {/* Left sidebar — meta */}
            <div className="md:w-64 lg:w-72 shrink-0 border-b md:border-b-0 md:border-r border-white/[0.07] px-8 py-6 flex flex-col gap-6 overflow-y-auto">
              <MetaItem icon={CalendarDays} label="Created" value={formattedDate} />
              <div className="h-px bg-white/[0.06]" />
              <MetaItem icon={Hash} label="Job ID" value={campaign.subjectId} />
              <div className="h-px bg-white/[0.06]" />
              <MetaItem icon={Tag} label="Status" value={config.label} />
            </div>

            {/* Right — main content */}
            <div className="flex-1 min-w-0 overflow-hidden flex flex-col">

              {/* Completed → full article */}
              {isCompleted && (
                <ArticlePanel content={campaign.generatedContent!} />
              )}

              {/* Failed → error detail */}
              {campaign.status === 'failed' && campaign.errorMessage && (
                <div className="flex-1 flex items-start p-8">
                  <div className="w-full flex items-start gap-4 px-6 py-5 rounded-2xl bg-red-500/10 border border-red-500/20">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-2">
                      <span className="text-base font-semibold text-red-300">Generation Failed</span>
                      <p className="text-sm text-red-400 leading-relaxed">{campaign.errorMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Failed — no message */}
              {campaign.status === 'failed' && !campaign.errorMessage && (
                <div className="flex-1 flex items-center justify-center p-8">
                  <p className="text-slate-500 text-sm">No error details available.</p>
                </div>
              )}

              {/* Processing */}
              {campaign.status === 'processing' && (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="w-14 h-14 rounded-full bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                    </div>
                    <p className="text-base font-semibold text-white">AI is generating content…</p>
                    <p className="text-sm text-slate-500 max-w-xs">
                      Your article is being written in the background. Refresh the page to see updates.
                    </p>
                  </div>
                </div>
              )}

              {/* Pending */}
              {campaign.status === 'pending' && (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="w-14 h-14 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-amber-400" />
                    </div>
                    <p className="text-base font-semibold text-white">Queued</p>
                    <p className="text-sm text-slate-500 max-w-xs">
                      This job is waiting to be picked up by the worker.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="px-8 py-4 border-t border-white/[0.07] shrink-0 flex items-center justify-between">
            <p className="text-xs text-slate-600">
              Updated {new Date(campaign.updatedAt).toLocaleTimeString('en-GB')}
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-sm text-slate-300 hover:text-white transition-all font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
