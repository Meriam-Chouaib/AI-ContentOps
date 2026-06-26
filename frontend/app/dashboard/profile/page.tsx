'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { apiRequest } from '@/services/api.service'
import { mutate } from 'swr'
import {
  User,
  MapPin,
  Calendar,
  Phone,
  Camera,
  Loader2,
  CheckCircle2,
  Edit2,
  X,
  Save,
  Mail,
  AlertCircle
} from 'lucide-react'
import { Toast, ToastState } from '@/components/ui/Toast'
import { ENV } from '@/env.config'

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<ToastState>({ show: false, type: 'success', message: '' })
  
  const [formData, setFormData] = useState({
    name: '',
    birthday: '',
    address: '',
    phoneNumber: '',
  })
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '',
        address: user.address || '',
        phoneNumber: user.phoneNumber || '',
      })
      setAvatarPreview(user.profilePictureUrl ? `${ENV.apiUrl}${user.profilePictureUrl}` : null)
    }
  }, [user])

  const showToast = (type: 'success' | 'error', message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToast({ show: true, type, message })
    toastTimeoutRef.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 5000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // 1. Update text fields
      await apiRequest('/users/profile', {
        method: 'PATCH',
        body: formData,
      })

      // 2. Upload avatar if selected
      if (avatarFile) {
        const formDataPayload = new FormData()
        formDataPayload.append('file', avatarFile)

        // Cannot use apiRequest directly because of FormData content-type overriding
        const tokenMatch = document.cookie.match(/(?:^|;\s*)jwt=([^;]*)/)
        const token = tokenMatch ? tokenMatch[1] : ''

        const res = await fetch(`${ENV.apiUrl}/users/profile/avatar`, {
          method: 'POST',
          body: formDataPayload,
          credentials: 'include',
        })

        if (!res.ok) throw new Error('Failed to upload avatar')
      }

      // Refresh data
      await mutate('/auth/profile')
      showToast('success', 'Profile updated successfully!')
      setIsEditing(false)
    } catch (error: any) {
      console.error(error)
      showToast('error', error.message || 'Failed to update profile.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '',
        address: user.address || '',
        phoneNumber: user.phoneNumber || '',
      })
      setAvatarFile(null)
      setAvatarPreview(user.profilePictureUrl ? `${ENV.apiUrl}${user.profilePictureUrl}` : null)
    }
    setIsEditing(false)
  }

  if (!mounted) return null

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!user) return null

  return (
    <DashboardLayout>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
            My Profile
          </h1>
          <p className="text-slate-400">
            Manage your personal information and account settings.
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm font-semibold text-white hover:bg-white/[0.08] transition-all"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </button>
        )}
      </div>

      <div className="max-w-3xl">
        <div className="rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-sm overflow-hidden">
          
          {/* Header Banner */}
          <div className="h-32 bg-gradient-to-r from-violet-600/40 to-indigo-600/40 relative">
            <div className="absolute -bottom-12 left-8 flex items-end gap-5">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl border-4 border-slate-950 bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-slate-500" />
                  )}
                </div>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-4 border-transparent"
                  >
                    <Camera className="w-6 h-6 text-white mb-1" />
                    <span className="text-[10px] font-semibold text-white">Upload</span>
                  </button>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <div className="pb-2">
                <h2 className="text-xl font-bold text-white">{user.name || 'User'}</h2>
                <div className="flex items-center gap-1.5 text-sm text-slate-400 mt-1">
                  <Mail className="w-3.5 h-3.5" />
                  {user.email}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-20 px-8 pb-8">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Full Name
                    </label>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-slate-500 text-sm focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Birthday
                    </label>
                    <input
                      name="birthday"
                      type="date"
                      value={formData.birthday}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-slate-500 text-sm focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 outline-none transition-all [color-scheme:dark]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Address
                    </label>
                    <input
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="123 AI Street, Tech City"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-slate-500 text-sm focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-slate-500 text-sm focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-white/[0.05]">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-white hover:bg-white/10 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Contact Information
                    </h3>
                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-slate-200">
                          {user.phoneNumber || <span className="text-slate-600 italic">Not provided</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-slate-200">
                          {user.address || <span className="text-slate-600 italic">Not provided</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Personal Information
                    </h3>
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-slate-200">
                          {user.birthday ? (
                            new Date(user.birthday).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          ) : (
                            <span className="text-slate-600 italic">Not provided</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Toast toast={toast} onClose={() => setToast((t) => ({ ...t, show: false }))} />
    </DashboardLayout>
  )
}
