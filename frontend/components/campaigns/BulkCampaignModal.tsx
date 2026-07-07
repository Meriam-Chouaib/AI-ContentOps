'use client'

import React, { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { X, UploadCloud, FileType, CheckCircle2, Loader2, Send } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { apiRequest } from '@/services/api.service'

interface BulkCampaignModalProps {
  onClose: () => void
  onSuccess: () => void
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
  const [error, setError] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsParsing(true)
    setError(null)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws, { raw: false }) as any[]

        const validated: ParsedRow[] = []
        for (let i = 0; i < data.length; i++) {
          const row = data[i]
          
          // Case insensitive matching for headers
          const getVal = (key: string) => {
             const foundKey = Object.keys(row).find(k => k.toLowerCase().trim() === key.toLowerCase())
             return foundKey ? String(row[foundKey]).trim() : ''
          }
          
          const subject = getVal('subject')
          const keywords = getVal('keywords')
          let platform = getVal('platform')

          // Auto correct platform names if possible
          if (platform.toLowerCase() === 'linkedin') platform = 'LinkedIn'
          else if (platform.toLowerCase() === 'instagram') platform = 'Instagram'
          else if (platform.toLowerCase() === 'facebook') platform = 'Facebook'
          else platform = 'LinkedIn' // Default fallback

          if (subject) {
            validated.push({ subject, keywords, platform })
          }
        }

        if (validated.length === 0) {
          setError('No valid rows found. Ensure you have a "subject" column.')
        } else {
          setParsedData(validated)
        }
      } catch (err: any) {
        setError('Failed to parse file: ' + err.message)
      } finally {
        setIsParsing(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.onerror = () => {
      setError('File read error.')
      setIsParsing(false)
    }
    reader.readAsBinaryString(file)
  }

  const handleSubmit = async () => {
    if (!parsedData.length || !user) return
    setIsSubmitting(true)
    setError(null)

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
      await apiRequest('/subjects/bulk', {
        method: 'POST',
        body: payload,
      })
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to submit bulk request.')
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
            Upload an Excel (.xlsx) or CSV file with the following headers: <strong>subject</strong>, <strong>keywords</strong>, <strong>platform</strong>. The platform should be LinkedIn, Instagram, or Facebook.
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

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
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
