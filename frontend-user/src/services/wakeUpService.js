const WAKE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/api$/, '')}/api/wake-up`
  : '/api/wake-up'

let wokenUp = false

export const wakeUpBackend = async () => {
  if (wokenUp) return
  wokenUp = true
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)
    await fetch(WAKE_URL, { signal: controller.signal })
    clearTimeout(timeoutId)
  } catch {
    // Silent fail — wake-up is best-effort
  }
}
