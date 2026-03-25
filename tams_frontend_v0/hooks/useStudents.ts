'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import { Student, StudentFilters } from '@/lib/types'

export const studentKeys = {
  all: ['students'] as const,
  lists: (filters?: StudentFilters) => ['students', 'list', filters] as const,
  profile: (id: string) => ['students', 'profile', id] as const,
}

export function useStudents(filters?: StudentFilters) {
  const params: Record<string, string> = {}
  if (filters?.batchId) params.batch_id = filters.batchId
  if (filters?.groupId) params.group_id = filters.groupId
  if (filters?.status && filters.status !== 'all') params.status = filters.status
  if (filters?.search) params.search = filters.search

  return useQuery<Student[]>({
    queryKey: studentKeys.lists(filters),
    queryFn: () => api.get('/students', { params }) as Promise<Student[]>,
  })
}

export function useStudentProfile(id: string) {
  return useQuery<Student>({
    queryKey: studentKeys.profile(id),
    queryFn: () => api.get(`/students/${id}/profile`) as Promise<Student>,
    enabled: !!id,
  })
}

export function useCreateStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) =>
      api.post('/students', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }) as Promise<Student>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      toast.success('Student added successfully')
    },
  })
}

export function useUpdateStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      api.put(`/students/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }) as Promise<Student>,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['students'] })
      qc.invalidateQueries({ queryKey: studentKeys.profile(variables.id) })
      toast.success('Student updated successfully')
    },
  })
}
