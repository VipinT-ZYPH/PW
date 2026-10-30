export const money = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`

export const clampPercentage = (value: number) => Math.min(100, Math.max(0, value))

export const formatEventDate = (value?: string) => value
  ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  : 'Date to be confirmed'
