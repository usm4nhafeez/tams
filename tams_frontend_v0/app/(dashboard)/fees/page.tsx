'use client'
import { useState } from 'react'
import { DollarSign, Download, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { StudentAvatar } from '@/components/shared/StudentAvatar'
import { LoadingTable } from '@/components/shared/LoadingTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useFees, useGenerateFees, useRecordPayment, useGenerateReceipt } from '@/hooks/useFees'
import { useBatches } from '@/hooks/useBatches'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { FeeRecord, FeeStatus, PaymentMode } from '@/lib/types'
import { formatCurrency, formatMonth } from '@/lib/utils'

function PaymentDialog({ fee, onClose }: { fee: FeeRecord | null; onClose: () => void }) {
  const recordPayment = useRecordPayment()
  const { register, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: { amountPaid: 0, paymentMode: 'cash' as PaymentMode, notes: '' },
  })

  async function onSubmit(values: { amountPaid: number; paymentMode: PaymentMode; notes: string }) {
    if (!fee) return
    await recordPayment.mutateAsync({ id: fee.id, amountPaid: values.amountPaid, paymentMode: values.paymentMode, notes: values.notes })
    reset()
    onClose()
  }

  if (!fee) return null
  return (
    <Dialog open={!!fee} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="rounded-md bg-muted p-3 text-sm space-y-1">
            <p>Student: {fee.student ? `${fee.student.firstName} ${fee.student.lastName}` : fee.studentId}</p>
            <p>Month: {formatMonth(fee.month)}</p>
            <p>Balance Due: {formatCurrency((fee.amount ?? 0) - (fee.paidAmount ?? 0))}</p>
          </div>
          <div className="space-y-1">
            <Label>Amount Paid (PKR)</Label>
            <Input type="number" min={1} {...register('amountPaid', { valueAsNumber: true })} />
          </div>
          <div className="space-y-1">
            <Label>Payment Mode</Label>
            <Select value={watch('paymentMode')} onValueChange={(v) => setValue('paymentMode', v as PaymentMode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
            <Input {...register('notes')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={recordPayment.isPending}>Record Payment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function FeesPage() {
  const today = new Date()
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedBatchId, setSelectedBatchId] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [payFee, setPayFee] = useState<FeeRecord | null>(null)
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false)

  const { data: fees = [], isLoading } = useFees({
    month: selectedMonth,
    batchId: selectedBatchId !== 'all' ? selectedBatchId : undefined,
    status: selectedStatus !== 'all' ? (selectedStatus as FeeStatus) : undefined,
  })
  const { data: batches = [] } = useBatches()
  const generateFees = useGenerateFees()
  const generateReceipt = useGenerateReceipt()

  const totalDue = fees.reduce((s, f) => s + f.amount, 0)
  const totalCollected = fees.reduce((s, f) => s + (f.paidAmount ?? 0), 0)
  const totalPending = fees.filter((f) => f.status === 'pending' || f.status === 'partial').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fees"
        description="Track and collect monthly student fees"
        action={
          <Button size="sm" variant="outline" onClick={() => setShowGenerateConfirm(true)} disabled={generateFees.isPending}>
            <CreditCard className="mr-1.5 h-4 w-4" />
            Generate Fees
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Total Due" value={formatCurrency(totalDue)} icon={DollarSign} variant="navy" />
        <StatCard title="Collected" value={formatCurrency(totalCollected)} icon={CheckCircle} variant="green" />
        <StatCard title="Pending" value={totalPending} icon={AlertTriangle} variant="red" subText="records unpaid" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label>Month</Label>
          <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-44" />
        </div>
        <div className="space-y-1">
          <Label>Batch</Label>
          <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Batches" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {batches.filter(b => !b.isArchived).map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Month</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <LoadingTable rows={6} columns={7} />
            ) : fees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-14">
                  <EmptyState
                    icon={DollarSign}
                    title="No fee records"
                    description="Generate fees for this month to begin tracking"
                    action={{ label: 'Generate Fees', onClick: () => setShowGenerateConfirm(true) }}
                  />
                </TableCell>
              </TableRow>
            ) : (
              fees.map((fee) => (
                <TableRow key={fee.id}>
                  <TableCell>
                    {fee.student ? (
                      <div className="flex items-center gap-2">
                        <StudentAvatar name={`${fee.student.firstName} ${fee.student.lastName}`} photoPath={fee.student.photoUrl} size="sm" />
                        <div>
                          <p className="text-sm font-medium">{fee.student.firstName} {fee.student.lastName}</p>
                          <p className="text-xs text-muted-foreground">{fee.student.batch?.name}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">{fee.studentId}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{formatMonth(fee.month)}</TableCell>
                  <TableCell className="text-sm">{formatCurrency(fee.amount)}</TableCell>
                  <TableCell className="text-sm">{formatCurrency(fee.paidAmount)}</TableCell>
                  <TableCell className="text-sm font-medium">{formatCurrency((fee.amount ?? 0) - (fee.paidAmount ?? 0))}</TableCell>
                  <TableCell><StatusBadge status={fee.status} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {fee.status !== 'paid' && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setPayFee(fee)}>Pay</Button>
                      )}
                      {fee.receiptNumber && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => generateReceipt.mutate(fee.id)} title="Download Receipt">
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

      <PaymentDialog fee={payFee} onClose={() => setPayFee(null)} />

      <ConfirmDialog
        open={showGenerateConfirm}
        onOpenChange={setShowGenerateConfirm}
        title="Generate Fees"
        description={`Generate fee records for ${formatMonth(selectedMonth)} for all active students? Existing records will not be duplicated.`}
        confirmLabel="Generate"
        onConfirm={async () => {
          await generateFees.mutateAsync(selectedMonth)
          setShowGenerateConfirm(false)
        }}
        loading={generateFees.isPending}
      />
    </div>
  )
}
