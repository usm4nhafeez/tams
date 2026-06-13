'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import { Batch, BatchFormData, Group, GroupFormData } from '@/lib/types'

export const batchKeys = {
  all: ['batches'] as const,
  lists: () => [...batchKeys.all, 'list'] as const,
  groups: (batchId?: string) => ['groups', batchId] as const,
}

function transformBatch(batch: Record<string, unknown>): Batch {
  return {
    ...batch,
    id: String(batch.id ?? ''),
    academicYear: String(batch.academicYear ?? batch.academic_year ?? ''),
    monthlyFee: Number(batch.monthlyFee ?? batch.monthly_fee ?? 0),
    isArchived: !(batch.isActive ?? batch.is_active ?? true),
    studentCount: Number(batch.studentCount ?? batch.student_count ?? 0),
    createdAt: String(batch.createdAt ?? batch.created_at ?? ''),
    updatedAt: String(batch.updatedAt ?? batch.updated_at ?? ''),
  } as Batch
}

function transformGroup(group: Record<string, unknown>): Group {
  return {
    ...group,
    id: String(group.id ?? ''),
    batchId: String(group.batchId ?? group.batch_id ?? ''),
    studentCount: Number(group.studentCount ?? group.student_count ?? 0),
    createdAt: String(group.createdAt ?? group.created_at ?? ''),
    updatedAt: String(group.updatedAt ?? group.updated_at ?? ''),
  } as Group
}

export function useBatches() {
  return useQuery<Batch[]>({
    queryKey: batchKeys.lists(),
    queryFn: async () => {
      const data = (await api.get('/batches')) as Record<string, unknown>[]
      return data.map(transformBatch)
    },
  })
}

export function useGroups(batchId?: string) {
  return useQuery<Group[]>({
    queryKey: batchKeys.groups(batchId),
    queryFn: async () => {
      const data = (await api.get('/groups', {
        params: batchId ? { batch_id: batchId } : {},
      })) as Record<string, unknown>[]
      return data.map(transformGroup)
    },
  })
}

export function useCreateBatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: BatchFormData) => api.post('/batches', data) as Promise<Batch>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: batchKeys.lists() })
      toast.success('Batch created successfully')
    },
  })
}

export function useUpdateBatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BatchFormData> }) =>
      api.put(`/batches/${id}`, data) as Promise<Batch>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: batchKeys.lists() })
      toast.success('Batch updated successfully')
    },
  })
}

export function useArchiveBatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch(`/batches/${id}/archive`) as Promise<Batch>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: batchKeys.lists() })
      toast.success('Batch archived')
    },
  })
}

export function useCreateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: GroupFormData) => api.post('/groups', data) as Promise<Group>,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: batchKeys.groups(variables.batchId) })
      qc.invalidateQueries({ queryKey: batchKeys.groups() })
      toast.success('Group created successfully')
    },
  })
}

export function useDeleteGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/groups/${id}`) as Promise<void>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] })
      toast.success('Group deleted')
    },
  })
}
