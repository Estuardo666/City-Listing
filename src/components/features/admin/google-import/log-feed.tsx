'use client'

import { CheckCircle, XCircle, Info, Loader2 } from 'lucide-react'

export interface LogEntry {
  id: string
  level: 'info' | 'success' | 'error' | 'warning'
  message: string
  timestamp: Date
}

interface LogFeedProps {
  logs: LogEntry[]
}

export function LogFeed({ logs }: LogFeedProps) {
  if (logs.length === 0) return null

  return (
    <div className="border rounded-lg bg-muted/30 p-3 max-h-[200px] overflow-y-auto space-y-1">
      {logs.map((log) => (
        <div key={log.id} className="flex items-start gap-2 text-sm">
          <span className="mt-0.5 shrink-0">
            {log.level === 'info' && <Info className="h-3.5 w-3.5 text-blue-500" />}
            {log.level === 'success' && <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
            {log.level === 'error' && <XCircle className="h-3.5 w-3.5 text-red-500" />}
            {log.level === 'warning' && <Info className="h-3.5 w-3.5 text-yellow-500" />}
          </span>
          <span className="text-muted-foreground text-xs whitespace-nowrap">
            {log.timestamp.toLocaleTimeString()}
          </span>
          <span
            className={
              log.level === 'error'
                ? 'text-red-600'
                : log.level === 'success'
                  ? 'text-green-700'
                  : log.level === 'warning'
                    ? 'text-yellow-700'
                    : ''
            }
          >
            {log.level === 'info' && <Loader2 className="inline h-3 w-3 mr-1 animate-spin" />}
            {log.message}
          </span>
        </div>
      ))}
      <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
    </div>
  )
}

let logCounter = 0
export function createLog(
  level: LogEntry['level'],
  message: string
): LogEntry {
  return {
    id: `log-${++logCounter}-${Date.now()}`,
    level,
    message,
    timestamp: new Date(),
  }
}
