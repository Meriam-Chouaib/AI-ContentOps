'use client'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { CampaignForm } from '@/components/campaigns/CampaignForm'
import { Sparkles, Zap, BarChart3 } from 'lucide-react'

export default function CampaignsPage() {
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md shadow-violet-500/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-semibold text-violet-400 tracking-widest uppercase">
            AI Generator
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
          Create a Campaign
        </h1>
        <p className="text-slate-400 max-w-xl">
          Describe your subject and keywords. Our AI engine will generate
          optimized educational content asynchronously via BullMQ.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: Zap, label: 'Avg. Generation', value: '~3s', color: 'from-amber-500 to-orange-500' },
          { icon: BarChart3, label: 'Queue Status', value: 'Active', color: 'from-emerald-500 to-teal-500' },
          { icon: Sparkles, label: 'AI Model', value: 'GPT-4o mini', color: 'from-violet-500 to-indigo-500' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div
            key={label}
            className="rounded-2xl bg-white/[0.04] border border-white/10 p-5 flex items-center gap-4"
          >
            <div className={`flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br ${color} shrink-0`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{label}</p>
              <p className="text-base font-bold text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Form */}
      <CampaignForm />
    </DashboardLayout>
  )
}
