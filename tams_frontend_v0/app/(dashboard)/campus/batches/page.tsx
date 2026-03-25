'use client'
import { useState } from 'react'
import { Plus, Pencil, Archive, BookOpen } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingTable } from '@/components/shared/LoadingTable'
import { useBatches, useCreateBatch, useUpdateBatch, useArchiveBatch } from '@/hooks/useBatches'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import { Batch } from '@/lib/types'

const batchSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  grade: z.string().min(1, 'Grade is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  monthlyFee: z.number({ coerce: true }).min(0, 'Fee must be non-negative'),
})

type BatchSchema = z.infer<typeof batchSchema>

export default function BatchesPage() {
  const { data: batches = [], isLoading } = useBatches()
  const createBatch = useCreateBatch()
  const updateBatch = useUpdateBatch()
  const archiveBatch = useArchiveBatch()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editBatch, setEditBatch] = useState<Batch | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<Batch | null>(null)

  const form = useForm<BatchSchema>({
    resolver: zodResolver(batchSchema),
    defaultValues: { name: '', grade: '', academicYear: '', monthlyFee: 0 },
  })

  function openCreate() {
    setEditBatch(null)
    form.reset({ name: '', grade: '', academicYear: '', monthlyFee: 0 })
    setSheetOpen(true)
  }

  function openEdit(batch: Batch) {
    setEditBatch(batch)
    form.reset({
      name: batch.name,
      grade: batch.grade,
      academicYear: batch.academicYear,
      monthlyFee: batch.monthlyFee,
    })
    setSheetOpen(true)
  }

  async function onSubmit(values: BatchSchema) {
    if (editBatch) {
      await updateBatch.mutateAsync({ id: editBatch.id, data: values })
    } else {
      await createBatch.mutateAsync(values)
    }
    setSheetOpen(false)
  }

  async function handleArchive() {
    if (!archiveTarget) return
    await archiveBatch.mutateAsync(archiveTarget.id)
    setArchiveTarget(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Batches"
        description="Manage your academy batches and classes"
        action={
          <Button onClick={openCreate} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New Batch
          </Button>
        }
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Academic Year</TableHead>
              <TableHead>Monthly Fee</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <LoadingTable rows={4} columns={7} />
            ) : batches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12">
                  <EmptyState
                    icon={BookOpen}
                    title="No batches yet"
                    description="Create your first batch to get started"
                    action={{ label: 'Create Batch', onClick: openCreate }}
                  />
                </TableCell>
              </TableRow>
            ) : (
              batches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell className="font-medium">{batch.name}</TableCell>
                  <TableCell>{batch.grade}</TableCell>
                  <TableCell>{batch.academicYear}</TableCell>
                  <TableCell>{formatCurrency(batch.monthlyFee)}</TableCell>
                  <TableCell>{batch.studentCount ?? 0}</TableCell>
                  <TableCell>
                    <StatusBadge status={batch.isArchived ? 'inactive' : 'active'} label={batch.isArchived ? 'Archived' : 'Active'} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(batch)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {!batch.isArchived && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-orange-600 hover:text-orange-700" onClick={() => setArchiveTarget(batch)}>
                          <Archive className="h-3.5 w-3.5" />
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

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editBatch ? 'Edit Batch' : 'Create Batch'}</SheetTitle>
          </SheetHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Batch Name</Label>
              <Input id="name" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="grade">Grade / Class</Label>
              <Input id="grade" placeholder="e.g. Grade 9, Class 10" {...form.register('grade')} />
              {form.formState.errors.grade && (
                <p className="text-xs text-destructive">{form.formState.errors.grade.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="academicYear">Academic Year</Label>
              <Input id="academicYear" placeholder="e.g. 2025-2026" {...form.register('academicYear')} />
              {form.formState.errors.academicYear && (
                <p className="text-xs text-destructive">{form.formState.errors.academicYear.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="monthlyFee">Monthly Fee (PKR)</Label>
              <Input id="monthlyFee" type="number" min={0} {...form.register('monthlyFee', { valueAsNumber: true })} />
              {form.formState.errors.monthlyFee && (
                <p className="text-xs text-destructive">{form.formState.errors.monthlyFee.message}</p>
              )}
            </div>
            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createBatch.isPending || updateBatch.isPending}>
                {editBatch ? 'Save Changes' : 'Create Batch'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Archive confirm */}
      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        title="Archive Batch"
        description={`Archive "${archiveTarget?.name}"? Students will remain but the batch won't show in active lists.`}
        confirmLabel="Archive"
        onConfirm={handleArchive}
        danger
        loading={archiveBatch.isPending}
      />
    </div>
  )
}
