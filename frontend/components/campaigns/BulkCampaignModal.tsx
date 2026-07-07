'use client'

import React, { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { X, UploadCloud, FileType, CheckCircle2, Loader2, Send } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { apiRequest } from '@/services/api.service'

interface BulkCampaignModalProps {
  onClose: () => void
  /** Called with the list of newly queued campaign DB IDs */
  onSuccess: (campaignIds: string[]) => void
}

interface ParsedRow {
  subject: string
  keywords: string
  platform: string
}

export function BulkCampaignModal({ onClose, onSuccess }: BulkCampaignModalProps) {
  const { user } = useAuth()
  const [parsedData, setParsedData] = useState<ParsedRow[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Platform normalisation map ─────────────────────────────────────────────
  const normalizePlatform = (raw: string): string => {
    const val = raw.trim().toLowerCase()
    if (val === 'linkedin') return 'linkedin'
    if (val === 'instagram' || val === 'insta') return 'insta'
    if (val === 'facebook') return 'facebook'
    if (val === 'tiktok' || val === 'tik tok') return 'tiktok'
    return 'linkedin' // fallback default
  }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsParsing(true)
    setErrors([])

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws, { raw: false }) as any[]

        const validated: ParsedRow[] = []
        const parseErrors: string[] = []

        for (let i = 0; i < data.length; i++) {
          const row = data[i]
          const rowNum = i + 2 // +2: header row is row 1, data starts at row 2

          // Case insensitive matching for headers
          const getVal = (key: string) => {
             const foundKey = Object.keys(row).find(k => k.toLowerCase().trim() === key.toLowerCase())
             return foundKey ? String(row[foundKey]).trim() : ''
          }

          const subject = getVal('subject')
          const keywords = getVal('keywords')
          const rawPlatform = getVal('platform')
          const platform = normalizePlatform(rawPlatform)

          if (!subject) {
            parseErrors.push(`Row ${rowNum}: 'subject' cannot be empty.`)
            continue
          }
          if (!rawPlatform) {
            parseErrors.push(`Row ${rowNum}: 'platform' cannot be empty. Use linkedin, insta, facebook, or tiktok.`)
            continue
          }

          validated.push({ subject, keywords, platform })
        }

        if (parseErrors.length > 0 && validated.length === 0) {
          setErrors(parseErrors)
        } else if (parseErrors.length > 0) {
          // Show errors but also show valid rows
          setErrors(parseErrors)
          setParsedData(validated)
        } else if (validated.length === 0) {
          setErrors(['No valid rows found. Ensure you have a "subject" column with content.'])
        } else {
          setParsedData(validated)
        }
      } catch (err: any) {
        setErrors(['Failed to parse file: ' + err.message])
      } finally {
        setIsParsing(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.onerror = () => {
      setErrors(['File read error. Please try again.'])
      setIsParsing(false)
    }
    reader.readAsBinaryString(file)
  }

  const handleSubmit = async () => {
    if (!parsedData.length || !user) return
    setIsSubmitting(true)
    setErrors([])

    const payload = parsedData.map(row => {
      const subjectId = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      return {
        subjectId,
        userId: user.id.toString(),
        subject: row.subject,
        keywords: row.keywords,
        platform: row.platform,
        createdAt: new Date().toISOString(),
      }
    })

    try {
      const result = await apiRequest<{ jobs: { campaignId?: string; jobId: string }[]; message: string }>('/subjects/bulk', {
        method: 'POST',
        body: payload,
      })
      // Collect the DB UUIDs returned per-job so the parent can poll them
      const ids = (result.jobs ?? []).map((j) => j.campaignId).filter(Boolean) as string[]
      onSuccess(ids)
    } catch (err: any) {
      // The backend returns { message: 'Validation Error', errors: string[] }
      // for row-level errors. Parse and display each one.
      let displayErrors: string[]
      try {
        const parsed = JSON.parse(err.message)
        if (parsed?.errors && Array.isArray(parsed.errors)) {
          displayErrors = parsed.errors
        } else {
          displayErrors = [err.message || 'Failed to submit bulk request.']
        }
      } catch {
        displayErrors = [err.message || 'Failed to submit bulk request.']
      }
      setErrors(displayErrors)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-4xl bg-[#0f172a] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-violet-400" />
            Bulk Campaign Generation
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 flex flex-col gap-6">
          <p className="text-sm text-slate-400">
            Upload an Excel (.xlsx) or CSV file with the following headers: <strong>subject</strong>, <strong>keywords</strong>, <strong>platform</strong>. The platform should be one of: <strong className="text-violet-400">linkedin, insta, facebook, tiktok</strong>.
          </p>

          <input 
            type="file" 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />

          {!parsedData.length && !isParsing && (
            <div 
              className="border-2 border-dashed border-white/20 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/5 transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                <FileType className="w-8 h-8 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-medium">Click to upload file</p>
                <p className="text-slate-500 text-sm mt-1">or drag and drop your .xlsx / .csv</p>
              </div>
            </div>
          )}

          {isParsing && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
              <p className="text-slate-400">Parsing file...</p>
            </div>
          )}

          {errors.length > 0 && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm font-semibold mb-2">Validation Errors</p>
              <ul className="space-y-1">
                {errors.map((e, i) => (
                  <li key={i} className="text-red-400 text-xs flex items-start gap-1.5">
                    <span className="mt-0.5 shrink-0">•</span>
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {parsedData.length > 0 && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden border border-white/10 rounded-xl">
              <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex justify-between items-center">
                <span className="text-sm font-semibold text-white">Preview ({parsedData.length} rows)</span>
                <button 
                  onClick={() => setParsedData([])} 
                  className="text-xs text-violet-400 hover:text-violet-300"
                >
                  Clear and upload another
                </button>
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-white/[0.02] sticky top-0 backdrop-blur-sm z-10 text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-medium border-b border-white/10 w-1/2">Subject</th>
                      <th className="px-4 py-3 font-medium border-b border-white/10">Keywords</th>
                      <th className="px-4 py-3 font-medium border-b border-white/10 w-1/4">Platform</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((row, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 py-3 align-top">{row.subject}</td>
                        <td className="px-4 py-3 align-top text-slate-400">{row.keywords || '-'}</td>
                        <td className="px-4 py-3 align-top">
                          <span className="inline-flex px-2 py-1 rounded bg-white/10 text-xs">
                            {row.platform}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {parsedData.length > 0 && (
          <div className="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3 bg-white/[0.02]">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Generate All
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
