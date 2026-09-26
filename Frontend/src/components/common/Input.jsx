import DatePicker from './DatePicker'
import TimePicker from './TimePicker'

export default function Input({ label, error, className='', id, type, ...props }) {
  if (type === 'date') {
    return <DatePicker label={label} error={error} className={className} id={id} {...props} />
  }
  if (type === 'time') {
    return <TimePicker label={label} error={error} className={className} id={id} {...props} />
  }

  const fieldId = id || props.name
  return <label className={`field ${className}`} htmlFor={fieldId}><span>{label}</span><input id={fieldId} type={type} aria-invalid={!!error} {...props}/>{error&&<small className="field-error">{error}</small>}</label>
}
