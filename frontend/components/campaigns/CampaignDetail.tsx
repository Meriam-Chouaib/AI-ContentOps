'use client'

import { useState, useEffect } from 'react'
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
  Pencil,
  Save,
  RotateCcw,
  Wifi,
} from 'lucide-react'
import { AiGeneration } from './types'
import { apiRequest } from '@/services/api.service'

// ─── Props ─────────────────────────────────────────────────────────────────────

interface CampaignDetailProps {
  campaign: AiGeneration | null
  onClose: () => void
  /** Called after the user saves edited content — use it to update the parent list */
  onSave?: (updated: AiGeneration) => void
  /** When true, a subtle indicator shows that this modal is live-polling for updates */
  isLivePolling?: boolean
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
  queued: {
    label: 'Scheduled',
    icon: CalendarDays,
    badge: 'bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/25',
    glow: 'from-fuchsia-500/10 to-transparent',
  },
  posted: {
    label: 'Posted',
    icon: CheckCircle2,
    badge: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25',
    glow: 'from-indigo-500/10 to-transparent',
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

// ─── Article Panel (with edit mode) ───────────────────────────────────────────

interface ArticlePanelProps {
  content: string
  campaignId: string
  onSaved: (updatedContent: string) => void
}

function ArticlePanel({ content, campaignId, onSaved }: ArticlePanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(content)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Keep draft in sync if the parent pushes a live-poll update
  useEffect(() => {
    if (!isEditing) setDraft(content)
  }, [content, isEditing])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)
    try {
      await apiRequest<AiGeneration>(`/subjects/${campaignId}`, {
        method: 'PATCH',
        body: { generatedContent: draft },
      })
      onSaved(draft)
      setIsEditing(false)
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDiscard = () => {
    setDraft(content)
    setIsEditing(false)
    setSaveError(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Article header */}
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-white/[0.07] shrink-0">
        <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
          <FileText className="w-3.5 h-3.5 text-violet-400" />
        </div>
        <span className="text-sm font-semibold text-white">Generated Article</span>
        <span className="ml-auto text-xs text-slate-500 font-mono">
          {draft.length.toLocaleString()} chars
        </span>

        {/* Edit / Save / Discard controls */}
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs text-slate-300 hover:text-white transition-all font-medium"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDiscard}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs text-slate-400 hover:text-white transition-all disabled:opacity-50"
            >
              <RotateCcw className="w-3 h-3" />
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-500/80 border border-emerald-500/30 text-xs text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Save className="w-3 h-3" />
              )}
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Save error */}
      {saveError && (
        <div className="mx-6 mt-3 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-xs text-red-300">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {saveError}
        </div>
      )}

      {/* Scrollable content — read-only or editable */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {isEditing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full h-full min-h-[320px] text-[13.5px] text-slate-200 leading-7 bg-white/[0.03] border border-violet-500/30 rounded-xl px-4 py-3 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15 resize-none font-sans transition-all"
            spellCheck={false}
          />
        ) : (
          <pre className="text-[13.5px] text-slate-300 leading-7 whitespace-pre-wrap font-sans">
            {draft}
          </pre>
        )}
      </div>
    </div>
  )
}

// ─── CampaignDetail Modal ───────────────────────────────────────────────────────

export function CampaignDetail({ campaign, onClose, onSave, isLivePolling }: CampaignDetailProps) {
  // Local copy of campaign so edits are reflected immediately in the modal
  const [localCampaign, setLocalCampaign] = useState<AiGeneration | null>(campaign)

  // Sync when the parent pushes a live-poll update (e.g. status changed to 'completed')
  useEffect(() => {
    setLocalCampaign(campaign)
  }, [campaign])

  if (!localCampaign) return null

  const config = STATUS_CONFIG[localCampaign.status] ?? STATUS_CONFIG.pending

  const formattedDate = new Date(localCampaign.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const hasContent = ['completed', 'queued', 'posted'].includes(localCampaign.status) && !!localCampaign.generatedContent

  const handleContentSaved = (updatedContent: string) => {
    const updated: AiGeneration = { ...localCampaign, generatedContent: updatedContent }
    setLocalCampaign(updated)
    onSave?.(updated)
  }

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
        aria-label={`Campaign detail: ${localCampaign.subject}`}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      >
        <div className="
          w-full max-w-5xl h-full max-h-[95vh] sm:max-h-[88vh]
          bg-[#0d0f16] border border-white/[0.09]
          rounded-2xl sm:rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.7)]
          flex flex-col overflow-hidden
          animate-modal-in
        ">

          {/* ── Top gradient glow (status-coloured) ── */}
          <div className={`h-1 w-full bg-gradient-to-r ${config.glow} opacity-80`} />

          {/* ── Header ── */}
          <div className="flex items-start justify-between gap-4 px-4 sm:px-8 py-4 sm:py-6 border-b border-white/[0.07] shrink-0">
            <div className="flex flex-col gap-2 sm:gap-3 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={localCampaign.status} />

                {/* Live-polling indicator */}
                {isLivePolling && (localCampaign.status === 'processing' || localCampaign.status === 'pending') && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    <Wifi className="w-3 h-3 animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-white leading-tight">
                {localCampaign.subject}
              </h2>
            </div>

            <button
              onClick={onClose}
              aria-label="Close modal"
              className="w-9 h-9 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white transition-all shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">

            {/* Left sidebar — meta (horizontal scroll on mobile, sidebar on desktop) */}
            <div className="md:w-64 lg:w-72 shrink-0 border-b md:border-b-0 md:border-r border-white/[0.07] md:overflow-y-auto">
              {/* Mobile: horizontal scrollable row */}
              <div className="flex md:flex-col gap-4 md:gap-6 px-4 sm:px-8 py-4 md:py-6 overflow-x-auto md:overflow-x-visible">
                <div className="shrink-0 md:shrink-0">
                  <MetaItem icon={CalendarDays} label="Created" value={formattedDate} />
                </div>
                <div className="hidden md:block h-px bg-white/[0.06]" />
                <div className="shrink-0 md:shrink-0">
                  <MetaItem icon={Hash} label="Job ID" value={localCampaign.subjectId} />
                </div>
                <div className="hidden md:block h-px bg-white/[0.06]" />
                <div className="shrink-0 md:shrink-0">
                  <MetaItem icon={Tag} label="Status" value={config.label} />
                </div>
                {localCampaign.platformPostId && (
                  <>
                    <div className="hidden md:block h-px bg-white/[0.06]" />
                    <div className="shrink-0 md:shrink-0">
                      <MetaItem icon={Hash} label="Post ID" value={localCampaign.platformPostId} />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right — main content */}
            <div className="flex-1 min-w-0 overflow-hidden flex flex-col">

              {/* Has content → editable article */}
              {hasContent && (
                <ArticlePanel
                  content={localCampaign.generatedContent!}
                  campaignId={localCampaign.id}
                  onSaved={handleContentSaved}
                />
              )}

              {/* Failed → error detail */}
              {localCampaign.status === 'failed' && localCampaign.errorMessage && (
                <div className="flex-1 flex items-start p-8">
                  <div className="w-full flex items-start gap-4 px-6 py-5 rounded-2xl bg-red-500/10 border border-red-500/20">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-2">
                      <span className="text-base font-semibold text-red-300">Generation Failed</span>
                      <p className="text-sm text-red-400 leading-relaxed">{localCampaign.errorMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Failed — no message */}
              {localCampaign.status === 'failed' && !localCampaign.errorMessage && (
                <div className="flex-1 flex items-center justify-center p-8">
                  <p className="text-slate-500 text-sm">No error details available.</p>
                </div>
              )}

              {/* Processing — live polling */}
              {localCampaign.status === 'processing' && (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="flex flex-col items-center gap-5 text-center">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
                      </div>
                      {isLivePolling && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-violet-500 border-2 border-[#0d0f16] animate-pulse" />
                      )}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-white mb-1">AI is generating content…</p>
                      <p className="text-sm text-slate-500 max-w-xs">
                        {isLivePolling
                          ? 'This modal will update automatically when your article is ready.'
                          : 'Your article is being written in the background.'}
                      </p>
                    </div>
                    {isLivePolling && (
                      <div className="flex items-center gap-1.5 text-xs text-violet-400/70">
                        <Wifi className="w-3 h-3 animate-pulse" />
                        Polling for updates every 3 seconds
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pending */}
              {localCampaign.status === 'pending' && (
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
              Updated {new Date(localCampaign.updatedAt).toLocaleTimeString('en-GB')}
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
