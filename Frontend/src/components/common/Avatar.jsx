import { useState } from 'react'
import { getAssetUrl } from '../../services/api.js'

export default function Avatar({ name = 'CampusHub', size = 'md', color, src, role }) {
  const [imgError, setImgError] = useState(false)
  const initials = (name || 'CH')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const isAdmin = role === 'admin' || (typeof name === 'string' && (name.toLowerCase().includes('administrator') || name.toLowerCase() === 'admin'))
  const effectiveSrc = src || (isAdmin ? '/admin-avatar.png' : null)
  const imageUrl = getAssetUrl(effectiveSrc)

  if (imageUrl && !imgError) {
    return (
      <span className={`avatar avatar-${size}`} style={{ overflow: 'hidden', padding: 0 }}>
        <img
          src={imageUrl}
          alt={name}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit', display: 'block' }}
        />
      </span>
    )
  }

  return (
    <span
      className={`avatar avatar-${size}`}
      style={color ? { color, borderColor: `${color}55`, background: `${color}14` } : undefined}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}
