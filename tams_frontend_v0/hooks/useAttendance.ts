'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import { AttendanceRecord, AttendanceMarkPayload, AttendanceSummary } from '@/lib/types'

export const attendanceKeys = {
  byDate: (batchId: string, date: string) => ['attendance', 'date', batchId, date] as const,
  monthly: (batchId: string, month: string) => ['attendance', 'monthly', batchId, month] as const,
}

export function useAttendance(batchId: string, date: string) {
  return useQuery<AttendanceRecord[]>({
    queryKey: attendanceKeys.byDate(batchId, date),
    queryFn: () =>
      api.get('/attendance', { params: { batch_id: batchId, date } }) as Promise<AttendanceRecord[]>,
    enabled: !!batchId && !!date,
  })
}

export function useMonthlyAttendance(batchId: string, month: string) {
  return useQuery<AttendanceSummary[]>({
    queryKey: attendanceKeys.monthly(batchId, month),
    queryFn: () =>
      api.get('/attendance/monthly', {
        params: { batch_id: batchId, month },
      }) as Promise<AttendanceSummary[]>,
    enabled: !!batchId && !!month,
  })
}

export function useSaveAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      batchId,
      date,
      records,
    }: {
      batchId: string
      date: string
      records: AttendanceMarkPayload[]
    }) =>
      api.post('/attendance/bulk', {
        batch_id: batchId,
        date,
        records: records.map((r) => ({
          student_id: r.studentId,
          status: r.status,
        })),
      }) as Promise<{ absentStudents: { studentId: string; name: string; phone: string }[] }>,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: attendanceKeys.byDate(variables.batchId, variables.date),
      })
      toast.success('Attendance saved successfully')
    },
  })
}
