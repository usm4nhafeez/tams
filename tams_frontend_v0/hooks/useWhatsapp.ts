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

function transformMessage(raw: Record<string, unknown>): WhatsAppMessage {
  return {
    ...raw,
    id: String(raw.id ?? `${raw.phone ?? raw.parent_number ?? 'msg'}-${raw.created_at ?? Date.now()}`),
    studentId: raw.studentId ? String(raw.studentId) : raw.student_id ? String(raw.student_id) : undefined,
    phone: String(raw.phone ?? raw.parentNumber ?? raw.parent_number ?? raw.whatsapp_number ?? ''),
    messageType: String(raw.messageType ?? raw.message_type ?? raw.type ?? 'broadcast') as WhatsAppMessage['messageType'],
    content: String(raw.content ?? raw.messageBody ?? raw.message_body ?? raw.balance ?? ''),
    status: String(raw.status ?? 'pending') as WhatsAppMessage['status'],
    sentAt: raw.sentAt ? String(raw.sentAt) : raw.sent_at ? String(raw.sent_at) : undefined,
    error: raw.error ? String(raw.error) : raw.error_log ? String(raw.error_log) : undefined,
    createdAt: String(raw.createdAt ?? raw.created_at ?? raw.sent_at ?? ''),
  }
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
    queryFn: async () => {
      const data = (await api.get('/whatsapp/qr')) as { qr?: string }
      return data?.qr ?? ''
    },
    refetchInterval: 10000,
    enabled,
  })
}

export function useWALogs(filters?: MessageFilters) {
  const params: Record<string, string> = {}
  if (filters?.messageType && filters.messageType !== 'all') params.message_type = filters.messageType
  if (filters?.status && filters.status !== 'all') params.status = filters.status
  if (filters?.startDate) params.date_from = filters.startDate
  if (filters?.endDate) params.date_to = filters.endDate

  return useQuery<WhatsAppMessage[]>({
    queryKey: waKeys.logs(filters),
    queryFn: async () => {
      const data = (await api.get('/whatsapp/logs', { params })) as Array<Record<string, unknown>>
      return data.map(transformMessage)
    },
  })
}

export function useWAQueue() {
  return useQuery<WhatsAppMessage[]>({
    queryKey: waKeys.queue,
    queryFn: async () => {
      const data = (await api.get('/whatsapp/queue')) as Array<Record<string, unknown>>
      return data.map((item) =>
        transformMessage({
          ...item,
          phone: item.whatsapp_number,
          message_type: 'fee_reminder',
          message_body: `Pending fee reminder for ${String(item.name ?? 'student')}`,
          created_at: new Date().toISOString(),
        })
      )
    },
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
