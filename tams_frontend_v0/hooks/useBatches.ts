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

export function useBatches() {
  return useQuery<Batch[]>({
    queryKey: batchKeys.lists(),
    queryFn: () => api.get('/batches') as Promise<Batch[]>,
  })
}

export function useGroups(batchId?: string) {
  return useQuery<Group[]>({
    queryKey: batchKeys.groups(batchId),
    queryFn: () =>
      api.get('/groups', { params: batchId ? { batch_id: batchId } : {} }) as Promise<Group[]>,
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
