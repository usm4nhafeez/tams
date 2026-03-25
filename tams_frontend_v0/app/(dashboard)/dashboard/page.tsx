'use client'
import { Users, DollarSign, AlertCircle, BookOpen, Wifi, WifiOff, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useBatches } from '@/hooks/useBatches'
import { useStudents } from '@/hooks/useStudents'
import { useFees } from '@/hooks/useFees'
import { useWAStatus } from '@/hooks/useWhatsapp'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const today = new Date()
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  const { data: batches = [], isLoading: batchesLoading } = useBatches()
  const { data: students = [], isLoading: studentsLoading } = useStudents({ status: 'active' })
  const { data: fees = [], isLoading: feesLoading } = useFees({ month: currentMonth })
  const { data: waStatus } = useWAStatus()

  const activeBatches = batches.filter((b) => !b.isArchived)

  const totalCollected = fees.reduce(
    (sum, f) => sum + (f.paidAmount ?? 0),
    0
  )
  const pendingFees = fees.filter(
    (f) => f.status === 'pending' || f.status === 'partial'
  )
  const recentFees = [...fees]
    .sort((a, b) => (a.paidAt && b.paidAt ? b.paidAt.localeCompare(a.paidAt) : 0))
    .filter((f) => f.paidAt)
    .slice(0, 8)

  const isLoading = batchesLoading || studentsLoading || feesLoading

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back — ${formatDate(today)}`}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))
        ) : (
          <>
            <StatCard
              title="Total Active Students"
              value={students.length}
              icon={Users}
              variant="navy"
            />
            <StatCard
              title="Monthly Collection"
              value={formatCurrency(totalCollected)}
              icon={DollarSign}
              variant="green"
              subText={`Month: ${currentMonth}`}
            />
            <StatCard
              title="Pending Dues"
              value={pendingFees.length}
              icon={AlertCircle}
              variant="red"
              subText="Unpaid or partial"
            />
            <StatCard
              title="Active Batches"
              value={activeBatches.length}
              icon={BookOpen}
              variant="blue"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent fee activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Fee Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {feesLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : recentFees.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No fee payments this month
                </p>
              ) : (
                <div className="divide-y">
                  {recentFees.map((fee) => (
                    <div key={fee.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-sm font-medium">
                          {fee.student
                            ? `${fee.student.firstName} ${fee.student.lastName}`
                            : fee.studentId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {fee.paidAt ? formatDate(fee.paidAt) : '—'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(fee.paidAmount)}</p>
                        <StatusBadge status={fee.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* WhatsApp status card */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">WhatsApp Status</CardTitle>
            </CardHeader>
            <CardContent>
              {!waStatus ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Checking...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {waStatus.status === 'connected' ? (
                      <div className="rounded-full bg-green-100 p-2">
                        <Wifi className="h-5 w-5 text-green-600" />
                      </div>
                    ) : (
                      <div className="rounded-full bg-gray-100 p-2">
                        <WifiOff className="h-5 w-5 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium capitalize">{waStatus.status}</p>
                      {waStatus.connectedPhone && (
                        <p className="text-xs text-muted-foreground">{waStatus.connectedPhone}</p>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={waStatus.status} />
                  {waStatus.lastConnected && (
                    <p className="text-xs text-muted-foreground">
                      Last connected: {formatDate(waStatus.lastConnected)}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
