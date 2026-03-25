'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import { SettingsMap, Backup } from '@/lib/types'

export const settingKeys = {
  all: ['settings'] as const,
  backups: ['storage', 'backups'] as const,
}

export function useSettings() {
  return useQuery<SettingsMap>({
    queryKey: settingKeys.all,
    queryFn: () => api.get('/settings') as Promise<SettingsMap>,
  })
}

export function useSaveSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      api.put(`/settings/${key}`, { value }) as Promise<void>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: settingKeys.all })
      toast.success('Setting saved')
    },
  })
}

export function useBackups() {
  return useQuery<Backup[]>({
    queryKey: settingKeys.backups,
    queryFn: () => api.get('/storage/backups') as Promise<Backup[]>,
  })
}

export function useCreateBackup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/storage/backup') as Promise<Backup>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: settingKeys.backups })
      toast.success('Backup created successfully')
    },
  })
}

export function useRestoreBackup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (filename: string) =>
      api.post('/storage/restore', { filename }) as Promise<void>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: settingKeys.all })
      toast.success('Backup restored successfully')
    },
  })
}
