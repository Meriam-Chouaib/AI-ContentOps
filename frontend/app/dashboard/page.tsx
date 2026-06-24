'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { CampaignList } from '@/components/campaigns/CampaignList'
import { mockCampaigns } from '@/components/campaigns/mockCampaigns'
import { apiRequest } from '@/services/api.service'
import { AiGeneration } from '@/components/campaigns/types'
import { Toast, ToastState } from '@/components/ui/Toast'
import { GridSkeleton } from '@/components/ui/Skeleton'
import {
  Plus,
  AlertCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type FetchState = 'loading' | 'success' | 'error'

// ─── Main Page ─────────────────────────────────────────────────────────────────

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_AI === 'true'


export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth()

  const [campaigns, setCampaigns] = useState<AiGeneration[]>([])
  const [fetchState, setFetchState] = useState<FetchState>('loading')
  const [toast, setToast] = useState<ToastState>({ show: false, type: 'error', message: '' })
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    if (toastRef.current) clearTimeout(toastRef.current)
    setToast({ show: true, type, message })
    toastRef.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 5000)
  }

  const fetchCampaigns = async (userId: string) => {
    setFetchState('loading')

    // ── Mock mode: return fake data instantly ─────────────────────────────────
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 800)) // simulate network delay
      setCampaigns(mockCampaigns)
      console.log("🚀 ~ fetchCampaigns ~ campaigns:", campaigns)

      setFetchState('success')
      return
    }

    // ── Real mode: hit the backend API ───────────────────────────────────────
    try {
      const data: AiGeneration[] = await apiRequest(`/subjects/user/${userId}`)
      setCampaigns(data)
      setFetchState('success')
    } catch (err: any) {
      console.error('Failed to fetch campaigns:', err)
      setFetchState('error')
      showToast('error', 'Failed to load campaigns. Please try again.')
    }
  }

  useEffect(() => {
    if (authLoading) return

    if (user?.id) {
      fetchCampaigns(String(user.id))
    } else {
      setFetchState('success')
    }
  }, [user, authLoading])

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Campaigns
            </h1>
            {USE_MOCK && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                Mock Mode
              </span>
            )}
          </div>
          <p className="text-slate-400">
            All AI content generation requests for your account.
          </p>
        </div>
        <Link
          href="/dashboard/campaigns"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </Link>
      </div>

      {/* Content */}
      {fetchState === 'loading' && <GridSkeleton />}

      {fetchState === 'error' && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertCircle className="w-10 h-10 text-red-400/60" />
          <p className="text-slate-400 text-sm">Could not load campaigns.</p>
          <button
            onClick={() => user?.id && fetchCampaigns(String(user.id))}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/10 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {fetchState === 'success' && <CampaignList campaigns={campaigns} />}

      <Toast toast={toast} onClose={() => setToast((t) => ({ ...t, show: false }))} />
    </DashboardLayout>
  )
}
