export default function Button({ variant='primary', size='md', className='', children, type='button', ...props }) {
  return <button type={type} className={`btn btn-${variant} btn-${size} ${className}`} {...props}>{children}</button>
}
