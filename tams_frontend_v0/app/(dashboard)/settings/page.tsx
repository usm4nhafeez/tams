'use client'
import { useState, useEffect } from 'react'
import { Save, Database, RotateCcw, Check } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useSettings, useSaveSetting, useBackups, useCreateBackup, useRestoreBackup } from '@/hooks/useSettings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import { Backup } from '@/lib/types'

function SettingField({
  settingKey,
  label,
  description,
  value,
  type = 'text',
  placeholder,
}: {
  settingKey: string
  label: string
  description?: string
  value: string
  type?: string
  placeholder?: string
}) {
  const [localValue, setLocalValue] = useState(value)
  const [saved, setSaved] = useState(false)
  const saveSetting = useSaveSetting()

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  async function handleSave() {
    await saveSetting.mutateAsync({ key: settingKey, value: localValue })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={settingKey}>{label}</Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <div className="flex items-center gap-2">
        <Input
          id={settingKey}
          type={type}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          size="sm"
          variant={saved ? 'default' : 'outline'}
          onClick={handleSave}
          disabled={saveSetting.isPending || localValue === value}
          className="w-20 shrink-0"
        >
          {saved ? (
            <>
              <Check className="mr-1 h-3 w-3" /> Saved
            </>
          ) : saveSetting.isPending ? (
            'Saving...'
          ) : (
            <>
              <Save className="mr-1 h-3 w-3" /> Save
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings()
  const { data: backups = [], isLoading: backupsLoading } = useBackups()
  const createBackup = useCreateBackup()
  const restoreBackup = useRestoreBackup()
  const [restoreTarget, setRestoreTarget] = useState<Backup | null>(null)

  const s = settings ?? {}

  function formatBackupSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Configure your academy management system" />

      <Tabs defaultValue="academy">
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="academy">Academy</TabsTrigger>
          <TabsTrigger value="fees">Fee Defaults</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        {/* Academy Info */}
        <TabsContent value="academy" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Academy Information</CardTitle>
              <CardDescription>Basic details displayed on receipts and reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))
              ) : (
                <>
                  <SettingField
                    settingKey="academy_name"
                    label="Academy Name"
                    value={s.academy_name ?? ''}
                    placeholder="e.g. Tips Academy"
                  />
                  <SettingField
                    settingKey="academy_address"
                    label="Address"
                    value={s.academy_address ?? ''}
                    placeholder="Full address"
                  />
                  <SettingField
                    settingKey="academy_phone"
                    label="Phone"
                    type="tel"
                    value={s.academy_phone ?? ''}
                    placeholder="+92 300 0000000"
                  />
                  <SettingField
                    settingKey="academy_email"
                    label="Email"
                    type="email"
                    value={s.academy_email ?? ''}
                    placeholder="info@academy.com"
                  />
                  <SettingField
                    settingKey="academy_reg"
                    label="Registration No."
                    value={s.academy_reg ?? ''}
                    placeholder="Registration number"
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fee Defaults */}
        <TabsContent value="fees" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fee Defaults</CardTitle>
              <CardDescription>Default fee amounts used when generating new records</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))
              ) : (
                <>
                  <SettingField
                    settingKey="default_monthly_fee"
                    label="Default Monthly Fee (PKR)"
                    type="number"
                    value={s.default_monthly_fee ?? '0'}
                    placeholder="e.g. 3000"
                  />
                  <SettingField
                    settingKey="default_admission_fee"
                    label="Default Admission Fee (PKR)"
                    type="number"
                    value={s.default_admission_fee ?? '0'}
                    placeholder="e.g. 5000"
                  />
                  <SettingField
                    settingKey="fee_due_day"
                    label="Fee Due Day (of month)"
                    type="number"
                    value={s.fee_due_day ?? '10'}
                    placeholder="e.g. 10"
                    description="Day of month on which fees are due"
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* WhatsApp Config */}
        <TabsContent value="whatsapp" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">WhatsApp Configuration</CardTitle>
              <CardDescription>Settings for automated WhatsApp messaging</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))
              ) : (
                <>
                  <SettingField
                    settingKey="wa_absence_message"
                    label="Absence Alert Template"
                    value={s.wa_absence_message ?? ''}
                    placeholder="Your child {name} was absent on {date}"
                    description="Use {name} for student name and {date} for date"
                  />
                  <SettingField
                    settingKey="wa_fee_reminder"
                    label="Fee Reminder Template"
                    value={s.wa_fee_reminder ?? ''}
                    placeholder="Dear {parent}, fee of PKR {amount} is due for {month}"
                    description="Use {parent}, {amount}, {month} as placeholders"
                  />
                  <SettingField
                    settingKey="wa_phone_country"
                    label="Default Country Code"
                    value={s.wa_phone_country ?? '92'}
                    placeholder="92"
                    description="Country code for phone numbers without prefix"
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup & Restore */}
        <TabsContent value="backup" className="mt-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Create Backup</CardTitle>
                <CardDescription>Create a snapshot of all academy data</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => createBackup.mutate()} disabled={createBackup.isPending}>
                  <Database className="mr-2 h-4 w-4" />
                  {createBackup.isPending ? 'Creating...' : 'Create Backup Now'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Backup History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Filename</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-24">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {backupsLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 4 }).map((_, j) => (
                              <TableCell key={j}>
                                <Skeleton className="h-4 w-full" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : backups.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="py-8 text-center text-sm text-muted-foreground"
                          >
                            No backups found
                          </TableCell>
                        </TableRow>
                      ) : (
                        backups.map((backup) => (
                          <TableRow key={backup.filename}>
                            <TableCell className="font-mono text-sm">{backup.filename}</TableCell>
                            <TableCell className="text-sm">{formatBackupSize(backup.size)}</TableCell>
                            <TableCell className="text-sm">{formatDate(backup.createdAt)}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => setRestoreTarget(backup)}
                              >
                                <RotateCcw className="mr-1 h-3 w-3" />
                                Restore
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!restoreTarget}
        onOpenChange={(open) => !open && setRestoreTarget(null)}
        title="Restore Backup"
        description={`Restore from "${restoreTarget?.filename}"? This will overwrite all current data. This action cannot be undone.`}
        confirmLabel="Restore"
        onConfirm={async () => {
          if (!restoreTarget) return
          await restoreBackup.mutateAsync(restoreTarget.filename)
          setRestoreTarget(null)
        }}
        loading={restoreBackup.isPending}
        danger
      />
    </div>
  )
}
