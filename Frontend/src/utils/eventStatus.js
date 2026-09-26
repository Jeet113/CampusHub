/**
 * Computes event status automated from the event date and end time.
 * - If event date/time has passed, returns 'Ended'
 * - If event is upcoming/active, returns 'Published'
 * - Preserves 'Pending', 'Draft', or 'Rejected' if event has not yet been approved
 */
export function getEventAutomatedStatus(event) {
  if (!event) return 'Published'

  const rawStatus = (event.status || '').toLowerCase()
  if (rawStatus === 'draft') return 'Draft'
  if (rawStatus === 'pending') return 'Pending'
  if (rawStatus === 'rejected') return 'Rejected'
  if (rawStatus === 'ended') return 'Ended'

  if (!event.date) return 'Published'

  const now = new Date()
  const evDate = new Date(event.date)
  if (isNaN(evDate.getTime())) return 'Published'

  // Default event end to end of the day (23:59:59)
  let eventEnd = new Date(evDate.getFullYear(), evDate.getMonth(), evDate.getDate(), 23, 59, 59, 999)

  const timeStr = event.endTime || event.startTime
  if (timeStr && typeof timeStr === 'string') {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i)
    if (match) {
      let hours = parseInt(match[1], 10)
      const minutes = parseInt(match[2], 10)
      const meridiem = match[3]?.toUpperCase()
      if (meridiem === 'PM' && hours < 12) hours += 12
      if (meridiem === 'AM' && hours === 12) hours = 0
      eventEnd = new Date(evDate.getFullYear(), evDate.getMonth(), evDate.getDate(), hours, minutes)
    }
  }

  return now > eventEnd ? 'Ended' : 'Published'
}

export function isEventEnded(event) {
  return getEventAutomatedStatus(event) === 'Ended'
}
