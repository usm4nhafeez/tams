'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import { FeeRecord, FeeFilters, PaymentMode } from '@/lib/types'
import { getPdfUrl } from '@/lib/utils'

export const feeKeys = {
  lists: (filters?: FeeFilters) => ['fees', 'list', filters] as const,
}

function transformFeeRecord(record: Record<string, unknown>): FeeRecord {
  const studentName = String(record.studentName ?? record.student_name ?? '')
  const nameParts = studentName.split(' ').filter(Boolean)

  return {
    ...record,
    id: String(record.id ?? ''),
    studentId: String(record.studentId ?? record.student_id ?? ''),
    month: String(record.month ?? record.monthYear ?? record.month_year ?? ''),
    amount: Number(record.amount ?? record.amountDue ?? record.amount_due ?? 0),
    paidAmount: Number(record.paidAmount ?? record.amountPaid ?? record.amount_paid ?? 0),
    dueDate: String(record.dueDate ?? record.paidDate ?? record.paid_date ?? ''),
    paidAt: record.paidAt
      ? String(record.paidAt)
      : record.paidDate
        ? String(record.paidDate)
        : record.paid_date
          ? String(record.paid_date)
          : undefined,
    receiptNumber: record.receiptNumber
      ? String(record.receiptNumber)
      : record.receiptNo
        ? String(record.receiptNo)
        : record.receipt_no
          ? String(record.receipt_no)
          : undefined,
    createdAt: String(record.createdAt ?? record.created_at ?? ''),
    updatedAt: String(record.updatedAt ?? record.updated_at ?? ''),
    student: studentName
      ? {
          id: String(record.studentId ?? record.student_id ?? ''),
          firstName: nameParts[0] ?? studentName,
          lastName: nameParts.slice(1).join(' '),
          photoUrl: record.photoUrl ?? record.photo_path ?? undefined,
          batch: record.batchName || record.batch_name
            ? {
                id: '',
                name: String(record.batchName ?? record.batch_name ?? ''),
              }
            : undefined,
        }
      : undefined,
  } as FeeRecord
}

export function useFees(filters?: FeeFilters) {
  const params: Record<string, string> = {}
  if (filters?.studentId) params.student_id = filters.studentId
  if (filters?.batchId) params.batch_id = filters.batchId
  if (filters?.month) params.month_year = filters.month
  if (filters?.status && filters.status !== 'all') params.status = filters.status

  return useQuery<FeeRecord[]>({
    queryKey: feeKeys.lists(filters),
    queryFn: async () => {
      const data = (await api.get('/fees', { params })) as Array<Record<string, unknown>>
      return data.map(transformFeeRecord)
    },
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
