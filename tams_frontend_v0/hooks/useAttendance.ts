'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import { AttendanceRecord, AttendanceMarkPayload, AttendanceSummary } from '@/lib/types'

export const attendanceKeys = {
  byDate: (batchId: string, date: string) => ['attendance', 'date', batchId, date] as const,
  monthly: (batchId: string, month: string) => ['attendance', 'monthly', batchId, month] as const,
}

function normalizeAttendanceStatus(status: string) {
  if (status === 'P') return 'present'
  if (status === 'A') return 'absent'
  if (status === 'L') return 'leave'
  return status
}

export function useAttendance(batchId: string, date: string) {
  return useQuery<AttendanceRecord[]>({
    queryKey: attendanceKeys.byDate(batchId, date),
    queryFn: async () => {
      const data = (await api.get('/attendance', {
        params: { batch_id: batchId, date },
      })) as Array<Record<string, unknown>>
      return data.map((record) => ({
        ...record,
        id: String(record.id ?? ''),
        studentId: String(record.studentId ?? record.student_id ?? ''),
        date: String(record.date ?? ''),
        status: normalizeAttendanceStatus(String(record.status ?? 'present')),
        markedAt: String(record.markedAt ?? record.updatedAt ?? record.updated_at ?? ''),
      })) as AttendanceRecord[]
    },
    enabled: !!batchId && !!date,
  })
}

export function useMonthlyAttendance(batchId: string, month: string) {
  return useQuery<AttendanceSummary[]>({
    queryKey: attendanceKeys.monthly(batchId, month),
    queryFn: async () => {
      const data = (await api.get('/attendance/monthly', {
        params: { batch_id: batchId, month },
      })) as Array<Record<string, unknown>>
      return data.map((summary) => ({
        studentId: String(summary.studentId ?? summary.student_id ?? ''),
        totalDays: Number(summary.totalDays ?? summary.total_days ?? 0),
        presentDays: Number(summary.presentDays ?? summary.present_days ?? 0),
        absentDays: Number(summary.absentDays ?? summary.absent_days ?? 0),
        leaveDays: Number(summary.leaveDays ?? summary.leave_days ?? 0),
        percentage: Number(summary.percentage ?? 0),
      }))
    },
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
