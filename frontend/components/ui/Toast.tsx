import { CheckCircle2, AlertCircle, X } from 'lucide-react'

export interface ToastState {
  show: boolean
  type: 'success' | 'error'
  message: string
}

interface ToastProps {
  toast: ToastState
  onClose: () => void
}

export function Toast({ toast, onClose }: ToastProps) {
  if (!toast.show) return null

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-sm max-w-sm animate-in slide-in-from-bottom-4 duration-300 ${
        toast.type === 'success'
          ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-100'
          : 'bg-red-950/90 border-red-500/30 text-red-100'
      }`}
    >
      <div className="shrink-0 mt-0.5">
        {toast.type === 'success' ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-400" />
        )}
      </div>
      <p className="text-sm font-medium leading-snug">{toast.message}</p>
      <button
        onClick={onClose}
        className="shrink-0 ml-2 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
