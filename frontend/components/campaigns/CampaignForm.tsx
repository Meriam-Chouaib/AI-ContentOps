'use client'

import { useState, useRef, useEffect } from 'react'
import { FaLinkedin, FaInstagram, FaFacebook, FaTiktok } from 'react-icons/fa';
import { Send, CheckCircle2, Loader2 } from 'lucide-react';
import { Toast, ToastState } from '@/components/ui/Toast'
import { FormSkeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/hooks/use-auth'
import { apiRequest } from '@/services/api.service'
import { AiGeneration } from '@/components/campaigns/types'
import { CampaignDetail } from '@/components/campaigns/CampaignDetail'

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface CampaignFormData {
  subject: string
  keywords: string
  platform: string
}

interface ApiResponse {
  message: string
  jobId: string
  campaignId: string
  duplicate?: boolean
}

type FormStatus = 'idle' | 'loading' | 'processing' | 'success' | 'error'

interface CampaignFormProps {
  /**
   * Called immediately after a successful 202 response.
   * Receives an optimistic AiGeneration record so the dashboard can prepend it
   * to the list without waiting for the next poll.
   */
  onSuccess?: (campaign: AiGeneration) => void
  /**
   * Called when the generated campaign modal is closed or saved.
   */
  onFinished?: () => void
}

// ─── Success Card ──────────────────────────────────────────────────────────────
// We remove the old SuccessCard because we now directly show the CampaignDetail modal upon completion.

// ─── Main Form ─────────────────────────────────────────────────────────────────

export function CampaignForm({ onSuccess, onFinished }: CampaignFormProps) {
  const { user } = useAuth()

  const [status, setStatus] = useState<FormStatus>('idle')
  const [jobId, setJobId] = useState<string>('')
  const [campaignId, setCampaignId] = useState<string>('')
  const [polledCampaign, setPolledCampaign] = useState<AiGeneration | null>(null)

  const [toast, setToast] = useState<ToastState>({ show: false, type: 'success', message: '' })
  const [formData, setFormData] = useState<CampaignFormData>({ subject: '', keywords: '', platform: 'linkedin' })

  // ── Submission lock ─────────────────────────────────────────────────────────
  // A ref-based flag (not state) prevents duplicate submissions even before
  // React has re-rendered the disabled button. This guards against rapid
  // double-clicks and React StrictMode double-invocations in development.
  const submittingRef = useRef(false)

  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToast({ show: true, type, message })
    toastTimeoutRef.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 5000)
  }

  // ── Polling Effect ──────────────────────────────────────────────────────────
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (status === 'processing' && campaignId) {
      interval = setInterval(async () => {
        try {
          const result = await apiRequest<AiGeneration>(`/subjects/${campaignId}`)
          if (result && (result.status === 'completed' || result.status === 'failed')) {
            setPolledCampaign(result)
            setStatus('success')
            clearInterval(interval)
          }
        } catch (err) {
          // ignore
        }
      }, 2000)
    }
    return () => clearInterval(interval)
  }, [status, campaignId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // ── Guard: prevent duplicate submissions ──────────────────────────────────
    if (submittingRef.current) return
    submittingRef.current = true

    if (!formData.subject.trim()) {
      showToast('error', 'Subject is required.')
      submittingRef.current = false
      return
    }

    setStatus('loading')

    // Generate the subjectId once — it acts as the idempotency key sent to the
    // backend. Generating it here (not inside render) means rapid re-submissions
    // always carry the same key, and the backend idempotency guard handles the rest.
    const subjectId = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

    const payload = {
      subjectId,
      userId: user?.id.toString(),
      subject: formData.subject.trim(),
      keywords: formData.keywords,
      platform: formData.platform,
      createdAt: new Date().toISOString(),
    }

    try {
      const data = await apiRequest<ApiResponse>('/subjects', {
        method: 'POST',
        body: payload,
      })

      setJobId(data.jobId)
      setCampaignId(data.campaignId)
      setStatus('processing')
      showToast(
        'success',
        data.duplicate
          ? `Campaign already processing!`
          : `Campaign accepted! Waiting for generation...`,
      )

      // Notify the parent dashboard immediately so it can prepend an optimistic
      // 'processing' card without waiting for the next poll cycle.
      if (onSuccess && user) {
        const optimisticCampaign: AiGeneration = {
          id: data.campaignId,
          subjectId,
          userId: user.id.toString(),
          subject: formData.subject.trim(),
          platform: formData.platform,
          status: 'processing',
          generatedContent: null,
          errorMessage: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        onSuccess(optimisticCampaign)
      }
    } catch (err: any) {
      setStatus('error')
      showToast('error', err.message || 'Failed to submit campaign. Check your connection.')
      setStatus('idle')
    } finally {
      submittingRef.current = false
    }
  }

  const handleReset = () => {
    setStatus('idle')
    setJobId('')
    setCampaignId('')
    setPolledCampaign(null)
    setFormData({ subject: '', keywords: '', platform: 'linkedin' })
  }

  const isLoading = status === 'loading'
  const isProcessing = status === 'processing'

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
          {isLoading ? (
            <FormSkeleton />
          ) : isProcessing ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
              <Loader2 className="w-12 h-12 text-violet-400 animate-spin" />
              <h3 className="text-xl font-bold text-white">
                Generating Content...
              </h3>
              <p className="text-slate-400 text-sm max-w-xs">
                Please wait while the AI writes your campaign. This usually takes around 5-10 seconds.
              </p>
            </div>
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
                  disabled={isLoading}
                  placeholder="e.g. Explain the concept of machine learning"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-slate-500 text-sm transition-all outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="mt-2 text-xs text-slate-500">
                  The main topic you want AI-generated educational content about.
                </p>
              </div>

              {/* Target Platform field */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Target Platform
                  <span className="text-violet-400 ml-1">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'linkedin', icon: FaLinkedin, label: 'LinkedIn' },
                    { id: 'insta', icon: FaInstagram, label: 'Instagram' },
                    { id: 'facebook', icon: FaFacebook, label: 'Facebook' },
                    { id: 'tiktok', icon: FaTiktok, label: 'TikTok' },
                  ].map(({ id, icon: Icon, label }) => {
                    const isSelected = formData.platform === id
                    return (
                      <label
                        key={id}
                        className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${isSelected
                          ? 'bg-violet-500/10 border-violet-500/50 shadow-md shadow-violet-500/10'
                          : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08] hover:border-white/20'
                          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="radio"
                          name="platform"
                          value={id}
                          checked={isSelected}
                          onChange={handleChange}
                          disabled={isLoading}
                          className="sr-only"
                        />
                        <Icon className={`w-6 h-6 ${isSelected ? 'text-violet-400' : 'text-slate-400'}`} />
                        <span className={`text-xs font-medium ${isSelected ? 'text-violet-300' : 'text-slate-400'}`}>
                          {label}
                        </span>
                      </label>
                    )
                  })}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Select the platform to tailor the post's format and tone.
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
                  disabled={isLoading}
                  placeholder="e.g. neural networks, supervised learning, classification..."
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-slate-500 text-sm transition-all outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Comma-separated keywords to guide the AI content generation.
                </p>
              </div>

              {/* Submit button */}
              <button
                id="campaign-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isLoading ? (
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

      {/* Modal is shown when polling finishes */}
      {status === 'success' && polledCampaign && (
        <CampaignDetail
          campaign={polledCampaign}
          onClose={() => {
            handleReset()
            onFinished?.()
          }}
          onSave={(updated) => {
            handleReset()
            onFinished?.()
          }}
        />
      )}
    </>
  )
}
