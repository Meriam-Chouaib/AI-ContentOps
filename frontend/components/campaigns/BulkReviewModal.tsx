'use client'

import { useState } from 'react'
import {
  X,
  ChevronRight,
  SkipForward,
  CheckCircle2,
  Save,
  Loader2,
  FileText,
  Pencil,
  RotateCcw,
} from 'lucide-react'
import { AiGeneration } from './types'
import { apiRequest } from '@/services/api.service'

// ─── Props ──────────────────────────────────────────────────────────────────

interface BulkReviewModalProps {
  campaigns: AiGeneration[]
  onClose: () => void
  onAllDone: () => void
}

// ─── Platform badge colours ──────────────────────────────────────────────────

const PLATFORM_COLOUR: Record<string, string> = {
  linkedin: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  insta: 'bg-pink-500/15 text-pink-300 border-pink-500/25',
  instagram: 'bg-pink-500/15 text-pink-300 border-pink-500/25',
  facebook: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
  tiktok: 'bg-slate-500/15 text-slate-300 border-slate-500/25',
}

const platformLabel = (platform: string) => {
  const map: Record<string, string> = {
    linkedin: 'LinkedIn',
    insta: 'Instagram',
    instagram: 'Instagram',
    facebook: 'Facebook',
    tiktok: 'TikTok',
  }
  return map[platform?.toLowerCase()] ?? platform
}

// ─── Content Editor ─────────────────────────────────────────────────────────

interface EditorProps {
  campaign: AiGeneration
  onSaved: (updated: AiGeneration) => void
  onSkip: () => void
  isSaving: boolean
  setIsSaving: (v: boolean) => void
}

function ContentEditor({ campaign, onSaved, onSkip, isSaving, setIsSaving }: EditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(campaign.generatedContent ?? '')
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)
    try {
      const updated = await apiRequest<AiGeneration>(`/subjects/${campaign.id}`, {
        method: 'PATCH',
        body: { generatedContent: draft },
      })
      onSaved({ ...campaign, generatedContent: draft, ...updated })
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save. Please try again.')
      setIsSaving(false)
    }
  }

  const platformKey = campaign.platform?.toLowerCase()
  const badgeClass = PLATFORM_COLOUR[platformKey] ?? 'bg-slate-500/15 text-slate-300 border-slate-500/25'

  return (
    <div className="flex flex-col h-full">
      {/* Campaign header */}
      <div className="px-7 pt-5 pb-4 flex flex-col gap-2 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${badgeClass}`}>
            {platformLabel(campaign.platform)}
          </span>
        </div>
        <h3 className="text-xl font-bold text-white leading-snug">{campaign.subject}</h3>
      </div>

      {/* Editable area */}
      <div className="flex items-center gap-2 px-7 py-3 border-y border-white/[0.07] shrink-0">
        <FileText className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-xs font-semibold text-white flex-1">Generated Content</span>
        <span className="text-xs text-slate-500 font-mono">{draft.length.toLocaleString()} chars</span>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs text-slate-300 hover:text-white transition-all font-medium"
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setDraft(campaign.generatedContent ?? ''); setIsEditing(false) }}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs text-slate-400 hover:text-white transition-all disabled:opacity-50"
            >
              <RotateCcw className="w-3 h-3" /> Discard
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

      {saveError && (
        <div className="mx-7 mt-3 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
          {saveError}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-7 py-5 min-h-0">
        {isEditing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full h-full min-h-[280px] text-[13.5px] text-slate-200 leading-7 bg-white/[0.03] border border-violet-500/30 rounded-xl px-4 py-3 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15 resize-none font-sans transition-all"
            spellCheck={false}
          />
        ) : (
          <pre className="text-[13.5px] text-slate-300 leading-7 whitespace-pre-wrap font-sans">{draft}</pre>
        )}
      </div>

      {/* Action bar */}
      <div className="px-7 py-4 border-t border-white/[0.07] shrink-0 flex items-center justify-between gap-3">
        <button
          onClick={onSkip}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-sm text-slate-400 hover:text-white transition-all font-medium disabled:opacity-50"
        >
          <SkipForward className="w-4 h-4" />
          Skip
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-500/30 text-sm text-white font-semibold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
          ) : (
            <><Save className="w-4 h-4" /> Save &amp; Next</>
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function BulkReviewModal({ campaigns, onClose, onAllDone }: BulkReviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [allDone, setAllDone] = useState(false)

  const total = campaigns.length
  const current = campaigns[currentIndex]

  const advance = () => {
    const next = currentIndex + 1
    if (next >= total) {
      setAllDone(true)
    } else {
      setCurrentIndex(next)
    }
  }

  const handleSaved = () => {
    setIsSaving(false)
    advance()
  }

  const handleSkip = () => advance()

  // ── All done screen ────────────────────────────────────────────────────────
  if (allDone) {
    return (
      <>
        <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-md" onClick={onAllDone} aria-hidden="true" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0d0f16] border border-white/[0.09] rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.7)] p-10 flex flex-col items-center gap-5 text-center animate-modal-in">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Bulk Review Complete!</h2>
            <p className="text-slate-400 text-sm max-w-xs">
              You have reviewed all {total} generated campaign{total !== 1 ? 's' : ''}. Your saved content is now on the dashboard.
            </p>
            <button
              onClick={onAllDone}
              className="mt-2 px-8 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-500/25"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </>
    )
  }

  if (!current) return null

  return (
    <>
      {/* Backdrop — blocks background interaction */}
      <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-md" aria-hidden="true" />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Bulk campaign review"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      >
        <div className="w-full max-w-3xl max-h-[88vh] bg-[#0d0f16] border border-white/[0.09] rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden animate-modal-in">

          {/* Top gradient accent */}
          <div className="h-1 w-full bg-gradient-to-r from-violet-500/80 to-indigo-500/80" />

          {/* Header with progress */}
          <div className="flex items-center justify-between px-7 py-4 border-b border-white/[0.07] shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-300">Bulk Review</span>
              {/* Progress pills */}
              <div className="flex items-center gap-1.5 ml-2">
                {campaigns.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i < currentIndex
                        ? 'w-4 bg-emerald-500'
                        : i === currentIndex
                        ? 'w-6 bg-violet-500'
                        : 'w-4 bg-white/[0.12]'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* "X of Y" counter + close */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-400 tabular-nums">
                Reviewing{' '}
                <span className="text-white">{currentIndex + 1}</span>
                {' '}of{' '}
                <span className="text-white">{total}</span>
              </span>
              <button
                onClick={onClose}
                aria-label="Close bulk review"
                className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main content — keyed to currentIndex so it re-mounts cleanly */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <ContentEditor
              key={`${current.id}-${currentIndex}`}
              campaign={current}
              onSaved={handleSaved}
              onSkip={handleSkip}
              isSaving={isSaving}
              setIsSaving={setIsSaving}
            />
          </div>

          {/* Footer progress bar */}
          <div className="px-7 py-3 border-t border-white/[0.07] shrink-0">
            <div className="w-full h-1 rounded-full bg-white/[0.07] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${((currentIndex) / total) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-600 text-right mt-1">
              {total - currentIndex - 1} remaining after this
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
