'use client'

import { useState, useRef } from 'react'
import { Send, CheckCircle2, Loader2 } from 'lucide-react'
import { Toast, ToastState } from '@/components/ui/Toast'
import { FormSkeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/hooks/use-auth'

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface CampaignFormData {
  subject: string
  keywords: string
}

interface ApiResponse {
  message: string
  jobId: string
}

type FormStatus = 'idle' | 'loading' | 'success' | 'error'

// ─── Success Card ──────────────────────────────────────────────────────────────

function SuccessCard({ jobId, onReset }: { jobId: string; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-6">
        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">
        Campaign Queued Successfully!
      </h3>
      <p className="text-slate-400 text-sm mb-4 max-w-xs">
        Your subject is being processed by the AI engine in the background.
      </p>
      <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 mb-8">
        <span className="text-xs text-slate-500 font-medium">Job ID: </span>
        <span className="text-xs text-violet-400 font-mono font-semibold">
          #{jobId}
        </span>
      </div>
      <button
        onClick={onReset}
        className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/10 transition-all"
      >
        Create Another Campaign
      </button>
    </div>
  )
}

// ─── Main Form ─────────────────────────────────────────────────────────────────

export function CampaignForm() {
  const { user } = useAuth()

  const [status, setStatus] = useState<FormStatus>('idle')
  const [jobId, setJobId] = useState<string>('')
  const [toast, setToast] = useState<ToastState>({ show: false, type: 'success', message: '' })
  const [formData, setFormData] = useState<CampaignFormData>({ subject: '', keywords: '' })

  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToast({ show: true, type, message })
    toastTimeoutRef.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 5000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!formData.subject.trim()) {
      showToast('error', 'Subject is required.')
      return
    }

    setStatus('loading')

    const payload = {
      subjectId: `sub-${Date.now()}`,
      userId: user?.id.toString(),
      subject: formData.subject,
      keywords: formData.keywords,
      createdAt: new Date().toISOString(),
    }

    try {
      const response = await fetch('http://localhost:3001/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: 'Unknown error' }))
        throw new Error(errorBody.message || `HTTP ${response.status}`)
      }

      const data: ApiResponse = await response.json()
      setJobId(data.jobId)
      setStatus('success')
      showToast('success', `Campaign accepted! Job #${data.jobId} is being processed.`)
    } catch (err: any) {
      setStatus('error')
      showToast('error', err.message || 'Failed to submit campaign. Check your connection.')
      setStatus('idle')
    }
  }

  const handleReset = () => {
    setStatus('idle')
    setJobId('')
    setFormData({ subject: '', keywords: '' })
  }

  return (
    <>
      <div className="rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-sm shadow-2xl overflow-hidden">
        {/* Card header */}
        <div className="px-8 py-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          <h2 className="text-base font-semibold text-white">
            New AI Campaign
          </h2>
          <span className="ml-auto px-3 py-1 rounded-full text-xs font-medium bg-violet-500/20 text-violet-300 border border-violet-500/20">
            Async Queue
          </span>
        </div>

        {/* Card body */}
        <div className="px-8 py-8">
          {status === 'loading' ? (
            <FormSkeleton />
          ) : status === 'success' ? (
            <SuccessCard jobId={jobId} onReset={handleReset} />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Subject field */}
              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-semibold text-slate-300 mb-2"
                >
                  Subject
                  <span className="text-violet-400 ml-1">*</span>
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  disabled={status === ('loading' as FormStatus)} placeholder="e.g. Explain the concept of machine learning"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-slate-500 text-sm transition-all outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="mt-2 text-xs text-slate-500">
                  The main topic you want AI-generated educational content about.
                </p>
              </div>

              {/* Keywords field */}
              <div>
                <label
                  htmlFor="keywords"
                  className="block text-sm font-semibold text-slate-300 mb-2"
                >
                  Keywords
                  <span className="text-xs text-slate-500 font-normal ml-2">(optional)</span>
                </label>
                <textarea
                  id="keywords"
                  name="keywords"
                  rows={4}
                  value={formData.keywords}
                  onChange={handleChange}
                  disabled={status === ('loading' as FormStatus)} placeholder="e.g. neural networks, supervised learning, classification..."
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-slate-500 text-sm transition-all outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Comma-separated keywords to guide the AI content generation.
                </p>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={status === ('loading' as FormStatus)} className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {status === ('loading' as FormStatus) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Queuing Campaign…
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Generate AI Content
                  </>
                )}
              </button>

              {/* Helper note */}
              <p className="text-center text-xs text-slate-500">
                The request returns immediately. AI processing happens in the
                background via BullMQ.
              </p>
            </form>
          )}
        </div>
      </div>

      <Toast toast={toast} onClose={() => setToast((t) => ({ ...t, show: false }))} />
    </>
  )
}
