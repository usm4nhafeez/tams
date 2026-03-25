'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Eye, Pencil, Users, X, Upload } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageHeader } from '@/components/shared/PageHeader'
import { StudentAvatar } from '@/components/shared/StudentAvatar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingTable } from '@/components/shared/LoadingTable'
import { useStudents, useCreateStudent, useUpdateStudent } from '@/hooks/useStudents'
import { useBatches, useGroups } from '@/hooks/useBatches'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Student, StudentFilters } from '@/lib/types'
import { formatDate, getPhotoUrl, toSnakeCase } from '@/lib/utils'

const studentSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  dateOfBirth: z.string().min(1, 'Date of birth required'),
  gender: z.enum(['male', 'female', 'other']),
  batchId: z.string().min(1, 'Batch required'),
  groupId: z.string().optional(),
  parentName: z.string().min(1, 'Parent name required'),
  parentPhone: z.string().min(1, 'Parent phone required'),
  parentEmail: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  admissionFee: z.number({ coerce: true }).min(0),
  monthlyDiscount: z.number({ coerce: true }).min(0),
})

type StudentSchema = z.infer<typeof studentSchema>

function StudentFormSheet({
  open,
  onOpenChange,
  student,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  student?: Student | null
}) {
  const { data: batches = [] } = useBatches()
  const form = useForm<StudentSchema>({
    resolver: zodResolver(studentSchema),
    defaultValues: student
      ? {
          firstName: student.firstName,
          lastName: student.lastName,
          dateOfBirth: student.dateOfBirth.split('T')[0],
          gender: student.gender,
          batchId: student.batchId,
          groupId: student.groupId ?? '',
          parentName: student.parentName,
          parentPhone: student.parentPhone,
          parentEmail: student.parentEmail ?? '',
          address: student.address ?? '',
          admissionFee: student.admissionFee,
          monthlyDiscount: student.monthlyDiscount,
        }
      : {
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          gender: 'male',
          batchId: '',
          groupId: '',
          parentName: '',
          parentPhone: '',
          parentEmail: '',
          address: '',
          admissionFee: 0,
          monthlyDiscount: 0,
        },
  })

  const watchBatchId = form.watch('batchId')
  const { data: groups = [] } = useGroups(watchBatchId || undefined)
  const createStudent = useCreateStudent()
  const updateStudent = useUpdateStudent()
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    student?.photoUrl ? (getPhotoUrl(student.photoUrl) ?? null) : null
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeBatches = batches.filter((b) => !b.isArchived)

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function onSubmit(values: StudentSchema) {
    const fd = new FormData()
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== '') fd.append(toSnakeCase(k), String(v))
    })
    if (photoFile) fd.append('photo', photoFile)

    if (student) {
      await updateStudent.mutateAsync({ id: student.id, formData: fd })
    } else {
      await createStudent.mutateAsync(fd)
    }
    onOpenChange(false)
  }

  const isPending = createStudent.isPending || updateStudent.isPending

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{student ? 'Edit Student' : 'Add Student'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="px-4 pb-4 space-y-4">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="academic">Academic</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList>

            {/* Personal */}
            <TabsContent value="personal" className="space-y-4">
              {/* Photo upload */}
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center shrink-0">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {photoPreview ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                  {photoPreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPhotoPreview(null)
                        setPhotoFile(null)
                      }}
                    >
                      <X className="h-3 w-3 mr-1" /> Remove
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>First Name</Label>
                  <Input {...form.register('firstName')} />
                  {form.formState.errors.firstName && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Last Name</Label>
                  <Input {...form.register('lastName')} />
                  {form.formState.errors.lastName && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label>Date of Birth</Label>
                <Input type="date" {...form.register('dateOfBirth')} />
                {form.formState.errors.dateOfBirth && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.dateOfBirth.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label>Gender</Label>
                <Select
                  value={form.watch('gender')}
                  onValueChange={(v) =>
                    form.setValue('gender', v as 'male' | 'female' | 'other')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Academic */}
            <TabsContent value="academic" className="space-y-4">
              <div className="space-y-1">
                <Label>Batch</Label>
                <Select
                  value={form.watch('batchId')}
                  onValueChange={(v) => {
                    form.setValue('batchId', v, { shouldValidate: true })
                    form.setValue('groupId', '')
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeBatches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.batchId && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.batchId.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label>Group (optional)</Label>
                <Select
                  value={form.watch('groupId') || '__none__'}
                  onValueChange={(v) => form.setValue('groupId', v === '__none__' ? '' : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No group</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Joining Date</Label>
                <p className="text-sm text-muted-foreground">
                  {student
                    ? formatDate(student.joiningDate)
                    : 'Set automatically on creation'}
                </p>
              </div>
            </TabsContent>

            {/* Financial */}
            <TabsContent value="financial" className="space-y-4">
              <div className="space-y-1">
                <Label>Admission Fee (PKR)</Label>
                <Input
                  type="number"
                  min={0}
                  {...form.register('admissionFee', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1">
                <Label>Monthly Discount (PKR)</Label>
                <Input
                  type="number"
                  min={0}
                  {...form.register('monthlyDiscount', { valueAsNumber: true })}
                />
              </div>
            </TabsContent>

            {/* Contact */}
            <TabsContent value="contact" className="space-y-4">
              <div className="space-y-1">
                <Label>Parent / Guardian Name</Label>
                <Input {...form.register('parentName')} />
                {form.formState.errors.parentName && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.parentName.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Parent Phone</Label>
                <Input {...form.register('parentPhone')} />
                {form.formState.errors.parentPhone && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.parentPhone.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Parent Email (optional)</Label>
                <Input type="email" {...form.register('parentEmail')} />
                {form.formState.errors.parentEmail && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.parentEmail.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Address (optional)</Label>
                <Textarea {...form.register('address')} rows={3} />
              </div>
            </TabsContent>
          </Tabs>

          <SheetFooter className="flex-row justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : student ? 'Save Changes' : 'Add Student'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export default function StudentsPage() {
  const router = useRouter()
  const [filters, setFilters] = useState<StudentFilters>({ status: 'active' })
  const [filterBatchId, setFilterBatchId] = useState('all')
  const [filterGroupId, setFilterGroupId] = useState('all')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editStudent, setEditStudent] = useState<Student | null>(null)

  const { data: students = [], isLoading } = useStudents({
    ...filters,
    batchId: filterBatchId !== 'all' ? filterBatchId : undefined,
    groupId: filterGroupId !== 'all' ? filterGroupId : undefined,
  })
  const { data: batches = [] } = useBatches()
  const { data: groups = [] } = useGroups(
    filterBatchId !== 'all' ? filterBatchId : undefined
  )

  function openAdd() {
    setEditStudent(null)
    setSheetOpen(true)
  }

  function openEdit(s: Student) {
    setEditStudent(s)
    setSheetOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description={`${students.length} student${students.length !== 1 ? 's' : ''} found`}
        action={
          <Button size="sm" onClick={openAdd}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Student
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or enrollment ID..."
            className="pl-8"
            value={filters.search ?? ''}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value || undefined }))
            }
          />
        </div>

        <Select
          value={filterBatchId}
          onValueChange={(v) => {
            setFilterBatchId(v)
            setFilterGroupId('all')
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Batches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {batches
              .filter((b) => !b.isArchived)
              .map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <Select value={filterGroupId} onValueChange={setFilterGroupId}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Groups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status ?? 'all'}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, status: v as StudentFilters['status'] }))
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Enrollment ID</TableHead>
              <TableHead>Batch / Group</TableHead>
              <TableHead>Parent / Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <LoadingTable rows={6} columns={6} />
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-14">
                  <EmptyState
                    icon={Users}
                    title="No students found"
                    description="Try adjusting your filters or add a new student"
                    action={{ label: 'Add Student', onClick: openAdd }}
                  />
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow
                  key={student.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/dashboard/students/${student.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <StudentAvatar
                        name={`${student.firstName} ${student.lastName}`}
                        photoPath={student.photoUrl}
                        size="sm"
                      />
                      <p className="font-medium">
                        {student.firstName} {student.lastName}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                      {student.enrollmentId}
                    </code>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>{student.batch?.name ?? student.batchId}</div>
                    {student.group && (
                      <div className="text-xs text-muted-foreground">
                        {student.group.name}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>{student.parentName}</div>
                    <div className="text-xs text-muted-foreground">
                      {student.parentPhone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={student.isActive ? 'active' : 'inactive'} />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="View profile"
                        onClick={() => router.push(`/dashboard/students/${student.id}`)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Edit student"
                        onClick={() => openEdit(student)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <StudentFormSheet
        key={editStudent?.id ?? '__new__'}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open)
          if (!open) setEditStudent(null)
        }}
        student={editStudent}
      />
    </div>
  )
}
