'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import { Exam, ExamFormData, ExamFilters, ExamResult, MarksEntryPayload, Subject } from '@/lib/types'
import { getPdfUrl } from '@/lib/utils'

export const examKeys = {
  lists: (filters?: ExamFilters) => ['exams', 'list', filters] as const,
  subjects: (batchId?: string) => ['subjects', batchId] as const,
  results: (examId: string) => ['exams', 'results', examId] as const,
}

export function useExams(filters?: ExamFilters) {
  const params: Record<string, string> = {}
  if (filters?.batchId) params.batch_id = filters.batchId
  if (filters?.type && filters.type !== 'all') params.exam_type = filters.type
  if (filters?.month) params.month = filters.month

  return useQuery<Exam[]>({
    queryKey: examKeys.lists(filters),
    queryFn: () => api.get('/exams', { params }) as Promise<Exam[]>,
  })
}

export function useSubjects(batchId?: string) {
  return useQuery<Subject[]>({
    queryKey: examKeys.subjects(batchId),
    queryFn: () =>
      api.get('/subjects', {
        params: batchId ? { batch_id: batchId } : {},
      }) as Promise<Subject[]>,
  })
}

export function useExamResults(examId: string) {
  return useQuery<ExamResult[]>({
    queryKey: examKeys.results(examId),
    queryFn: () => api.get(`/exams/${examId}/results`) as Promise<ExamResult[]>,
    enabled: !!examId,
  })
}

export function useCreateExam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ExamFormData) => api.post('/exams', data) as Promise<Exam>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exams'] })
      toast.success('Exam created successfully')
    },
  })
}

export function useSaveResults() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      examId,
      results,
    }: {
      examId: string
      results: MarksEntryPayload[]
    }) =>
      api.post(`/exams/${examId}/results`, { results }) as Promise<ExamResult[]>,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: examKeys.results(variables.examId) })
      qc.invalidateQueries({ queryKey: ['exams'] })
      toast.success('Results saved successfully')
    },
  })
}

export function useLockExam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (examId: string) => api.patch(`/exams/${examId}/lock`) as Promise<Exam>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exams'] })
      toast.success('Exam locked')
    },
  })
}

export function useGenerateReportCard() {
  return useMutation({
    mutationFn: ({ studentId, month }: { studentId: string; month: string }) =>
      api.get(`/exams/report/${studentId}/${month}`) as Promise<{ path: string }>,
    onSuccess: (data) => {
      if (data?.path) {
        window.open(getPdfUrl(data.path), '_blank')
      }
    },
  })
}
