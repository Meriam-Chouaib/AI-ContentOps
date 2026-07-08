'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { useCampaigns } from '@/hooks/use-campaigns'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { CampaignList } from '@/components/campaigns/CampaignList'
import { CampaignDetail } from '@/components/campaigns/CampaignDetail'
import { AiGeneration } from '@/components/campaigns/types'
import { BulkCampaignModal } from '@/components/campaigns/BulkCampaignModal'
import { BulkReviewModal } from '@/components/campaigns/BulkReviewModal'
import { Toast, ToastState } from '@/components/ui/Toast'
import { GridSkeleton } from '@/components/ui/Skeleton'
import { apiRequest } from '@/services/api.service'
import {
  Plus,
  AlertCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react'

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth()

  // ── Toast ───────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<ToastState>({ show: false, type: 'success', message: '' })
  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ show: true, type, message })
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 5000)
  }, [])

  // ── Selected campaign (controls the detail modal) ───────────────────────────
  const [selectedCampaign, setSelectedCampaign] = useState<AiGeneration | null>(null)

  // ── Bulk Generation Modal State ─────────────────────────────────────────────
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)

  // ── Bulk Review State ───────────────────────────────────────────────────────
  // bulkPendingIds: campaign DB IDs we are waiting for completion
  // bulkReadyCampaigns: fully completed campaigns ready for sequential review
  const [bulkPendingIds, setBulkPendingIds] = useState<string[]>([])
  const [bulkReadyCampaigns, setBulkReadyCampaigns] = useState<AiGeneration[] | null>(null)
  const [isBulkPolling, setIsBulkPolling] = useState(false)
  const bulkPollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // When a job completes: update the selected modal if it is open
  const handleCompleted = useCallback((campaign: AiGeneration) => {
    // Only show single-campaign toast if we're not in bulk mode
    if (bulkPendingIds.length === 0) {
      showToast('success', `✅ "${campaign.subject}" generation is complete!`)
      setSelectedCampaign((prev) =>
        prev?.id === campaign.id || prev?.subjectId === campaign.subjectId
          ? campaign
          : campaign,
      )
    }
  }, [showToast, bulkPendingIds.length])

  // ── Campaigns state via polling hook ────────────────────────────────────────
  const { campaigns, fetchState, refresh, addCampaign, updateCampaign } = useCampaigns({
    userId: !authLoading && user ? String(user.id) : null,
    onCompleted: handleCompleted,
  })

  // ── Bulk Polling: poll individual campaign IDs until all complete ────────────
  useEffect(() => {
    if (bulkPendingIds.length === 0) return

    setIsBulkPolling(true)
    const completed: AiGeneration[] = []

    const pollBulk = async () => {
      try {
        const results = await Promise.all(
          bulkPendingIds.map((id) => apiRequest<AiGeneration>(`/subjects/${id}`))
        )

        const allDone = results.every(
          (r) => r && (r.status === 'completed' || r.status === 'failed')
        )

        if (allDone) {
          clearInterval(bulkPollIntervalRef.current!)
          bulkPollIntervalRef.current = null
          setIsBulkPolling(false)
          setBulkPendingIds([])
          // Only show review modal for completed (not failed) ones
          const completedCampaigns = results.filter(
            (r) => r.status === 'completed' && r.generatedContent
          )
          if (completedCampaigns.length > 0) {
            setBulkReadyCampaigns(completedCampaigns)
          } else {
            showToast('error', 'All bulk campaigns failed to generate. Check your settings.')
          }
          refresh()
        }
      } catch {
        // ignore transient errors
      }
    }

    bulkPollIntervalRef.current = setInterval(pollBulk, 3000)
    // Run immediately on mount
    pollBulk()

    return () => {
      if (bulkPollIntervalRef.current) clearInterval(bulkPollIntervalRef.current)
    }
  }, [bulkPendingIds]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleBulkSuccess = useCallback((campaignIds: string[]) => {
    setIsBulkModalOpen(false)
    showToast('success', `${campaignIds.length} campaign(s) queued! Polling for completion…`)
    setBulkPendingIds(campaignIds)
    refresh()
  }, [showToast, refresh])

  // ── Single campaign select ───────────────────────────────────────────────────
  const handleSelectCampaign = useCallback((campaign: AiGeneration) => {
    setSelectedCampaign(campaign)
  }, [])

  const handleModalClose = useCallback(() => {
    setSelectedCampaign(null)
  }, [])

  const handleSave = useCallback((updated: AiGeneration) => {
    updateCampaign(updated)
    setSelectedCampaign(updated)
  }, [updateCampaign])

  // Sync the open modal when the polling hook brings in fresh data
  const syncedSelectedCampaign = selectedCampaign
    ? (campaigns.find(
        (c) => c.id === selectedCampaign.id || c.subjectId === selectedCampaign.subjectId,
      ) ?? selectedCampaign)
    : null

  const hasActiveJobs = campaigns.some(
    (c) => c.status === 'processing' || c.status === 'pending',
  )

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Campaigns
            </h1>
            {hasActiveJobs && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20 animate-pulse">
                Live
              </span>
            )}
          </div>
          <p className="text-slate-400">
            All AI content generation requests for your account.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Bulk polling status indicator */}
          {isBulkPolling && (
            <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-violet-500/30 bg-violet-500/10 text-sm text-violet-300 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Processing bulk…
            </span>
          )}

          <button
            onClick={() => setIsBulkModalOpen(true)}
            disabled={isBulkPolling}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/20 bg-transparent text-sm font-semibold text-white hover:bg-white/5 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Generate Multiple
          </button>
          
          <Link
            href="/dashboard/campaigns"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </Link>
        </div>
      </div>

      {/* Content */}
      {fetchState === 'loading' && <GridSkeleton />}

      {fetchState === 'error' && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertCircle className="w-10 h-10 text-red-400/60" />
          <p className="text-slate-400 text-sm">Could not load campaigns.</p>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/10 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {(fetchState === 'success' || fetchState === 'idle') && (
        <CampaignList
          campaigns={campaigns}
          selectedCampaignId={syncedSelectedCampaign?.id ?? null}
          onSelectCampaign={handleSelectCampaign}
        />
      )}

      {/* Detail modal — rendered at the dashboard level so the poller can
          open it programmatically when a single job completes */}
      <CampaignDetail
        campaign={syncedSelectedCampaign}
        onClose={handleModalClose}
        onSave={handleSave}
        isLivePolling={hasActiveJobs}
      />

      <Toast toast={toast} onClose={() => setToast((t) => ({ ...t, show: false }))} />

      {/* Bulk upload modal */}
      {isBulkModalOpen && (
        <BulkCampaignModal
          onClose={() => setIsBulkModalOpen(false)}
          onSuccess={handleBulkSuccess}
        />
      )}

      {/* Sequential review modal — opens when all bulk jobs finish */}
      {bulkReadyCampaigns && bulkReadyCampaigns.length > 0 && (
        <BulkReviewModal
          campaigns={bulkReadyCampaigns}
          onClose={() => setBulkReadyCampaigns(null)}
          onAllDone={() => {
            setBulkReadyCampaigns(null)
            showToast('success', '🎉 All campaigns reviewed and saved!')
            refresh()
          }}
        />
      )}
    </DashboardLayout>
  )
}
