'use client'
import { useState } from 'react'
import { Plus, ClipboardList, Lock, CheckSquare } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingTable } from '@/components/shared/LoadingTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { StudentAvatar } from '@/components/shared/StudentAvatar'
import { useExams, useSubjects, useCreateExam, useSaveResults, useExamResults, useLockExam } from '@/hooks/useExams'
import { useBatches, useGroups } from '@/hooks/useBatches'
import { useStudents } from '@/hooks/useStudents'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Exam, ExamFormData, ExamType, MarksEntryPayload } from '@/lib/types'
import { formatDate } from '@/lib/utils'

const examSchema = z.object({
  name: z.string().min(1, 'Name required'),
  batchId: z.string().min(1, 'Batch required'),
  groupId: z.string().optional(),
  subject: z.string().min(1, 'Subject required'),
  type: z.enum(['weekly', 'monthly', 'quarterly', 'annual'] as const),
  examDate: z.string().min(1, 'Date required'),
  maxMarks: z.number({ coerce: true }).min(1),
  passingMarks: z.number({ coerce: true }).min(0),
})

type ExamSchema = z.infer<typeof examSchema>

function MarksDialog({
  exam,
  onClose,
}: {
  exam: Exam | null
  onClose: () => void
}) {
  const { data: students = [] } = useStudents(exam ? { batchId: exam.batchId, status: 'active' } : undefined)
  const { data: existingResults = [] } = useExamResults(exam?.id ?? '')
  const saveResults = useSaveResults()
  const [marks, setMarks] = useState<Record<string, { marks: string; absent: boolean }>>({})

  const getMarks = (studentId: string) =>
    marks[studentId] ?? {
      marks: String(existingResults.find((r) => r.studentId === studentId)?.marksObtained ?? ''),
      absent: existingResults.find((r) => r.studentId === studentId)?.isAbsent ?? false,
    }

  async function handleSave() {
    if (!exam) return
    const results: MarksEntryPayload[] = students.map((s) => {
      const entry = getMarks(s.id)
      return {
        studentId: s.id,
        marksObtained: entry.absent ? null : (entry.marks !== '' ? Number(entry.marks) : null),
        isAbsent: entry.absent,
      }
    })
    await saveResults.mutateAsync({ examId: exam.id, results })
    onClose()
  }

  if (!exam) return null

  return (
    <Dialog open={!!exam} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enter Marks — {exam.name}</DialogTitle>
          <p className="text-sm text-muted-foreground">Max Marks: {exam.maxMarks} · Passing: {exam.passingMarks}</p>
        </DialogHeader>
        <div className="mt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="w-32">Marks</TableHead>
                <TableHead className="w-20">%</TableHead>
                <TableHead className="w-20">Absent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => {
                const entry = getMarks(student.id)
                const pct = !entry.absent && entry.marks !== '' ? ((Number(entry.marks) / exam.maxMarks) * 100).toFixed(1) : '—'
                return (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StudentAvatar name={`${student.firstName} ${student.lastName}`} photoPath={student.photoUrl} size="sm" />
                        <span className="text-sm">{student.firstName} {student.lastName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={exam.maxMarks}
                        value={entry.marks}
                        disabled={entry.absent}
                        className="h-8 w-24"
                        onChange={(e) =>
                          setMarks((prev) => ({
                            ...prev,
                            [student.id]: { ...getMarks(student.id), marks: e.target.value },
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{pct}</TableCell>
                    <TableCell>
                      <Checkbox
                        checked={entry.absent}
                        onCheckedChange={(checked) =>
                          setMarks((prev) => ({
                            ...prev,
                            [student.id]: { ...getMarks(student.id), absent: !!checked, marks: '' },
                          }))
                        }
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saveResults.isPending}>
            {saveResults.isPending ? 'Saving...' : 'Save Marks'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function ExamsPage() {
  const today = new Date()
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  const [selectedBatchId, setSelectedBatchId] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [marksExam, setMarksExam] = useState<Exam | null>(null)

  const { data: exams = [], isLoading } = useExams({
    batchId: selectedBatchId !== 'all' ? selectedBatchId : undefined,
    type: selectedType !== 'all' ? (selectedType as ExamType) : undefined,
    month: selectedMonth,
  })
  const { data: batches = [] } = useBatches()
  const createExam = useCreateExam()
  const lockExam = useLockExam()

  const form = useForm<ExamSchema>({
    resolver: zodResolver(examSchema),
    defaultValues: { name: '', batchId: '', groupId: '', subject: '', type: 'monthly', examDate: '', maxMarks: 100, passingMarks: 40 },
  })

  const watchBatchId = form.watch('batchId')
  const { data: groups = [] } = useGroups(watchBatchId || undefined)
  const { data: subjects = [] } = useSubjects(watchBatchId || undefined)

  async function onSubmit(values: ExamSchema) {
    const payload: ExamFormData = {
      name: values.name,
      batchId: values.batchId,
      groupId: values.groupId || undefined,
      subject: values.subject,
      type: values.type,
      examDate: values.examDate,
      maxMarks: values.maxMarks,
      passingMarks: values.passingMarks,
    }
    await createExam.mutateAsync(payload)
    setSheetOpen(false)
    form.reset()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exams"
        description="Create and manage examinations and results"
        action={
          <Button size="sm" onClick={() => setSheetOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Exam
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label>Month</Label>
          <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1">
          <Label>Batch</Label>
          <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Batches" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {batches.filter(b => !b.isArchived).map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Type</Label>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="annual">Annual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Max Marks</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <LoadingTable rows={4} columns={8} />
            ) : exams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-14">
                  <EmptyState icon={ClipboardList} title="No exams found" description="Create an exam to get started" action={{ label: 'Create Exam', onClick: () => setSheetOpen(true) }} />
                </TableCell>
              </TableRow>
            ) : (
              exams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">{exam.name}</TableCell>
                  <TableCell>{exam.subject}</TableCell>
                  <TableCell><StatusBadge status={exam.type} /></TableCell>
                  <TableCell>{exam.batch?.name ?? exam.batchId}</TableCell>
                  <TableCell className="text-sm">{formatDate(exam.examDate)}</TableCell>
                  <TableCell>{exam.maxMarks}</TableCell>
                  <TableCell>
                    {exam.isLocked ? (
                      <StatusBadge status="inactive" label="Locked" />
                    ) : (
                      <StatusBadge status="active" label="Open" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {!exam.isLocked && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setMarksExam(exam)}>
                          <CheckSquare className="mr-1 h-3 w-3" /> Marks
                        </Button>
                      )}
                      {!exam.isLocked && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => lockExam.mutate(exam.id)} title="Lock Exam">
                          <Lock className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Exam Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader><SheetTitle>Create Exam</SheetTitle></SheetHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div className="space-y-1">
              <Label>Exam Name</Label>
              <Input {...form.register('name')} placeholder="e.g. Monthly Test - March" />
              {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Batch</Label>
              <Select value={form.watch('batchId') || undefined} onValueChange={(v) => form.setValue('batchId', v, { shouldValidate: true })}>                <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                <SelectContent>
                  {batches.filter(b => !b.isArchived).map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {form.formState.errors.batchId && <p className="text-xs text-destructive">{form.formState.errors.batchId.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Group (optional)</Label>
              <Select value={form.watch('groupId') || '__none__'} onValueChange={(v) => form.setValue('groupId', v === '__none__' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="All groups" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">All groups</SelectItem>
                  {groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Subject</Label>
              {subjects.length > 0 ? (
                <Select value={form.watch('subject') || undefined} onValueChange={(v) => form.setValue('subject', v, { shouldValidate: true })}>                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input {...form.register('subject')} placeholder="e.g. Mathematics" />
              )}
              {form.formState.errors.subject && <p className="text-xs text-destructive">{form.formState.errors.subject.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Exam Type</Label>
              <Controller
                control={form.control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1">
              <Label>Exam Date</Label>
              <Input type="date" {...form.register('examDate')} />
              {form.formState.errors.examDate && <p className="text-xs text-destructive">{form.formState.errors.examDate.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Max Marks</Label>
                <Input type="number" min={1} {...form.register('maxMarks', { valueAsNumber: true })} />
              </div>
              <div className="space-y-1">
                <Label>Passing Marks</Label>
                <Input type="number" min={0} {...form.register('passingMarks', { valueAsNumber: true })} />
              </div>
            </div>
            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createExam.isPending}>Create Exam</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <MarksDialog exam={marksExam} onClose={() => setMarksExam(null)} />
    </div>
  )
}
