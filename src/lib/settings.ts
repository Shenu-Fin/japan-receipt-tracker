import { AppSettings, DEFAULT_SETTINGS } from './types'

const KEY = 'japan-receipt-settings'

export function getSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
  } catch { return DEFAULT_SETTINGS }
}

export function saveSettings(s: AppSettings) {
  localStorage.setItem(KEY, JSON.stringify(s))
}

export function getRegionFromDate(date: string, schedule: string): string {
  if (!schedule) return '其他'
  const d = new Date(date)
  for (const line of schedule.split('\n')) {
    const m = line.match(/(.+?)\s+(\d{1,2})\/(\d{1,2})-(\d{1,2})\/(\d{1,2})/)
    if (!m) continue
    const [, region, sm, sd, em, ed] = m
    const year = d.getFullYear()
    const start = new Date(year, Number(sm) - 1, Number(sd))
    const end = new Date(year, Number(em) - 1, Number(ed))
    if (d >= start && d <= end) return region.trim()
  }
  return '其他'
}
