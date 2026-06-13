import { Sidebar } from '@/components/layout/Sidebar'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(10,132,255,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(249,168,37,0.16),_transparent_22%),linear-gradient(180deg,_#f6f9fc_0%,_#eef4f8_42%,_#f8fafc_100%)] text-foreground dark:bg-[linear-gradient(180deg,_#08111c_0%,_#0f1b2d_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.28)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.28)_1px,transparent_1px)] bg-[size:24px_24px] opacity-30 dark:opacity-10" />
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="sticky top-0 z-20 border-b border-white/55 bg-white/72 backdrop-blur-xl dark:border-white/8 dark:bg-slate-950/55">
          <div className="flex items-center justify-between px-4 py-3 lg:px-8">
            <div className="pl-10 lg:pl-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700/85 dark:text-sky-300/80">
                Tips Academy
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                One place for campus operations, fees, exams, and parent updates.
              </p>
            </div>
            <div className="hidden rounded-full border border-sky-200/70 bg-sky-50/80 px-3 py-1 text-xs font-medium text-sky-900 shadow-sm md:block dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-100">
              Academic workspace
            </div>
          </div>
        </div>
        <main className="relative flex-1 overflow-y-auto px-4 py-5 md:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1500px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
