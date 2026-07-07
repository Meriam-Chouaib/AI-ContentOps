'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { apiRequest } from '@/services/api.service'
import { AiGeneration } from '@/components/campaigns/types'

const POLL_INTERVAL_MS = 3_000 // poll every 3 s while jobs are active

interface UseCampaignsOptions {
  userId: string | null
  /** Called once when a campaign transitions into 'completed' status */
  onCompleted?: (campaign: AiGeneration) => void
}

interface UseCampaignsReturn {
  campaigns: AiGeneration[]
  fetchState: 'idle' | 'loading' | 'success' | 'error'
  /** Refresh the full list from the server */
  refresh: () => Promise<void>
  /** Optimistically prepend a new campaign (e.g. immediately after submission) */
  addCampaign: (campaign: AiGeneration) => void
  /** Patch a single campaign in local state without a network round-trip */
  updateCampaign: (updated: AiGeneration) => void
}

export function useCampaigns({ userId, onCompleted }: UseCampaignsOptions): UseCampaignsReturn {
  const [campaigns, setCampaigns] = useState<AiGeneration[]>([])
  const [fetchState, setFetchState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  // Keep a stable ref to the onCompleted callback so the interval doesn't capture a stale closure
  const onCompletedRef = useRef(onCompleted)
  useEffect(() => { onCompletedRef.current = onCompleted }, [onCompleted])

  // Track which campaign IDs were "active" (processing/pending) during the last poll
  // so we can detect transitions to 'completed'.
  const activeIdsRef = useRef<Set<string>>(new Set())

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── Core fetch ─────────────────────────────────────────────────────────────
  const fetchCampaigns = useCallback(async (silent = false): Promise<AiGeneration[]> => {
    if (!userId) return []
    if (!silent) setFetchState('loading')

    try {
      const data = await apiRequest<AiGeneration[]>(`/subjects/user/${userId}`)

      setCampaigns((prev) => {
        // Detect newly-completed campaigns and fire onCompleted
        data.forEach((campaign) => {
          if (
            campaign.status === 'completed' &&
            activeIdsRef.current.has(campaign.id)
          ) {
            onCompletedRef.current?.(campaign)
          }
        })

        // Refresh the active-ids set
        activeIdsRef.current = new Set(
          data
            .filter((c) => c.status === 'processing' || c.status === 'pending')
            .map((c) => c.id),
        )

        return data
      })

      if (!silent) setFetchState('success')
      return data
    } catch (err) {
      console.error('[useCampaigns] fetch error:', err)
      if (!silent) setFetchState('error')
      return []
    }
  }, [userId])

  // ─── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) {
      setFetchState('success')
      return
    }
    fetchCampaigns(false)
  }, [userId, fetchCampaigns])

  // ─── Polling loop ────────────────────────────────────────────────────────────
  // Start polling when there are active jobs; stop when all are terminal.
  useEffect(() => {
    const hasActive = campaigns.some(
      (c) => c.status === 'processing' || c.status === 'pending',
    )

    if (hasActive && !intervalRef.current) {
      intervalRef.current = setInterval(() => fetchCampaigns(true), POLL_INTERVAL_MS)
    } else if (!hasActive && intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [campaigns, fetchCampaigns])

  // ─── Public mutators ─────────────────────────────────────────────────────────
  const addCampaign = useCallback((campaign: AiGeneration) => {
    setCampaigns((prev) => [campaign, ...prev])
    // Mark as active so polling can detect its completion
    activeIdsRef.current.add(campaign.id)
  }, [])

  const updateCampaign = useCallback((updated: AiGeneration) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c)),
    )
  }, [])

  const refresh = useCallback(() => fetchCampaigns(false), [fetchCampaigns])

  return { campaigns, fetchState, refresh, addCampaign, updateCampaign }
}
