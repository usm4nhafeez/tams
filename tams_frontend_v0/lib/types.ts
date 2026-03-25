// API Response wrapper
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// Batch
export interface Batch {
  id: string
  name: string
  grade: string
  academicYear: string
  monthlyFee: number
  isArchived: boolean
  studentCount?: number
  createdAt: string
  updatedAt: string
}

export interface BatchFormData {
  name: string
  grade: string
  academicYear: string
  monthlyFee: number
}

// Group
export interface Group {
  id: string
  batchId: string
  name: string
  studentCount?: number
  batch?: Batch
  createdAt: string
  updatedAt: string
}

export interface GroupFormData {
  batchId: string
  name: string
}

// Student
export interface Student {
  id: string
  enrollmentId: string
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: 'male' | 'female' | 'other'
  photoUrl?: string
  batchId: string
  groupId?: string
  batch?: Batch
  group?: Group
  parentName: string
  parentPhone: string
  parentEmail?: string
  address?: string
  admissionFee: number
  monthlyDiscount: number
  isActive: boolean
  joiningDate: string
  createdAt: string
  updatedAt: string
}

export interface StudentFormData {
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: 'male' | 'female' | 'other'
  photo?: File
  batchId: string
  groupId?: string
  parentName: string
  parentPhone: string
  parentEmail?: string
  address?: string
  admissionFee: number
  monthlyDiscount: number
}

// Attendance
export type AttendanceStatus = 'present' | 'absent' | 'leave'

export interface AttendanceRecord {
  id: string
  studentId: string
  student?: Student
  date: string
  status: AttendanceStatus
  markedAt: string
  markedBy?: string
}

export interface AttendanceMarkPayload {
  studentId: string
  status: AttendanceStatus
}

export interface AttendanceSummary {
  studentId: string
  student?: Student
  totalDays: number
  presentDays: number
  absentDays: number
  leaveDays: number
  percentage: number
}

// Fee
export type FeeStatus = 'pending' | 'partial' | 'paid' | 'overdue'
export type PaymentMode = 'cash' | 'upi' | 'bank_transfer' | 'cheque'

export interface FeeRecord {
  id: string
  studentId: string
  student?: Student
  month: string // YYYY-MM format
  amount: number
  dueDate: string
  status: FeeStatus
  paidAmount: number
  paidAt?: string
  receiptNumber?: string
  receiptUrl?: string
  createdAt: string
  updatedAt: string
}

export interface FeePaymentPayload {
  feeId: string
  amount: number
  paymentMode: PaymentMode
  transactionRef?: string
  notes?: string
}

export interface FeeSummary {
  month: string
  totalDue: number
  totalCollected: number
  pendingCount: number
  paidCount: number
}

// Exam
export type ExamType = 'weekly' | 'monthly' | 'quarterly' | 'annual'

export interface Exam {
  id: string
  batchId: string
  groupId?: string
  batch?: Batch
  name: string
  type: ExamType
  subject: string
  examDate: string
  maxMarks: number
  passingMarks: number
  isLocked: boolean
  createdAt: string
  updatedAt: string
}

export interface ExamFormData {
  batchId: string
  groupId?: string
  name: string
  type: ExamType
  subject: string
  examDate: string
  maxMarks: number
  passingMarks: number
}

export interface ExamResult {
  id: string
  examId: string
  studentId: string
  student?: Student
  marksObtained: number | null
  isAbsent: boolean
  rank?: number
  remarks?: string
  createdAt: string
  updatedAt: string
}

export interface MarksEntryPayload {
  studentId: string
  marksObtained: number | null
  isAbsent: boolean
  remarks?: string
}

// WhatsApp
export type WhatsAppConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'
export type MessageStatus = 'pending' | 'approved' | 'sent' | 'failed' | 'rejected'
export type MessageType = 'absence_alert' | 'fee_reminder' | 'exam_result' | 'broadcast' | 'receipt'

export interface WhatsAppStatus {
  status: WhatsAppConnectionStatus
  qrCode?: string
  connectedPhone?: string
  lastConnected?: string
}

export interface WhatsAppMessage {
  id: string
  studentId?: string
  student?: Student
  phone: string
  messageType: MessageType
  content: string
  attachmentUrl?: string
  status: MessageStatus
  sentAt?: string
  error?: string
  createdAt: string
}

export interface BroadcastPayload {
  batchId?: string
  messageType: MessageType
  content: string
  attachmentUrl?: string
  sendToAll?: boolean
}

// Settings
export interface AcademySettings {
  name: string
  logoUrl?: string
  address?: string
  phone?: string
  email?: string
  defaultMonthlyFee: number
  dataFolderPath: string
}

// Dashboard
export interface DashboardStats {
  totalStudents: number
  activeStudents: number
  todayAttendance: {
    present: number
    absent: number
    leave: number
    total: number
  }
  todayFeeCollection: number
  pendingAlerts: number
  upcomingExams: Exam[]
  recentActivity: ActivityItem[]
}

export interface ActivityItem {
  id: string
  type: 'student' | 'attendance' | 'fee' | 'exam' | 'whatsapp'
  description: string
  timestamp: string
}

// Filters
export interface StudentFilters {
  batchId?: string
  groupId?: string
  status?: 'active' | 'inactive' | 'all'
  gender?: 'male' | 'female' | 'other' | 'all'
  search?: string
}

export interface AttendanceFilters {
  batchId?: string
  groupId?: string
  date?: string
  month?: string
}

export interface FeeFilters {
  studentId?: string
  batchId?: string
  month?: string
  status?: FeeStatus | 'all'
}

export interface ExamFilters {
  batchId?: string
  type?: ExamType | 'all'
  month?: string
}

export interface MessageFilters {
  messageType?: MessageType | 'all'
  status?: MessageStatus | 'all'
  startDate?: string
  endDate?: string
}

// Subject
export interface Subject {
  id: string
  batchId: string
  name: string
  createdAt: string
}

// Backup
export interface Backup {
  filename: string
  size: number
  createdAt: string
  path: string
}

// Settings map (from GET /settings)
export interface SettingsMap {
  [key: string]: string
}
