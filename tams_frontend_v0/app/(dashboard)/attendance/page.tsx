'use client'
import { useState } from 'react'
import { CalendarCheck, CheckCircle, XCircle, Clock, Save } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { StudentAvatar } from '@/components/shared/StudentAvatar'
import { EmptyState } from '@/components/shared/EmptyState'
import { useBatches } from '@/hooks/useBatches'
import { useAttendance, useSaveAttendance } from '@/hooks/useAttendance'
import { useSendAbsenceAlerts } from '@/hooks/useWhatsapp'
import { useStudents } from '@/hooks/useStudents'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Separator } from '@/components/ui/separator'
import { AttendanceStatus } from '@/lib/types'
import { formatDate } from '@/lib/utils'

export default function AttendancePage() {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({})

  const { data: batches = [] } = useBatches()
  const activeBatches = batches.filter((b) => !b.isArchived)

  const { data: students = [], isLoading: studentsLoading } = useStudents(
    selectedBatchId ? { batchId: selectedBatchId, status: 'active' } : undefined
  )

  const { data: existingRecords = [] } = useAttendance(selectedBatchId, selectedDate)
  const saveAttendance = useSaveAttendance()
  const sendAbsenceAlerts = useSendAbsenceAlerts()

  // Merge existing records into state when they load
  const mergedAttendance = { ...attendance }
  for (const record of existingRecords) {
    if (!(record.studentId in attendance)) {
      mergedAttendance[record.studentId] = record.status
    }
  }

  function setStudentStatus(studentId: string, status: AttendanceStatus) {
    setAttendance((prev) => ({ ...prev, [studentId]: status }))
  }

  function markAll(status: AttendanceStatus) {
    const all: Record<string, AttendanceStatus> = {}
    for (const s of students) {
      all[s.id] = status
    }
    setAttendance(all)
  }

  const present = students.filter((s) => mergedAttendance[s.id] === 'present').length
  const absent = students.filter((s) => mergedAttendance[s.id] === 'absent').length
  const leave = students.filter((s) => mergedAttendance[s.id] === 'leave').length
  const unmarked = students.length - present - absent - leave

  async function handleSave() {
    if (!selectedBatchId) return
    const records = students
      .filter((s) => mergedAttendance[s.id])
      .map((s) => ({ studentId: s.id, status: mergedAttendance[s.id] }))

    const result = await saveAttendance.mutateAsync({
      batchId: selectedBatchId,
      date: selectedDate,
      records,
    })

    // Send absence alerts if there are absent students
    if (result?.absentStudents?.length > 0) {
      await sendAbsenceAlerts.mutateAsync({
        absentStudents: result.absentStudents,
        date: selectedDate,
      })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Mark and track daily student attendance"
      />

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label>Batch</Label>
          <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select batch" />
            </SelectTrigger>
            <SelectContent>
              {activeBatches.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Date</Label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={todayStr}
            className="w-44"
          />
        </div>
      </div>

      {selectedBatchId && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard title="Present" value={present} icon={CheckCircle} variant="green" />
            <StatCard title="Absent" value={absent} icon={XCircle} variant="red" />
            <StatCard title="Leave" value={leave} icon={Clock} variant="blue" />
            <StatCard title="Unmarked" value={unmarked} icon={CalendarCheck} variant="yellow" />
          </div>

          {/* Mark all actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => markAll('present')} className="text-green-700 border-green-200">
                Mark All Present
              </Button>
              <Button size="sm" variant="outline" onClick={() => markAll('absent')} className="text-red-700 border-red-200">
                Mark All Absent
              </Button>
            </div>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saveAttendance.isPending || students.length === 0}
            >
              <Save className="mr-1.5 h-4 w-4" />
              {saveAttendance.isPending ? 'Saving...' : 'Save Attendance'}
            </Button>
          </div>

          <Separator />

          {/* Student roster */}
          {studentsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 rounded-md bg-muted animate-pulse" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No active students"
              description="No active students found in this batch"
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead className="w-64">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => {
                    const currentStatus = mergedAttendance[student.id] ?? null
                    return (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <StudentAvatar name={`${student.firstName} ${student.lastName}`} photoPath={student.photoUrl} size="sm" />
                            <div>
                              <p className="font-medium text-sm">{student.firstName} {student.lastName}</p>
                              <p className="text-xs text-muted-foreground">{student.enrollmentId}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <ToggleGroup
                            type="single"
                            value={currentStatus ?? ''}
                            onValueChange={(v) => {
                              if (v) setStudentStatus(student.id, v as AttendanceStatus)
                            }}
                            className="justify-start"
                          >
                            <ToggleGroupItem value="present" className="data-[state=on]:bg-green-100 data-[state=on]:text-green-800 text-xs h-8 px-3">P</ToggleGroupItem>
                            <ToggleGroupItem value="absent" className="data-[state=on]:bg-red-100 data-[state=on]:text-red-800 text-xs h-8 px-3">A</ToggleGroupItem>
                            <ToggleGroupItem value="leave" className="data-[state=on]:bg-blue-100 data-[state=on]:text-blue-800 text-xs h-8 px-3">L</ToggleGroupItem>
                          </ToggleGroup>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      {!selectedBatchId && (
        <EmptyState
          icon={CalendarCheck}
          title="Select a batch"
          description="Choose a batch above to start marking attendance"
        />
      )}
    </div>
  )
}
