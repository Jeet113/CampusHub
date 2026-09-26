import { useState, useRef, useEffect } from 'react'
import { Clock, X } from 'lucide-react'

const QUICK_PRESETS = [
  '09:00 AM',
  '10:00 AM',
  '11:30 AM',
  '01:00 PM',
  '02:30 PM',
  '04:00 PM',
  '05:30 PM',
  '07:00 PM',
]

const HOURS = ['12', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11']
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']
const PERIODS = ['AM', 'PM']

function parseTime(str) {
  if (!str) return { hour: '10', minute: '00', period: 'AM' }
  const match = String(str).match(/(\d+):(\d+)\s*(AM|PM)?/i)
  if (!match) return { hour: '10', minute: '00', period: 'AM' }
  let h = parseInt(match[1], 10)
  const m = parseInt(match[2], 10)
  let period = match[3]?.toUpperCase()
  if (!period) {
    if (h >= 12) {
      period = 'PM'
      if (h > 12) h -= 12
    } else {
      period = 'AM'
      if (h === 0) h = 12
    }
  }
  const roundedMin = Math.round(m / 5) * 5 % 60
  return {
    hour: String(h || 12).padStart(2, '0'),
    minute: String(roundedMin).padStart(2, '0'),
    period: period || 'AM',
  }
}

export default function TimePicker({
  label,
  name,
  value: propValue,
  defaultValue = '',
  onChange,
  error,
  required,
  className = '',
  id,
  placeholder = 'Select event time',
  ...props
}) {
  const [internalValue, setInternalValue] = useState(propValue !== undefined ? propValue : defaultValue)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  const currentValue = propValue !== undefined ? propValue : internalValue
  const parsed = parseTime(currentValue)
  const [selectedHour, setSelectedHour] = useState(parsed.hour)
  const [selectedMinute, setSelectedMinute] = useState(parsed.minute)
  const [selectedPeriod, setSelectedPeriod] = useState(parsed.period)

  useEffect(() => {
    if (propValue !== undefined) {
      setInternalValue(propValue)
      const p = parseTime(propValue)
      setSelectedHour(p.hour)
      setSelectedMinute(p.minute)
      setSelectedPeriod(p.period)
    }
  }, [propValue])

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

  const applyTime = (h, m, p) => {
    const formatted = `${h}:${m} ${p}`
    setInternalValue(formatted)
    if (onChange) {
      onChange({ target: { name, value: formatted } })
    }
  }

  const handleSelectPreset = (preset) => {
    const p = parseTime(preset)
    setSelectedHour(p.hour)
    setSelectedMinute(p.minute)
    setSelectedPeriod(p.period)
    setInternalValue(preset)
    if (onChange) {
      onChange({ target: { name, value: preset } })
    }
  }

  const handleHourClick = (h) => {
    setSelectedHour(h)
    applyTime(h, selectedMinute, selectedPeriod)
  }

  const handleMinuteClick = (m) => {
    setSelectedMinute(m)
    applyTime(selectedHour, m, selectedPeriod)
  }

  const handlePeriodClick = (p) => {
    setSelectedPeriod(p)
    applyTime(selectedHour, selectedMinute, p)
  }

  const handleNowClick = () => {
    const now = new Date()
    let h = now.getHours()
    const p = h >= 12 ? 'PM' : 'AM'
    if (h > 12) h -= 12
    if (h === 0) h = 12
    const m = Math.round(now.getMinutes() / 5) * 5 % 60
    const strH = String(h).padStart(2, '0')
    const strM = String(m).padStart(2, '0')
    setSelectedHour(strH)
    setSelectedMinute(strM)
    setSelectedPeriod(p)
    applyTime(strH, strM, p)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    setInternalValue('')
    if (onChange) {
      onChange({ target: { name, value: '' } })
    }
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
            <span className="selected-text">{currentValue}</span>
          ) : (
            <span className="placeholder-text">{placeholder}</span>
          )}
        </div>
        <div className="custom-picker-actions">
          {currentValue && !required && (
            <button
              type="button"
              className="custom-picker-clear-btn"
              title="Clear time"
              onClick={handleClear}
            >
              <X size={14} />
            </button>
          )}
          <Clock size={17} className="custom-picker-icon" />
        </div>
      </div>

      {error && <small className="field-error">{error}</small>}

      {isOpen && (
        <div className="custom-picker-popover custom-timer-popover" role="dialog">
          {/* Quick Presets */}
          <div className="timer-presets-section">
            <span className="timer-section-label">Quick select</span>
            <div className="timer-presets-grid">
              {QUICK_PRESETS.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={`timer-preset-btn ${currentValue === item ? 'active' : ''}`}
                  onClick={() => handleSelectPreset(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="timer-divider">
            <span>Or custom time</span>
          </div>

          {/* 3 Column Time Selector */}
          <div className="timer-columns-container">
            {/* Hour Column */}
            <div className="timer-col">
              <span className="timer-col-title">Hour</span>
              <div className="timer-scroll-list">
                {HOURS.map((h) => (
                  <button
                    type="button"
                    key={h}
                    className={`timer-cell-btn ${selectedHour === h ? 'selected' : ''}`}
                    onClick={() => handleHourClick(h)}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Minute Column */}
            <div className="timer-col">
              <span className="timer-col-title">Minute</span>
              <div className="timer-scroll-list">
                {MINUTES.map((m) => (
                  <button
                    type="button"
                    key={m}
                    className={`timer-cell-btn ${selectedMinute === m ? 'selected' : ''}`}
                    onClick={() => handleMinuteClick(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Period Column */}
            <div className="timer-col timer-col-period">
              <span className="timer-col-title">AM / PM</span>
              <div className="timer-period-stack">
                {PERIODS.map((p) => (
                  <button
                    type="button"
                    key={p}
                    className={`timer-period-btn ${selectedPeriod === p ? 'selected' : ''}`}
                    onClick={() => handlePeriodClick(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="custom-calendar-footer">
            <button
              type="button"
              className="calendar-quick-btn"
              onClick={handleNowClick}
            >
              Current time
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
