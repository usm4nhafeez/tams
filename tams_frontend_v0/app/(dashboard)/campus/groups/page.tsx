'use client'
import { useState } from 'react'
import { Plus, Trash2, Layers } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useBatches, useGroups, useCreateGroup, useDeleteGroup } from '@/hooks/useBatches'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Group } from '@/lib/types'

const groupSchema = z.object({
  batchId: z.string().min(1, 'Batch is required'),
  name: z.string().min(1, 'Group name is required'),
})

type GroupSchema = z.infer<typeof groupSchema>

export default function GroupsPage() {
  const { data: batches = [] } = useBatches()
  const [filterBatchId, setFilterBatchId] = useState<string>('all')
  const { data: groups = [], isLoading } = useGroups(
    filterBatchId !== 'all' ? filterBatchId : undefined
  )
  const createGroup = useCreateGroup()
  const deleteGroup = useDeleteGroup()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null)

  const form = useForm<GroupSchema>({
    resolver: zodResolver(groupSchema),
    defaultValues: { batchId: '', name: '' },
  })

  async function onSubmit(values: GroupSchema) {
    await createGroup.mutateAsync(values)
    setSheetOpen(false)
    form.reset()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteGroup.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }

  const activeBatches = batches.filter((b) => !b.isArchived)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Groups"
        description="Organise students within batches into groups"
        action={
          <Button onClick={() => setSheetOpen(true)} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New Group
          </Button>
        }
      />

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Label className="shrink-0 text-sm">Filter by Batch:</Label>
        <Select value={filterBatchId} onValueChange={setFilterBatchId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All batches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {activeBatches.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No groups found"
          description="Create groups to organise students within batches"
          action={{ label: 'Create Group', onClick: () => setSheetOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {groups.map((group) => {
            const batch = batches.find((b) => b.id === group.batchId)
            return (
              <Card key={group.id} className="relative">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{group.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {batch?.name ?? group.batchId}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {group.studentCount ?? 0} students
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                      onClick={() => setDeleteTarget(group)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Create Group</SheetTitle>
          </SheetHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div className="space-y-1">
              <Label>Batch</Label>
              <Select
                value={form.watch('batchId')}
                onValueChange={(v) => form.setValue('batchId', v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {activeBatches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.batchId && (
                <p className="text-xs text-destructive">{form.formState.errors.batchId.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="groupName">Group Name</Label>
              <Input id="groupName" placeholder="e.g. Morning, A-Section" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createGroup.isPending}>
                Create Group
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Group"
        description={`Delete group "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        danger
        loading={deleteGroup.isPending}
      />
    </div>
  )
}
