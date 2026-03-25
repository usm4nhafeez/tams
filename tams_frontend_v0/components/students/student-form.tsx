'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Upload, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBatches, useGroups } from '@/hooks/useBatches'
import { useCreateStudent, useUpdateStudent } from '@/hooks/useStudents'
import type { Student, StudentFormData } from '@/lib/types'
import { toSnakeCase } from '@/lib/utils'

interface StudentFormProps {
  student?: Student
  mode: 'create' | 'edit'
}

export function StudentForm({ student, mode }: StudentFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data: batches = [] } = useBatches()
  const createStudentMutation = useCreateStudent()
  const updateStudentMutation = useUpdateStudent()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    student?.photoUrl ?? null
  )
  const [formData, setFormData] = useState<StudentFormData>({
    firstName: student?.firstName ?? '',
    lastName: student?.lastName ?? '',
    dateOfBirth: student?.dateOfBirth ?? '',
    gender: student?.gender ?? 'male',
    batchId: student?.batchId ?? '',
    groupId: student?.groupId ?? '',
    parentName: student?.parentName ?? '',
    parentPhone: student?.parentPhone ?? '',
    parentEmail: student?.parentEmail ?? '',
    address: student?.address ?? '',
    admissionFee: student?.admissionFee ?? 0,
    monthlyDiscount: student?.monthlyDiscount ?? 0,
  })

  const { data: groups = [] } = useGroups(formData.batchId || undefined)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({ ...formData, photo: file })
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removePhoto = () => {
    setFormData({ ...formData, photo: undefined })
    setPhotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const fd = new FormData()
      Object.entries(formData).forEach(([k, v]) => {
        if (v !== undefined && v !== '') {
          if (v instanceof File) {
            fd.append(toSnakeCase(k), v)
          } else {
            fd.append(toSnakeCase(k), String(v))
          }
        }
      })

      if (mode === 'create') {
        await createStudentMutation.mutateAsync(fd)
        router.push('/students')
      } else if (student) {
        await updateStudentMutation.mutateAsync({ id: student.id, formData: fd })
        router.push(`/students/${student.id}`)
      }
    } catch {
      // error is handled by the mutation's onError
    } finally {
      setIsSubmitting(false)
    }
  }

  const getInitials = () => {
    if (formData.firstName && formData.lastName) {
      return `${formData.firstName.charAt(0)}${formData.lastName.charAt(0)}`.toUpperCase()
    }
    return 'ST'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Photo Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Photo</CardTitle>
            <CardDescription>Upload a student photo</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative mb-4">
              <Avatar className="size-32">
                <AvatarImage src={photoPreview ?? undefined} />
                <AvatarFallback className="text-2xl">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              {photoPreview && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 size-6"
                  onClick={removePhoto}
                >
                  <X className="size-3" />
                </Button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 size-4" />
              {photoPreview ? 'Change Photo' : 'Upload Photo'}
            </Button>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Basic student details</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  setFormData({ ...formData, dateOfBirth: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select
                value={formData.gender}
                onValueChange={(value: 'male' | 'female' | 'other') =>
                  setFormData({ ...formData, gender: value })
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
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Academic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Academic Information</CardTitle>
            <CardDescription>Batch and group assignment</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="batchId">Batch *</Label>
              <Select
                value={formData.batchId}
                onValueChange={(value) =>
                  setFormData({ ...formData, batchId: value, groupId: '' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches
                    .filter((b) => !b.isArchived)
                    .map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name} ({batch.grade})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="groupId">Group (Optional)</Label>
              <Select
                value={formData.groupId || '__none__'}
                onValueChange={(value) =>
                  setFormData({ ...formData, groupId: value === '__none__' ? undefined : value })
                }
                disabled={!formData.batchId || groups.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No Group</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Parent / Guardian Information */}
        <Card>
          <CardHeader>
            <CardTitle>Parent / Guardian</CardTitle>
            <CardDescription>Contact information</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="parentName">Parent Name *</Label>
              <Input
                id="parentName"
                value={formData.parentName}
                onChange={(e) =>
                  setFormData({ ...formData, parentName: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="parentPhone">Phone Number *</Label>
              <Input
                id="parentPhone"
                type="tel"
                placeholder="+91 9876543210"
                value={formData.parentPhone}
                onChange={(e) =>
                  setFormData({ ...formData, parentPhone: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="parentEmail">Email (Optional)</Label>
              <Input
                id="parentEmail"
                type="email"
                value={formData.parentEmail ?? ''}
                onChange={(e) =>
                  setFormData({ ...formData, parentEmail: e.target.value || undefined })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
            <CardDescription>Student&apos;s residence</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter full address..."
              value={formData.address ?? ''}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value || undefined })
              }
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Fee Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Fee Configuration</CardTitle>
            <CardDescription>One-time and recurring fee settings</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="admissionFee">Admission Fee (₹)</Label>
              <Input
                id="admissionFee"
                type="number"
                min="0"
                value={formData.admissionFee}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    admissionFee: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="monthlyDiscount">Monthly Discount (₹)</Label>
              <Input
                id="monthlyDiscount"
                type="number"
                min="0"
                value={formData.monthlyDiscount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    monthlyDiscount: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !formData.batchId}>
          {isSubmitting
            ? 'Saving...'
            : mode === 'create'
              ? 'Add Student'
              : 'Update Student'}
        </Button>
      </div>
    </form>
  )
}
