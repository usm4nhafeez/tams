import { create } from 'zustand'
import { AcademySettings } from '@/lib/types'

interface AppStore {
  selectedBatchId: string | null
  setSelectedBatchId: (id: string | null) => void
  attendanceDate: string
  setAttendanceDate: (date: string) => void
  settings: AcademySettings | null
  setSettings: (settings: AcademySettings | null) => void
}

const today = new Date()
const pad = (n: number) => String(n).padStart(2, '0')
const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`

export const useAppStore = create<AppStore>((set) => ({
  selectedBatchId: null,
  setSelectedBatchId: (id) => set({ selectedBatchId: id }),
  attendanceDate: todayStr,
  setAttendanceDate: (date) => set({ attendanceDate: date }),
  settings: null,
  setSettings: (settings) => set({ settings }),
}))
