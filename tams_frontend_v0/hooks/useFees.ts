'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import { FeeRecord, FeeFilters, PaymentMode } from '@/lib/types'
import { getPdfUrl } from '@/lib/utils'

export const feeKeys = {
  lists: (filters?: FeeFilters) => ['fees', 'list', filters] as const,
}

export function useFees(filters?: FeeFilters) {
  const params: Record<string, string> = {}
  if (filters?.studentId) params.student_id = filters.studentId
  if (filters?.batchId) params.batch_id = filters.batchId
  if (filters?.month) params.month_year = filters.month
  if (filters?.status && filters.status !== 'all') params.status = filters.status

  return useQuery<FeeRecord[]>({
    queryKey: feeKeys.lists(filters),
    queryFn: () => api.get('/fees', { params }) as Promise<FeeRecord[]>,
  })
}

export function useGenerateFees() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (monthYear: string) =>
      api.post('/fees/generate', { month_year: monthYear }) as Promise<FeeRecord[]>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fees'] })
      toast.success('Fees generated successfully')
    },
  })
}

export function useRecordPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      amountPaid,
      paymentMode,
      notes,
    }: {
      id: string
      amountPaid: number
      paymentMode: PaymentMode
      notes?: string
    }) =>
      api.patch(`/fees/${id}/pay`, {
        amount_paid: amountPaid,
        payment_mode: paymentMode,
        notes,
      }) as Promise<FeeRecord>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fees'] })
      toast.success('Payment recorded successfully')
    },
  })
}

export function useGenerateReceipt() {
  return useMutation({
    mutationFn: (id: string) =>
      api.get(`/fees/${id}/receipt`) as Promise<{ path: string }>,
    onSuccess: (data) => {
      if (data?.path) {
        window.open(getPdfUrl(data.path), '_blank')
      }
    },
  })
}
