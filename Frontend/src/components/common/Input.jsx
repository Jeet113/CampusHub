export default function Input({ label, error, className='', id, ...props }) {
  const fieldId = id || props.name
  return <label className={`field ${className}`} htmlFor={fieldId}><span>{label}</span><input id={fieldId} aria-invalid={!!error} {...props}/>{error&&<small className="field-error">{error}</small>}</label>
}
