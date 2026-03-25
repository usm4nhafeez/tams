'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Download,
  MessageCircle,
  CalendarCheck,
} from 'lucide-react'
import { StudentAvatar } from '@/components/shared/StudentAvatar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { StatCard } from '@/components/shared/StatCard'
import { useStudentProfile } from '@/hooks/useStudents'
import { useFees, useGenerateReceipt, useRecordPayment } from '@/hooks/useFees'
import { useMonthlyAttendance } from '@/hooks/useAttendance'
import { useExams, useGenerateReportCard } from '@/hooks/useExams'
import { useWALogs } from '@/hooks/useWhatsapp'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency, formatDate, formatMonth } from '@/lib/utils'
import type { FeeRecord, PaymentMode } from '@/lib/types'
import { useForm } from 'react-hook-form'

// ---------------------------------------------------------------------------
// Payment Dialog
// ---------------------------------------------------------------------------

function PaymentDialog({ fee, onClose }: { fee: FeeRecord | null; onClose: () => void }) {
  const recordPayment = useRecordPayment()
  const { register, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      amountPaid: 0,
      paymentMode: 'cash' as PaymentMode,
      notes: '',
    },
  })

  async function onSubmit(values: {
    amountPaid: number
    paymentMode: PaymentMode
    notes: string
  }) {
    if (!fee) return
    await recordPayment.mutateAsync({
      id: fee.id,
      amountPaid: values.amountPaid,
      paymentMode: values.paymentMode,
      notes: values.notes,
    })
    reset()
    onClose()
  }

  if (!fee) return null

  const balance = fee.amount - fee.paidAmount

  return (
    <Dialog open={!!fee} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="rounded-md bg-muted/50 px-4 py-3 space-y-1 text-sm">
            <p className="text-muted-foreground">
              Month: <span className="text-foreground font-medium">{formatMonth(fee.month)}</span>
            </p>
            <p className="text-muted-foreground">
              Amount Due:{' '}
              <span className="text-foreground font-medium">{formatCurrency(balance)}</span>
            </p>
          </div>

          <div className="space-y-1">
            <Label>Amount Paid (PKR)</Label>
            <Input
              type="number"
              min={1}
              max={balance}
              {...register('amountPaid', { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-1">
            <Label>Payment Mode</Label>
            <Select
              value={watch('paymentMode')}
              onValueChange={(v) => setValue('paymentMode', v as PaymentMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Notes (optional)</Label>
            <Input
              {...register('notes')}
              placeholder="Transaction reference, remarks, etc."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={recordPayment.isPending}>
              {recordPayment.isPending ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Profile Page
// ---------------------------------------------------------------------------

export default function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: student, isLoading } = useStudentProfile(id)

  const today = new Date()
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  // Fees — filter by studentId directly via API
  const { data: studentFees = [] } = useFees({ studentId: id })

  // Attendance — scoped to batch + month, find this student's summary
  const { data: attendanceSummaries = [] } = useMonthlyAttendance(
    student?.batchId ?? '',
    currentMonth
  )
  const studentAttendance = attendanceSummaries.find((a) => a.studentId === id)

  // Exams for the student's batch
  const { data: exams = [] } = useExams({ batchId: student?.batchId })

  // WhatsApp logs — filter by studentId or parent phone
  const { data: allMessages = [] } = useWALogs()
  const studentMessages = allMessages.filter(
    (m) =>
      m.studentId === id ||
      (student?.parentPhone && m.phone === student.parentPhone)
  )

  const generateReportCard = useGenerateReportCard()
  const generateReceipt = useGenerateReceipt()
  const [payFee, setPayFee] = useState<FeeRecord | null>(null)

  // Financial totals
  const totalDue = studentFees.reduce((s, f) => s + f.amount, 0)
  const totalPaid = studentFees.reduce((s, f) => s + f.paidAmount, 0)
  const outstanding = totalDue - totalPaid

  // -------------------------------------------------------------------------
  // Loading skeleton
  // -------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-4 w-44" />
        </div>
        <div className="flex gap-4 items-start">
          <Skeleton className="h-20 w-20 rounded-full shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Not found
  // -------------------------------------------------------------------------
  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-2">Student not found.</p>
        <Link href="/students">
          <Button variant="link">Back to Students</Button>
        </Link>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/students">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <span className="text-sm text-muted-foreground">
          Students / {student.firstName} {student.lastName}
        </span>
      </div>

      {/* Profile header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <StudentAvatar
          name={`${student.firstName} ${student.lastName}`}
          photoPath={student.photoUrl}
          size="xl"
        />
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">
              {student.firstName} {student.lastName}
            </h1>
            <StatusBadge status={student.isActive ? 'active' : 'inactive'} />
          </div>
          <p className="text-sm text-muted-foreground">
            {student.enrollmentId} · {student.batch?.name ?? student.batchId}
          </p>
          {student.group && (
            <p className="text-sm text-muted-foreground">Group: {student.group.name}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Joined: {formatDate(student.joiningDate)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-1 lg:grid-cols-2">
          <StatCard
            title="Total Paid"
            value={formatCurrency(totalPaid)}
            icon={DollarSign}
            variant="green"
          />
          <StatCard
            title="Outstanding"
            value={formatCurrency(outstanding)}
            icon={DollarSign}
            variant={outstanding > 0 ? 'red' : 'green'}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------------------------ */}
        {/* Overview                                                            */}
        {/* ------------------------------------------------------------------ */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-semibold text-sm">Personal Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>
                    {formatDate(student.dateOfBirth)} ·{' '}
                    {student.gender.charAt(0).toUpperCase() + student.gender.slice(1)}
                  </span>
                </div>
                {student.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <span>{student.address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-semibold text-sm">Contact Info</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Parent / Guardian</p>
                  <p className="font-medium">{student.parentName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{student.parentPhone}</span>
                </div>
                {student.parentEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{student.parentEmail}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ------------------------------------------------------------------ */}
        {/* Attendance                                                          */}
        {/* ------------------------------------------------------------------ */}
        <TabsContent value="attendance" className="mt-4">
          {studentAttendance ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                title="Present"
                value={studentAttendance.presentDays}
                icon={CalendarCheck}
                variant="green"
              />
              <StatCard
                title="Absent"
                value={studentAttendance.absentDays}
                icon={CalendarCheck}
                variant="red"
              />
              <StatCard
                title="Leave"
                value={studentAttendance.leaveDays}
                icon={CalendarCheck}
                variant="blue"
              />
              <StatCard
                title="Percentage"
                value={`${studentAttendance.percentage.toFixed(1)}%`}
                icon={CalendarCheck}
                variant={studentAttendance.percentage >= 75 ? 'green' : 'red'}
              />
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No attendance data available for {formatMonth(currentMonth)}.
            </p>
          )}
        </TabsContent>

        {/* ------------------------------------------------------------------ */}
        {/* Fees                                                                */}
        {/* ------------------------------------------------------------------ */}
        <TabsContent value="fees" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentFees.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No fee records found for this student.
                    </TableCell>
                  </TableRow>
                ) : (
                  studentFees.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell>{formatMonth(fee.month)}</TableCell>
                      <TableCell>{formatCurrency(fee.amount)}</TableCell>
                      <TableCell>{formatCurrency(fee.paidAmount)}</TableCell>
                      <TableCell>{formatCurrency(fee.amount - fee.paidAmount)}</TableCell>
                      <TableCell>
                        <StatusBadge status={fee.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {fee.status !== 'paid' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => setPayFee(fee)}
                            >
                              Pay
                            </Button>
                          )}
                          {fee.receiptNumber && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Download receipt"
                              onClick={() => generateReceipt.mutate(fee.id)}
                              disabled={generateReceipt.isPending}
                            >
                              <Download className="h-3.5 w-3.5" />
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
        </TabsContent>

        {/* ------------------------------------------------------------------ */}
        {/* Exams                                                               */}
        {/* ------------------------------------------------------------------ */}
        <TabsContent value="exams" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                generateReportCard.mutate({ studentId: id, month: currentMonth })
              }
              disabled={generateReportCard.isPending}
            >
              <Download className="mr-1.5 h-4 w-4" />
              {generateReportCard.isPending ? 'Generating...' : 'Download Report Card'}
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Max Marks</TableHead>
                  <TableHead>Pass Marks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No exams found for this batch.
                    </TableCell>
                  </TableRow>
                ) : (
                  exams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.name}</TableCell>
                      <TableCell>{exam.subject}</TableCell>
                      <TableCell>
                        <StatusBadge
                          status={exam.type}
                          label={exam.type.charAt(0).toUpperCase() + exam.type.slice(1)}
                        />
                      </TableCell>
                      <TableCell>{formatDate(exam.examDate)}</TableCell>
                      <TableCell>{exam.maxMarks}</TableCell>
                      <TableCell>{exam.passingMarks}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ------------------------------------------------------------------ */}
        {/* WhatsApp                                                            */}
        {/* ------------------------------------------------------------------ */}
        <TabsContent value="whatsapp" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentMessages.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <MessageCircle className="h-8 w-8 opacity-30" />
                        <span>No WhatsApp messages sent to this student.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  studentMessages.map((msg) => (
                    <TableRow key={msg.id}>
                      <TableCell>
                        <StatusBadge
                          status={msg.messageType}
                          label={msg.messageType.replace(/_/g, ' ')}
                        />
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm truncate">{msg.content}</p>
                        {msg.error && (
                          <p className="text-xs text-destructive mt-0.5">{msg.error}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={msg.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {msg.sentAt ? formatDate(msg.sentAt) : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <PaymentDialog fee={payFee} onClose={() => setPayFee(null)} />
    </div>
  )
}
