// Shared TypeScript interface for AI Generation campaigns
export interface AiGeneration {
  id: string
  subjectId: string
  userId: string
  subject: string
  platform: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'queued' | 'posted'
  generatedContent: string | null
  errorMessage: string | null
  scheduledAt?: string | null
  platformPostId?: string | null
  createdAt: string
  updatedAt: string
}
