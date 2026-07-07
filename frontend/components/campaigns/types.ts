// Shared TypeScript interface for AI Generation campaigns
export interface AiGeneration {
  id: string
  subjectId: string
  userId: string
  subject: string
  platform: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  generatedContent: string | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}
