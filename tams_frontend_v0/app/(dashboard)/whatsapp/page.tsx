'use client'
import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Wifi, WifiOff, Send, MessageCircle, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingTable } from '@/components/shared/LoadingTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { useWAStatus, useWAQR, useWALogs, useWAQueue, useSendBroadcast } from '@/hooks/useWhatsapp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { MessageFilters, MessageType, MessageStatus } from '@/lib/types'
import { formatDate, formatMonth } from '@/lib/utils'

export default function WhatsAppPage() {
  const today = new Date()
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  const { data: waStatus, isLoading: statusLoading } = useWAStatus()
  const isConnected = waStatus?.status === 'connected'
  const { data: qrCode } = useWAQR(!isConnected && !statusLoading)
  const { data: queue = [], isLoading: queueLoading } = useWAQueue()

  const [logFilters, setLogFilters] = useState<MessageFilters>({})
  const { data: logs = [], isLoading: logsLoading } = useWALogs(logFilters)

  const [broadcastMonth, setBroadcastMonth] = useState(currentMonth)
  const [broadcastType, setBroadcastType] = useState('fee_reminder')
  const sendBroadcast = useSendBroadcast()

  async function handleBroadcast() {
    await sendBroadcast.mutateAsync({ monthYear: broadcastMonth, type: broadcastType })
  }

  const sentCount = logs.filter((m) => m.status === 'sent').length
  const failedCount = logs.filter((m) => m.status === 'failed').length
  const pendingCount = queue.filter((m) => m.status === 'pending').length

  return (
    <div className="space-y-6">
      <PageHeader title="WhatsApp" description="Manage WhatsApp connectivity and messaging" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Messages Sent" value={sentCount} icon={MessageCircle} variant="green" />
        <StatCard title="Failed" value={failedCount} icon={MessageCircle} variant="red" />
        <StatCard title="In Queue" value={pendingCount} icon={MessageCircle} variant="yellow" />
      </div>

      <Tabs defaultValue="status">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="status">Status &amp; QR</TabsTrigger>
          <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
          <TabsTrigger value="logs">Message Logs</TabsTrigger>
        </TabsList>

        {/* Status tab */}
        <TabsContent value="status" className="mt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Connection Status</CardTitle>
              </CardHeader>
              <CardContent>
                {statusLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Checking status...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full p-2.5 ${isConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
                        {isConnected ? (
                          <Wifi className="h-5 w-5 text-green-600" />
                        ) : (
                          <WifiOff className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium capitalize">{waStatus?.status ?? 'Unknown'}</p>
                        {waStatus?.connectedPhone && (
                          <p className="text-sm text-muted-foreground">{waStatus.connectedPhone}</p>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={waStatus?.status ?? 'disconnected'} />
                    {waStatus?.lastConnected && (
                      <p className="text-xs text-muted-foreground">
                        Last connected: {formatDate(waStatus.lastConnected)}
                      </p>
                    )}
                    {!isConnected && (
                      <p className="text-sm text-muted-foreground">
                        Scan the QR code with WhatsApp on your phone to connect.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {!isConnected && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Scan to Connect</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-3">
                  {qrCode ? (
                    <QRCodeSVG value={qrCode} size={200} />
                  ) : (
                    <div className="flex h-[200px] w-[200px] items-center justify-center rounded-lg border border-dashed">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  <p className="text-center text-xs text-muted-foreground">
                    QR code refreshes every 10 seconds
                  </p>
                </CardContent>
              </Card>
            )}

            {isConnected && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Today&apos;s Queue</CardTitle>
                </CardHeader>
                <CardContent>
                  {queueLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-8 animate-pulse rounded-md bg-muted" />
                      ))}
                    </div>
                  ) : queue.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">No messages in queue</p>
                  ) : (
                    <div className="divide-y">
                      {queue.slice(0, 5).map((msg) => (
                        <div key={msg.id} className="flex items-center justify-between py-2">
                          <div>
                            <p className="text-sm">{msg.phone}</p>
                            <p className="text-xs capitalize text-muted-foreground">
                              {msg.messageType?.replace(/_/g, ' ') ?? ''}
                            </p>
                          </div>
                          <StatusBadge status={msg.status} />
                        </div>
                      ))}
                      {queue.length > 5 && (
                        <p className="pt-2 text-center text-xs text-muted-foreground">
                          +{queue.length - 5} more
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Broadcast tab */}
        <TabsContent value="broadcast" className="mt-4">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle className="text-base">Send Broadcast</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Month</Label>
                <Input
                  type="month"
                  value={broadcastMonth}
                  onChange={(e) => setBroadcastMonth(e.target.value)}
                  className="w-44"
                />
              </div>
              <div className="space-y-1">
                <Label>Message Type</Label>
                <Select value={broadcastType} onValueChange={setBroadcastType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fee_reminder">Fee Reminder</SelectItem>
                    <SelectItem value="exam_result">Exam Results</SelectItem>
                    <SelectItem value="broadcast">General Broadcast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                This will send messages to all active students&apos; parents for {formatMonth(broadcastMonth)}.
              </div>
              <Button
                onClick={handleBroadcast}
                disabled={sendBroadcast.isPending || !isConnected}
                className="w-full"
              >
                <Send className="mr-2 h-4 w-4" />
                {sendBroadcast.isPending ? 'Sending...' : 'Send Broadcast'}
              </Button>
              {!isConnected && (
                <p className="text-center text-xs text-destructive">
                  WhatsApp must be connected to send messages.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs tab */}
        <TabsContent value="logs" className="mt-4">
          <div className="space-y-4">
            {/* Log filters */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label>Type</Label>
                <Select
                  value={logFilters.messageType ?? 'all'}
                  onValueChange={(v) =>
                    setLogFilters((f) => ({
                      ...f,
                      messageType: v !== 'all' ? (v as MessageType) : undefined,
                    }))
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="absence_alert">Absence Alert</SelectItem>
                    <SelectItem value="fee_reminder">Fee Reminder</SelectItem>
                    <SelectItem value="exam_result">Exam Result</SelectItem>
                    <SelectItem value="broadcast">Broadcast</SelectItem>
                    <SelectItem value="receipt">Receipt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select
                  value={logFilters.status ?? 'all'}
                  onValueChange={(v) =>
                    setLogFilters((f) => ({
                      ...f,
                      status: v !== 'all' ? (v as MessageStatus) : undefined,
                    }))
                  }
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phone</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logsLoading ? (
                    <LoadingTable rows={5} columns={5} />
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12">
                        <EmptyState
                          icon={MessageCircle}
                          title="No messages"
                          description="No message logs match your filters"
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((msg) => (
                      <TableRow key={msg.id}>
                        <TableCell className="text-sm">{msg.phone}</TableCell>
                        <TableCell>
                          <StatusBadge
                            status={msg.messageType}
                            label={msg.messageType?.replace(/_/g, ' ')}
                          />
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="truncate text-sm">{msg.content}</p>
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
