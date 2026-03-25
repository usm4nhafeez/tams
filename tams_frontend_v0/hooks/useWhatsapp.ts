'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import { WhatsAppStatus, WhatsAppMessage, MessageFilters } from '@/lib/types'

export const waKeys = {
  status: ['whatsapp', 'status'] as const,
  qr: ['whatsapp', 'qr'] as const,
  logs: (filters?: MessageFilters) => ['whatsapp', 'logs', filters] as const,
  queue: ['whatsapp', 'queue'] as const,
}

export function useWAStatus() {
  return useQuery<WhatsAppStatus>({
    queryKey: waKeys.status,
    queryFn: () => api.get('/whatsapp/status') as Promise<WhatsAppStatus>,
    refetchInterval: 5000,
  })
}

export function useWAQR(enabled: boolean) {
  return useQuery<string>({
    queryKey: waKeys.qr,
    queryFn: () => api.get('/whatsapp/qr') as Promise<string>,
    refetchInterval: 10000,
    enabled,
  })
}

export function useWALogs(filters?: MessageFilters) {
  const params: Record<string, string> = {}
  if (filters?.messageType && filters.messageType !== 'all') params.type = filters.messageType
  if (filters?.status && filters.status !== 'all') params.status = filters.status
  if (filters?.startDate) params.start_date = filters.startDate
  if (filters?.endDate) params.end_date = filters.endDate

  return useQuery<WhatsAppMessage[]>({
    queryKey: waKeys.logs(filters),
    queryFn: () => api.get('/whatsapp/logs', { params }) as Promise<WhatsAppMessage[]>,
  })
}

export function useWAQueue() {
  return useQuery<WhatsAppMessage[]>({
    queryKey: waKeys.queue,
    queryFn: () => api.get('/whatsapp/queue') as Promise<WhatsAppMessage[]>,
    refetchInterval: 10000,
  })
}

export function useSendBroadcast() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      monthYear,
      type,
    }: {
      monthYear: string
      type: string
    }) =>
      api.post('/whatsapp/broadcast', {
        month_year: monthYear,
        type,
      }) as Promise<{ sent: number; failed: number }>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: waKeys.queue })
      qc.invalidateQueries({ queryKey: ['whatsapp', 'logs'] })
      toast.success('Broadcast sent successfully')
    },
  })
}

export function useSendAbsenceAlerts() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      absentStudents,
      date,
    }: {
      absentStudents: { studentId: string; name: string; phone: string }[]
      date: string
    }) =>
      api.post('/whatsapp/absence', {
        absent_students: absentStudents,
        date,
      }) as Promise<{ sent: number }>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: waKeys.queue })
      toast.success('Absence alerts sent')
    },
  })
}
