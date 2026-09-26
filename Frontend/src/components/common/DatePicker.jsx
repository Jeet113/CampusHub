import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from 'lucide-react'

export default function DatePicker({
  label,
  name,
  value: propValue,
  defaultValue = '',
  onChange,
  error,
  required,
  className = '',
  id,
  placeholder = 'Select event date',
  min,
  max,
  ...props
}) {
  const [internalValue, setInternalValue] = useState(propValue !== undefined ? propValue : defaultValue)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  // Current calendar view (year and month)
  const [viewDate, setViewDate] = useState(() => {
    const init = propValue || defaultValue
    if (init) {
      const d = new Date(init)
      if (!isNaN(d.getTime())) return d
    }
    return new Date()
  })

  const currentValue = propValue !== undefined ? propValue : internalValue

  useEffect(() => {
    if (propValue !== undefined) {
      setInternalValue(propValue)
      const d = new Date(propValue)
      if (!isNaN(d.getTime())) setViewDate(d)
    }
  }, [propValue])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen])

  const formatDisplay = (val) => {
    if (!val) return ''
    try {
      const parts = String(val).split('T')[0].split('-').map(Number)
      if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return val
      const [y, m, d] = parts
      const date = new Date(y, m - 1, d)
      if (isNaN(date.getTime())) return val
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${dayNames[date.getDay()]}, ${monthNames[m - 1]} ${d}, ${y}`
    } catch {
      return val
    }
  }

  const handleSelectDate = (y, m, d) => {
    const formatted = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    setInternalValue(formatted)
    if (onChange) {
      onChange({ target: { name, value: formatted } })
    }
    setIsOpen(false)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    setInternalValue('')
    if (onChange) {
      onChange({ target: { name, value: '' } })
    }
  }

  const handleSetToday = (e) => {
    e.stopPropagation()
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth()
    const d = now.getDate()
    setViewDate(now)
    handleSelectDate(y, m, d)
  }

  const prevMonth = (e) => {
    e.stopPropagation()
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
  }

  const nextMonth = (e) => {
    e.stopPropagation()
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
  }

  const prevYear = (e) => {
    e.stopPropagation()
    setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1))
  }

  const nextYear = (e) => {
    e.stopPropagation()
    setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1))
  }

  const viewYear = viewDate.getFullYear()
  const viewMonth = viewDate.getMonth()
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate()

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const days = []
  // Previous month padding
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i
    const m = viewMonth - 1
    const y = m < 0 ? viewYear - 1 : viewYear
    const normalizedM = (m + 12) % 12
    days.push({
      day: dayNum,
      month: normalizedM,
      year: y,
      isCurrentMonth: false,
      dateStr: `${y}-${String(normalizedM + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
    })
  }
  // Current month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    days.push({
      day: d,
      month: viewMonth,
      year: viewYear,
      isCurrentMonth: true,
      dateStr: `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    })
  }
  // Next month padding
  const remainingCells = 42 - days.length
  for (let d = 1; d <= remainingCells && days.length < 42; d++) {
    const m = viewMonth + 1
    const y = m > 11 ? viewYear + 1 : viewYear
    const normalizedM = m % 12
    days.push({
      day: d,
      month: normalizedM,
      year: y,
      isCurrentMonth: false,
      dateStr: `${y}-${String(normalizedM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    })
  }

  const fieldId = id || name

  return (
    <div className={`field custom-picker-container ${className}`} ref={containerRef}>
      {label && <span>{label}</span>}
      <input type="hidden" name={name} value={currentValue} id={fieldId} readOnly />

      <div
        className={`custom-picker-trigger ${isOpen ? 'is-open' : ''} ${error ? 'has-error' : ''}`}
        tabIndex={0}
        role="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen(!isOpen)
          } else if (e.key === 'Escape') {
            setIsOpen(false)
          }
        }}
      >
        <div className="custom-picker-value">
          {currentValue ? (
            <span className="selected-text">{formatDisplay(currentValue)}</span>
          ) : (
            <span className="placeholder-text">{placeholder}</span>
          )}
        </div>
        <div className="custom-picker-actions">
          {currentValue && !required && (
            <button
              type="button"
              className="custom-picker-clear-btn"
              title="Clear date"
              onClick={handleClear}
            >
              <X size={14} />
            </button>
          )}
          <Calendar size={17} className="custom-picker-icon" />
        </div>
      </div>

      {error && <small className="field-error">{error}</small>}

      {isOpen && (
        <div className="custom-picker-popover custom-calendar-popover" role="dialog">
          <div className="custom-calendar-header">
            <div className="calendar-header-group">
              <button
                type="button"
                className="calendar-nav-btn"
                onClick={prevYear}
                title="Previous year"
              >
                <ChevronsLeft size={15} />
              </button>
              <button
                type="button"
                className="calendar-nav-btn"
                onClick={prevMonth}
                title="Previous month"
              >
                <ChevronLeft size={15} />
              </button>
            </div>

            <div className="calendar-title">
              <span className="calendar-month-name">{monthNames[viewMonth]}</span>
              <span className="calendar-year-name">{viewYear}</span>
            </div>

            <div className="calendar-header-group">
              <button
                type="button"
                className="calendar-nav-btn"
                onClick={nextMonth}
                title="Next month"
              >
                <ChevronRight size={15} />
              </button>
              <button
                type="button"
                className="calendar-nav-btn"
                onClick={nextYear}
                title="Next year"
              >
                <ChevronsRight size={15} />
              </button>
            </div>
          </div>

          <div className="custom-calendar-weekdays">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>

          <div className="custom-calendar-grid">
            {days.map((item, idx) => {
              const isSelected = currentValue === item.dateStr
              const isToday = todayStr === item.dateStr
              return (
                <button
                  type="button"
                  key={idx}
                  className={`calendar-day-btn ${
                    item.isCurrentMonth ? 'in-month' : 'out-month'
                  } ${isSelected ? 'selected' : ''} ${isToday ? 'is-today' : ''}`}
                  onClick={() => handleSelectDate(item.year, item.month, item.day)}
                >
                  <span>{item.day}</span>
                  {isToday && !isSelected && <span className="today-dot" />}
                </button>
              )
            })}
          </div>

          <div className="custom-calendar-footer">
            <button
              type="button"
              className="calendar-quick-btn"
              onClick={handleSetToday}
            >
              Today
            </button>
            {currentValue && !required && (
              <button
                type="button"
                className="calendar-quick-btn text-muted"
                onClick={handleClear}
              >
                Clear
              </button>
            )}
            <button
              type="button"
              className="calendar-quick-btn primary"
              onClick={() => setIsOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
