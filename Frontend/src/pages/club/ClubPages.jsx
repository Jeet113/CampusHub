import { useMemo, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Users,
  CalendarDays,
  ClipboardCheck,
  Megaphone,
  ArrowRight,
  Plus,
  Pencil,
  Trash2,
  Eye,
  MapPin,
  Upload,
  Send,
  Search,
  Camera,
  ExternalLink,
  ImageIcon,
  Sparkles,
  ShieldCheck,
  Palette,
  Check,
  Download,
  Mail,
  GraduationCap,
  UserMinus,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import StatCard from '../../components/dashboard/StatCard'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Input from '../../components/common/Input'
import SearchBar from '../../components/common/SearchBar'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import EmptyState from '../../components/common/EmptyState'
import Avatar from '../../components/common/Avatar'
import Modal from '../../components/common/Modal'
import LoadingState from '../../components/common/LoadingState'
import { useToast } from '../../components/common/Toast'
import { useAuth } from '../../hooks/useAuth'
import { useApi } from '../../hooks/useApi'
import { api, getAssetUrl } from '../../services/api'
import { SettingsPage } from '../student/StudentPages'
import { getEventAutomatedStatus } from '../../utils/eventStatus'

function fmt(d){if(!d)return '';const dt=new Date(d);return dt.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
function day(d){if(!d)return '';return new Date(d).getDate()}
function month(d){if(!d)return '';return new Date(d).toLocaleDateString('en-US',{month:'short'})}

const CLUB_CATEGORIES = [
  'Technology',
  'Arts & Culture',
  'Sports',
  'Academic',
  'Career',
  'Cultural',
  'Debate',
  'Social',
  'Photography',
  'Robotics',
  'Leadership',
  'Business',
]

const ACCENT_COLORS = [
  '#F59E0B',
  '#10B981',
  '#38BDF8',
  '#8B5CF6',
  '#EC4899',
  '#F97316',
  '#6366F1',
  '#14B8A6',
]

export function ClubDashboard() {
  const { user, updateUser } = useAuth()
  const { toast } = useToast()
  const clubTarget = user?.club || 'mine'
  const { data: dashData, loading, refetch: refetchDash } = useApi(`/clubs/${clubTarget}/dashboard`)

  const [editModal, setEditModal] = useState(false)
  const [savingClub, setSavingClub] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [selectedAccent, setSelectedAccent] = useState('#F59E0B')
  const [viewingParticipants, setViewingParticipants] = useState(null)

  const bannerInputRef = useRef(null)
  const logoInputRef = useRef(null)

  const c = dashData?.club || {}
  const metrics = dashData?.metrics || {}
  const events = (dashData?.events || []).map((e) => ({
    ...e,
    id: e._id,
    day: day(e.date),
    month: month(e.date),
    date: fmt(e.date),
    registrations: e.registrationCount || 0,
    status: getEventAutomatedStatus(e),
  }))
  const recentMembers = dashData?.recentMembers || []
  const recentNotices = dashData?.recentNotices || []
  const memberCount = metrics.totalMembers ?? c.memberCount ?? 0

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0]
    const targetClubId = c._id || user?.club
    if (!file || !targetClubId) return
    if (file.size > 5 * 1024 * 1024) {
      toast('Banner image must be less than 5MB')
      return
    }
    const formData = new FormData()
    formData.append('image', file)
    formData.append('banner', file)
    setUploadingBanner(true)
    try {
      await api.post(`/clubs/${targetClubId}/banner`, formData)
      toast('Club banner uploaded and saved to Cloudinary!')
      refetchDash()
    } catch (err) {
      toast(err.message || 'Failed to upload banner')
    } finally {
      setUploadingBanner(false)
      e.target.value = ''
    }
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    const targetClubId = c._id || user?.club
    if (!file || !targetClubId) return
    if (file.size > 5 * 1024 * 1024) {
      toast('Logo image must be less than 5MB')
      return
    }
    const formData = new FormData()
    formData.append('image', file)
    formData.append('logo', file)
    setUploadingLogo(true)
    try {
      const res = await api.post(`/clubs/${targetClubId}/logo`, formData)
      toast('Club logo uploaded to Cloudinary successfully!')
      if (updateUser) updateUser({ profileImage: res.data?.logo || res.data })
      refetchDash()
    } catch (err) {
      toast(err.message || 'Failed to upload logo')
    } finally {
      setUploadingLogo(false)
      e.target.value = ''
    }
  }

  const handleSaveClub = async (e) => {
    e.preventDefault()
    const targetClubId = c._id || user?.club
    if (!targetClubId) return
    const form = new FormData(e.currentTarget)
    const payload = {
      name: form.get('name')?.toString().trim(),
      initials: form.get('initials')?.toString().trim().toUpperCase().slice(0, 10),
      category: form.get('category')?.toString().trim(),
      established: form.get('established') ? Number(form.get('established')) : undefined,
      accent: selectedAccent || form.get('accent')?.toString().trim() || '#F59E0B',
      description: form.get('description')?.toString().trim(),
      mission: form.get('mission')?.toString().trim() || undefined,
    }

    setSavingClub(true)
    try {
      await api.put(`/clubs/${targetClubId}`, payload)
      toast('Club details updated successfully!')
      refetchDash()
      setEditModal(false)
    } catch (err) {
      toast(err.message || 'Failed to update club details')
    } finally {
      setSavingClub(false)
    }
  }

  const openEditWithState = () => {
    setSelectedAccent(c.accent || '#F59E0B')
    setEditModal(true)
  }

  if (loading && !dashData) return <LoadingState />

  return (
    <>
      <PageHeader
        eyebrow="Organization workspace"
        title={c.name || user?.name || 'Club Dashboard'}
        description="Manage your club profile, banner, logo, events, and campus community."
        actions={
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button variant="secondary" onClick={openEditWithState}>
              <Pencil size={16} /> Edit club details
            </Button>
            <Link to="/club/events/create">
              <Button>
                <Plus size={17} /> Create event
              </Button>
            </Link>
          </div>
        }
      />

      {/* Hidden file inputs for direct one-click upload */}
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        onChange={handleBannerUpload}
        style={{ display: 'none' }}
      />
      <input
        ref={logoInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        onChange={handleLogoUpload}
        style={{ display: 'none' }}
      />

      {/* Hero Banner Card with Banner, Logo, and Club Details */}
      <div className="club-dash-card">
        <div
          className="club-dash-cover"
          style={{
            '--club-color': c.accent || '#F59E0B',
            ...(getAssetUrl(c.banner)
              ? { backgroundImage: `url(${getAssetUrl(c.banner)})` }
              : { background: `radial-gradient(circle at 80% 20%, color-mix(in srgb, ${c.accent || '#F59E0B'} 25%, transparent), transparent 45%), linear-gradient(135deg, #181824, #0f0f15)` }),
          }}
        >
          <div className="club-dash-cover-overlay" />
          <button
            type="button"
            className="club-dash-cover-btn"
            onClick={() => bannerInputRef.current?.click()}
            disabled={uploadingBanner}
            title="Upload banner image"
          >
            <Camera size={15} />
            <span>{uploadingBanner ? 'Uploading…' : getAssetUrl(c.banner) ? 'Change banner' : 'Add banner image'}</span>
          </button>
        </div>

        <div className="club-dash-body">
          <div className="club-dash-logo-wrap">
            <Avatar name={c.initials || 'CL'} size="xl" color={c.accent || '#F59E0B'} src={c.logo} />
            <button
              type="button"
              className="club-dash-logo-btn"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              title="Upload club logo"
              aria-label="Upload club logo"
            >
              {uploadingLogo ? (
                <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <Camera size={15} />
              )}
            </button>
          </div>

          <div className="club-dash-info">
            <div className="club-dash-title-row">
              <h1>{c.name || 'Organization Name'}</h1>
              <Badge tone="amber">{c.category || 'Organization'}</Badge>
              <Badge tone="green">
                <ShieldCheck size={12} style={{ marginRight: 4 }} />
                Verified Organization
              </Badge>
              {c.initials && <Badge tone="neutral">[{c.initials}]</Badge>}
            </div>
            <p className="club-dash-desc">{c.description || 'Add your organization description to let students discover your mission.'}</p>
            <div className="club-dash-meta">
              <span>
                <Users size={14} /> {memberCount} active members
              </span>
              {c.established && (
                <span>
                  <CalendarDays size={14} /> Established {c.established}
                </span>
              )}
              {c.mission && (
                <span title={c.mission}>
                  <Sparkles size={14} /> Mission defined
                </span>
              )}
            </div>
          </div>

          <div className="club-dash-actions">
            <Button variant="secondary" onClick={openEditWithState}>
              <Pencil size={15} /> Edit details
            </Button>
            <Link to={`/clubs/${c.slug || c._id || user?.club}`}>
              <Button variant="ghost" title="View how your club appears to students">
                <Eye size={15} /> Public view <ExternalLink size={13} style={{ marginLeft: 3 }} />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Edit Club Modal */}
      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title="Edit Organization Details"
      >
        <form onSubmit={handleSaveClub} className="form-grid" style={{ marginTop: 15, gap: '14px 13px' }}>
          <Input label="Organization name" name="name" defaultValue={c.name || ''} required className="span-2" />
          <Input label="Acronym / Initials (Max 10 chars)" name="initials" defaultValue={c.initials || ''} required maxLength={10} placeholder="e.g. ACM, IEEE, CS" />
          
          <label className="field">
            <span>Category</span>
            <select name="category" defaultValue={c.category || 'Technology'}>
              {CLUB_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </label>

          <Input label="Established year" name="established" type="number" min="1800" max={new Date().getFullYear()} defaultValue={c.established || ''} placeholder="e.g. 2018" />

          {/* Accent Color Picker */}
          <div className="span-2">
            <span style={{ fontSize: 12, fontWeight: 500, color: '#aaaab3', display: 'block', marginBottom: 6 }}>
              Brand accent color
            </span>
            <div className="color-swatches">
              {ACCENT_COLORS.map((col) => (
                <button
                  type="button"
                  key={col}
                  className={`color-swatch ${selectedAccent === col ? 'active' : ''}`}
                  style={{ background: col }}
                  onClick={() => setSelectedAccent(col)}
                  title={col}
                />
              ))}
              <input
                type="color"
                value={selectedAccent}
                onChange={(e) => setSelectedAccent(e.target.value)}
                style={{ width: 30, height: 30, border: 'none', background: 'transparent', cursor: 'pointer' }}
                title="Custom color"
              />
              <span style={{ fontSize: 12, color: '#8d8d97', marginLeft: 8 }}>{selectedAccent}</span>
            </div>
            <input type="hidden" name="accent" value={selectedAccent} />
          </div>

          <label className="field span-2">
            <span>Description</span>
            <textarea name="description" rows={3} defaultValue={c.description || ''} required placeholder="Tell students about your club activities, workshops, and benefits..." />
          </label>

          <label className="field span-2">
            <span>Mission & Vision (Optional)</span>
            <textarea name="mission" rows={2} defaultValue={c.mission || ''} placeholder="What is your organization's core objective?" />
          </label>

          {/* Quick upload sections inside the modal */}
          <div className="span-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#aaaab3', display: 'block', marginBottom: 6 }}>
                Club Logo
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={c.initials || 'CL'} size="lg" color={selectedAccent} src={c.logo} />
                <Button variant="secondary" type="button" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                  <Upload size={14} /> {uploadingLogo ? 'Uploading…' : c.logo?.url ? 'Change logo' : 'Upload logo'}
                </Button>
              </div>
            </div>

            <div>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#aaaab3', display: 'block', marginBottom: 6 }}>
                Club Banner Image
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 60, height: 38, borderRadius: 6, background: getAssetUrl(c.banner) ? `url(${getAssetUrl(c.banner)}) center/cover` : `${selectedAccent}22`, border: '1px solid var(--border)' }} />
                <Button variant="secondary" type="button" onClick={() => bannerInputRef.current?.click()} disabled={uploadingBanner}>
                  <Upload size={14} /> {uploadingBanner ? 'Uploading…' : getAssetUrl(c.banner) ? 'Change banner' : 'Upload banner'}
                </Button>
              </div>
            </div>
          </div>

          <div className="span-2" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 15, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <Button variant="ghost" type="button" onClick={() => setEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={savingClub}>
              {savingClub ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard icon={Users} label="Total members" value={String(memberCount)} detail="Active members" />
        <StatCard
          icon={CalendarDays}
          label="Upcoming events"
          value={String(metrics.upcomingEvents ?? events.filter((e) => e.status === 'Published').length).padStart(2, '0')}
          detail={`${metrics.totalEvents ?? events.length} total listings`}
        />
        <StatCard
          icon={ClipboardCheck}
          label="Registrations"
          value={String(metrics.totalRegistrations ?? events.reduce((s, e) => s + e.registrations, 0))}
          detail="Across all events"
        />
        <StatCard
          icon={Megaphone}
          label="Announcements"
          value={String(metrics.totalNotices ?? recentNotices.length)}
          detail="Campus notices"
        />
      </div>

      <div className="dashboard-columns org-dashboard">
        <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Active Events & Attendee Roster */}
          <div>
            <div className="section-head">
              <h2>Active Events & Registration Roster</h2>
              <Link to="/club/events">
                Manage all <ArrowRight size={14} />
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {events.length === 0 ? (
                <div className="empty-state" style={{ padding: '30px 20px' }}>
                  <CalendarDays size={28} />
                  <h3>No events created yet</h3>
                  <p>Create your first event to start accepting student registrations.</p>
                  <Link to="/club/events/create">
                    <Button><Plus size={16} /> Create event</Button>
                  </Link>
                </div>
              ) : (
                events.map((ev) => {
                  const cap = ev.capacity || 200
                  const percent = Math.min(Math.round((ev.registrations / cap) * 100), 100)
                  return (
                    <div
                      key={ev.id}
                      style={{
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        background: 'rgba(26,26,36,0.65)',
                        padding: '16px 18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <div className="date-block" style={{ width: 42, height: 46 }}>
                            <strong style={{ fontSize: 16 }}>{ev.day}</strong>
                            <span style={{ fontSize: 8 }}>{ev.month}</span>
                          </div>
                          <div>
                            <strong style={{ fontSize: 15, color: '#fff', display: 'block' }}>{ev.title}</strong>
                            <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#888894', marginTop: 2 }}>
                              <span>{ev.category}</span>
                              <span>&bull;</span>
                              <span>{ev.date}</span>
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="secondary"
                          style={{ minHeight: 32, padding: '0 12px', fontSize: 12 }}
                          onClick={() => setViewingParticipants(ev)}
                        >
                          <Users size={14} /> View attendees ({ev.registrations})
                        </Button>
                      </div>

                      {/* Capacity Progress bar */}
                      <div style={{ marginTop: 2 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888894', marginBottom: 5 }}>
                          <span>Registration capacity</span>
                          <strong style={{ color: percent > 80 ? 'var(--accent)' : '#fff' }}>
                            {ev.registrations} / {ev.capacity || 'Unlimited'} ({percent}%)
                          </strong>
                        </div>
                        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${percent}%`,
                              background: percent > 80 ? 'linear-gradient(90deg, #F59E0B, #FB7185)' : 'var(--accent)',
                              borderRadius: 99,
                              transition: 'width 0.4s ease',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Member Community Preview */}
          <div>
            <div className="section-head">
              <h2>Recent Members</h2>
              <Link to="/club/members">
                View all members <ArrowRight size={14} />
              </Link>
            </div>

            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: 12,
                background: 'rgba(26,26,36,0.65)',
                padding: '16px 18px',
              }}
            >
              {recentMembers.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {recentMembers.slice(0, 4).map((m) => (
                    <div
                      key={m._id || m.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={m.user?.name || 'Member'} src={m.user?.profileImage} size="md" />
                        <div>
                          <strong style={{ fontSize: 13, color: '#fff', display: 'block' }}>
                            {m.user?.name || 'Student Member'}
                          </strong>
                          <small style={{ color: '#888894', fontSize: 11 }}>
                            {m.user?.department || 'Department'} &bull; {m.role || 'Member'} {m.user?.studentId ? `(${m.user.studentId})` : ''}
                          </small>
                        </div>
                      </div>
                      <Badge tone={m.status === 'approved' || m.status === 'active' ? 'green' : 'amber'}>
                        {m.status === 'approved' || m.status === 'active' ? 'Active' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 10px', color: '#888894' }}>
                  <Users size={24} style={{ margin: '0 auto 8px', color: 'var(--accent)' }} />
                  <p style={{ margin: 0, fontSize: 13 }}>No student members yet. Students can join from your public club page.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Quick Actions */}
          <div>
            <div className="section-head">
              <h2>Quick Actions</h2>
            </div>
            <div className="action-stack">
              {[
                [Plus, 'Create a new event', '/club/events/create'],
                [Megaphone, 'Post an announcement', '/club/announcements'],
                [Users, 'Manage club members', '/club/members'],
                [Pencil, 'Edit club profile & brand', '/club/profile'],
              ].map(([Icon, label, to]) => (
                <Link key={label} to={to}>
                  <span>
                    <Icon />
                    <b>{label}</b>
                  </span>
                  <ArrowRight />
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Announcements & Bulletins */}
          <div>
            <div className="section-head">
              <h2>Recent Announcements</h2>
              <Link to="/club/announcements">
                All notices <ArrowRight size={14} />
              </Link>
            </div>

            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: 12,
                background: 'rgba(26,26,36,0.65)',
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#aaaab3' }}>Broadcast updates to campus</span>
                <Link to="/club/announcements">
                  <Button variant="secondary" style={{ minHeight: 30, padding: '0 10px', fontSize: 11 }}>
                    <Plus size={13} /> New notice
                  </Button>
                </Link>
              </div>

              {recentNotices.length > 0 ? (
                recentNotices.map((n) => (
                  <div
                    key={n._id || n.id}
                    style={{
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 8,
                      padding: 12,
                      background: '#12121a',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Badge tone={n.important ? 'amber' : 'neutral'}>
                        {n.category || 'Announcement'}
                      </Badge>
                      <small style={{ color: '#686874', fontSize: 10 }}>{fmt(n.publishedAt || n.createdAt)}</small>
                    </div>
                    <strong style={{ fontSize: 13, color: '#eee', display: 'block', marginTop: 6 }}>
                      {n.title}
                    </strong>
                    <p style={{ fontSize: 11, color: '#888894', margin: '4px 0 0', lineHeight: 1.5 }}>
                      {n.description}
                    </p>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 10px', color: '#888894' }}>
                  <Megaphone size={22} style={{ margin: '0 auto 8px', color: 'var(--accent)' }} />
                  <p style={{ margin: 0, fontSize: 13 }}>No announcements posted yet.</p>
                  <Link to="/club/announcements" style={{ marginTop: 8, display: 'inline-block' }}>
                    <Button variant="secondary" style={{ minHeight: 30, fontSize: 11 }}>Post first notice</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* View Registered Participants Modal from Dashboard */}
      {viewingParticipants && (
        <EventParticipantsModal
          event={viewingParticipants}
          onClose={() => setViewingParticipants(null)}
        />
      )}
    </>
  )
}

export function ClubProfile() {
  const { toast } = useToast()
  const { user, updateUser } = useAuth()
  const { data: club, loading, refetch } = useApi(user?.club ? `/clubs/${user.club}` : null)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [accent, setAccent] = useState('#F59E0B')

  const logoInputRef = useRef(null)
  const bannerInputRef = useRef(null)

  const c = club || {}

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user?.club) return
    const formData = new FormData()
    formData.append('image', file)
    formData.append('logo', file)
    setUploadingLogo(true)
    try {
      const res = await api.post(`/clubs/${user.club}/logo`, formData)
      toast('Club logo updated successfully!')
      if (updateUser) updateUser({ profileImage: res.data?.logo || res.data })
      refetch()
    } catch (err) {
      toast(err.message || 'Failed to upload logo')
    } finally {
      setUploadingLogo(false)
      e.target.value = ''
    }
  }

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user?.club) return
    const formData = new FormData()
    formData.append('image', file)
    formData.append('banner', file)
    setUploadingBanner(true)
    try {
      await api.post(`/clubs/${user.club}/banner`, formData)
      toast('Club banner updated on Cloudinary!')
      refetch()
    } catch (err) {
      toast(err.message || 'Failed to upload banner')
    } finally {
      setUploadingBanner(false)
      e.target.value = ''
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    if (!user?.club) return
    const form = new FormData(e.currentTarget)
    const payload = {
      name: form.get('name')?.toString().trim(),
      initials: form.get('initials')?.toString().trim().toUpperCase().slice(0, 10),
      category: form.get('category')?.toString().trim(),
      established: form.get('established') ? Number(form.get('established')) : undefined,
      accent: accent || form.get('accent')?.toString().trim() || '#F59E0B',
      description: form.get('description')?.toString().trim(),
      mission: form.get('mission')?.toString().trim() || undefined,
    }

    setSaving(true)
    try {
      await api.put(`/clubs/${user.club}`, payload)
      toast('Club profile saved successfully!')
      refetch()
    } catch (err) {
      toast(err.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState />

  return (
    <>
      <PageHeader
        eyebrow="Organization"
        title="Club profile & brand"
        description="Keep your public identity, logo, banner, and community details current."
        actions={
          <Link to={`/student/clubs/${c.slug || c._id || user?.club}`}>
            <Button variant="secondary">
              <Eye size={17} /> View public page
            </Button>
          </Link>
        }
      />

      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        onChange={handleLogoUpload}
        style={{ display: 'none' }}
      />
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/*"
        onChange={handleBannerUpload}
        style={{ display: 'none' }}
      />

      <div className="edit-profile-grid">
        <form className="settings-card" onSubmit={handleProfileSubmit}>
          <div style={{ marginBottom: 25, borderBottom: '1px solid var(--border)', paddingBottom: 20 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#eee', display: 'block', marginBottom: 12 }}>
              Visual Identity & Cloudinary Assets
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Logo control */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 14, background: 'rgba(255,255,255,0.02)' }}>
                <span style={{ fontSize: 11, color: '#888894', display: 'block', marginBottom: 8 }}>Club Logo</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Avatar name={c.initials || 'CL'} size="xl" color={c.accent || '#F59E0B'} src={c.logo} />
                  <Button variant="secondary" type="button" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                    <Upload size={15} /> {uploadingLogo ? 'Uploading…' : c.logo?.url ? 'Change logo' : 'Upload logo'}
                  </Button>
                </div>
              </div>

              {/* Banner control */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 14, background: 'rgba(255,255,255,0.02)' }}>
                <span style={{ fontSize: 11, color: '#888894', display: 'block', marginBottom: 8 }}>Club Banner</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 80,
                      height: 48,
                      borderRadius: 8,
                      background: getAssetUrl(c.banner) ? `url(${getAssetUrl(c.banner)}) center/cover` : `${c.accent || '#F59E0B'}22`,
                      border: '1px solid var(--border)',
                    }}
                  />
                  <Button variant="secondary" type="button" onClick={() => bannerInputRef.current?.click()} disabled={uploadingBanner}>
                    <Upload size={15} /> {uploadingBanner ? 'Uploading…' : getAssetUrl(c.banner) ? 'Change banner' : 'Upload banner'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Input label="Organization name" name="name" defaultValue={c.name || ''} required />
          <Input label="Acronym / Initials (Max 10 chars)" name="initials" defaultValue={c.initials || ''} required maxLength={10} />
          
          <label className="field">
            <span>Description</span>
            <textarea rows={4} name="description" defaultValue={c.description || ''} required />
          </label>

          <label className="field">
            <span>Mission & Vision</span>
            <textarea rows={2} name="mission" defaultValue={c.mission || ''} />
          </label>

          <div className="form-grid">
            <label className="field">
              <span>Category</span>
              <select name="category" defaultValue={c.category || 'Technology'}>
                {CLUB_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </label>
            <Input label="Established" name="established" type="number" defaultValue={c.established || ''} />
          </div>

          <div style={{ marginTop: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#aaaab3', display: 'block', marginBottom: 6 }}>
              Brand accent color
            </span>
            <div className="color-swatches">
              {ACCENT_COLORS.map((col) => (
                <button
                  type="button"
                  key={col}
                  className={`color-swatch ${(accent || c.accent) === col ? 'active' : ''}`}
                  style={{ background: col }}
                  onClick={() => setAccent(col)}
                  title={col}
                />
              ))}
              <input
                type="color"
                value={accent || c.accent || '#F59E0B'}
                onChange={(e) => setAccent(e.target.value)}
                style={{ width: 30, height: 30, border: 'none', background: 'transparent', cursor: 'pointer' }}
                title="Custom color"
              />
            </div>
            <input type="hidden" name="accent" value={accent || c.accent || '#F59E0B'} />
          </div>

          <Button type="submit" disabled={saving}>
            <Pencil size={17} /> {saving ? 'Saving changes…' : 'Save profile changes'}
          </Button>
        </form>

        <aside className="profile-aside">
          <h3>Profile quality</h3>
          <div className="quality-ring">
            <strong>{c.banner?.url && c.logo?.url ? '100%' : c.logo?.url || c.banner?.url ? '80%' : '60%'}</strong>
            <span>Complete</span>
          </div>
          <p>
            {c.banner?.url && c.logo?.url
              ? 'Your profile is fully decorated with Cloudinary assets!'
              : 'Add a custom banner and logo to make your club stand out across campus.'}
          </p>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <Link to={`/clubs/${c.slug || c._id || user?.club}`}>
              <Button variant="secondary" className="full">
                <Eye size={16} /> Preview live profile
              </Button>
            </Link>
          </div>
        </aside>
      </div>
    </>
  )
}

function EventParticipantsModal({ event, onClose }) {
  const { data: regData, loading } = useApi(event ? `/events/${event._id || event.id}/registrations` : null)
  const [search, setSearch] = useState('')
  const items = regData?.items || []

  const filtered = useMemo(() => {
    return items.filter((reg) => {
      const s = reg.student || {}
      const text = `${s.name || ''} ${s.studentId || ''} ${s.department || ''} ${s.batch || ''} ${s.email || ''}`.toLowerCase()
      return text.includes(search.toLowerCase())
    })
  }, [items, search])

  const exportCsv = () => {
    if (!items.length) return
    const headers = ['Name', 'Student ID', 'Email', 'Department', 'Batch', 'Phone', 'Registered At']
    const rows = items.map((r) => [
      `"${r.student?.name || ''}"`,
      `"${r.student?.studentId || ''}"`,
      `"${r.student?.email || ''}"`,
      `"${r.student?.department || ''}"`,
      `"${r.student?.batch || ''}"`,
      `"${r.student?.phone || ''}"`,
      `"${new Date(r.registeredAt || r.createdAt).toLocaleString()}"`,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `${(event.title || 'event').replace(/\s+/g, '_')}_participants.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Modal
      open={!!event}
      onClose={onClose}
      title={`Registered Participants (${items.length})`}
      actions={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <Button variant="secondary" onClick={exportCsv} disabled={!items.length}>
            <Download size={15} /> Export CSV
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <strong style={{ fontSize: 16, color: '#fff', display: 'block' }}>{event?.title}</strong>
            <small style={{ color: '#888894' }}>
              {event?.date} &bull; {items.length} registered {event?.capacity ? `(Capacity: ${event.capacity})` : ''}
            </small>
          </div>
          <Badge tone={items.length > 0 ? 'green' : 'neutral'}>
            {items.length} {items.length === 1 ? 'Attendee' : 'Attendees'}
          </Badge>
        </div>

        {items.length > 0 && (
          <div style={{ marginTop: 10, marginBottom: 14 }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search by student name, ID, department…" />
          </div>
        )}
      </div>

      {loading ? (
        <LoadingState />
      ) : !items.length ? (
        <div className="empty-state" style={{ padding: '40px 20px' }}>
          <Users size={32} />
          <h3>No registrations yet</h3>
          <p>When students register for this event, their details will appear here in real time.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
          {filtered.map((reg) => {
            const student = reg.student || {}
            return (
              <div
                key={reg._id || reg.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  background: 'rgba(255,255,255,0.02)',
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <Avatar name={student.name} src={student.profileImage} size="md" />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong style={{ fontSize: 14, color: '#fff' }}>{student.name || 'Student'}</strong>
                    {student.studentId && (
                      <code style={{ fontSize: 11, background: 'rgba(245,158,11,0.1)', color: 'var(--accent)', padding: '2px 6px', borderRadius: 4 }}>
                        {student.studentId}
                      </code>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#888894', marginTop: 3 }}>
                    <span>{student.department || 'Department not specified'}</span>
                    {student.batch && <span> &bull; Batch {student.batch}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: '#686874', marginTop: 2 }}>{student.email}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Badge tone="green">Registered</Badge>
                  <small style={{ display: 'block', fontSize: 10, color: '#686874', marginTop: 4 }}>
                    {new Date(reg.registeredAt || reg.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </small>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && search && (
            <p style={{ textAlign: 'center', color: '#888894', padding: 20 }}>No participants matching "{search}".</p>
          )}
        </div>
      )}
    </Modal>
  )
}

export function ClubEvents() {
  const { data: raw, loading, refetch } = useApi('/events', { params: { mine: 'true' } })
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [remove, setRemove] = useState(null)
  const [viewingParticipants, setViewingParticipants] = useState(null)
  const { toast } = useToast()

  const items = (raw || []).map((e) => ({
    ...e,
    id: e._id,
    day: day(e.date),
    month: month(e.date),
    date: fmt(e.date),
    registrations: e.registrationCount || 0,
    status: getEventAutomatedStatus(e),
  }))

  const list = items.filter((e) => {
    const matchQ = (e.title || '').toLowerCase().includes(q.toLowerCase())
    if (!matchQ) return false
    if (statusFilter === 'Published') return e.status === 'Published'
    if (statusFilter === 'Ended') return e.status === 'Ended'
    return true
  })

  const del = async () => {
    try {
      await api.delete(`/events/${remove._id}`)
      toast('Event deleted')
      refetch()
    } catch (err) {
      toast(err.message || 'Delete failed')
    } finally {
      setRemove(null)
    }
  }

  if (loading) return <LoadingState />

  return (
    <>
      <PageHeader
        eyebrow="Event management"
        title="Your events"
        description={`${items.length} events across published and ended listings.`}
        actions={
          <Link to="/club/events/create">
            <Button>
              <Plus size={17} /> Create event
            </Button>
          </Link>
        }
      />

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <SearchBar value={q} onChange={setQ} placeholder="Search your events…" />
        </div>
        <div className="approval-tabs" style={{ margin: 0, border: 'none', gap: 6 }}>
          {['All', 'Published', 'Ended'].map((filter) => (
            <button
              key={filter}
              className={statusFilter === filter ? 'active' : ''}
              onClick={() => setStatusFilter(filter)}
              style={{
                height: 38,
                padding: '0 16px',
                borderRadius: 8,
                background: statusFilter === filter ? 'var(--card)' : 'transparent',
                border: statusFilter === filter ? '1px solid var(--border)' : '1px solid transparent',
                color: statusFilter === filter ? '#fff' : '#888894',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {list.length ? (
        <div className="responsive-table">
          <div className="table-head">
            <span>Event</span>
            <span>Date</span>
            <span>Registrations</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {list.map((e) => (
            <article key={e.id}>
              <div className="table-title">
                <span className="event-mini-date">{e.day}</span>
                <span>
                  <strong>{e.title}</strong>
                  <small>{e.category}</small>
                </span>
              </div>
              <span data-label="Date">{e.date}</span>
              <span
                data-label="Registrations"
                style={{ cursor: 'pointer' }}
                onClick={() => setViewingParticipants(e)}
                title="Click to view registered participants"
              >
                <Badge tone="amber">
                  <Users size={12} style={{ marginRight: 4 }} />
                  {e.registrations} / {e.capacity || 'Unlimited'}
                </Badge>
              </span>
              <span data-label="Status">
                <Badge tone={e.status === 'Published' ? 'green' : 'amber'}>
                  {e.status}
                </Badge>
              </span>
              <div className="table-actions">
                <button
                  type="button"
                  aria-label="View registered participants"
                  title="View registered participants"
                  onClick={() => setViewingParticipants(e)}
                >
                  <Users size={16} />
                </button>
                <Link to={`/events/${e.slug || e._id}`}>
                  <button type="button" aria-label="View public event page" title="Public event page">
                    <Eye size={16} />
                  </button>
                </Link>
                <button
                  type="button"
                  aria-label="Delete event"
                  title="Delete event"
                  onClick={() => setRemove(e)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No events found" onReset={() => { setQ(''); setStatusFilter('All'); }} />
      )}

      {/* View Registered Participants Modal */}
      {viewingParticipants && (
        <EventParticipantsModal
          event={viewingParticipants}
          onClose={() => setViewingParticipants(null)}
        />
      )}

      {/* Delete Event Dialog */}
      <ConfirmDialog
        open={!!remove}
        onClose={() => setRemove(null)}
        onConfirm={del}
        title="Delete this event?"
        message={remove ? `"${remove.title}" will be removed from CampusHub.` : ''}
        confirmLabel="Delete event"
        danger
      />
    </>
  )
}

export function CreateEvent() {
  const nav = useNavigate()
  const { toast } = useToast()
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [bannerFile, setBannerFile] = useState(null)
  const [bannerPreview, setBannerPreview] = useState(null)
  const [formError, setFormError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const bannerInputRef = useRef(null)

  const EVENT_CATEGORIES = [
    'Workshop',
    'Competition',
    'Seminar',
    'Cultural',
    'Sports',
    'Career',
    'Technology',
    'Other',
  ]

  const handleBannerSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast('Banner image must be less than 5MB')
      return
    }
    setBannerFile(file)
    setBannerPreview(URL.createObjectURL(file))
  }

  const handleRemoveBanner = (e) => {
    e.stopPropagation()
    setBannerFile(null)
    setBannerPreview(null)
    if (bannerInputRef.current) bannerInputRef.current.value = ''
  }

  const submit = async (e, draft = false) => {
    e.preventDefault()
    setFormError('')
    const form = new FormData(e.currentTarget)
    const next = {}
    ;['title', 'description', 'date', 'start', 'location'].forEach((k) => {
      if (!form.get(k)?.toString().trim()) next[k] = 'Required'
    })
    if (!selectedCategory) {
      next.category = 'Required'
    } else if (selectedCategory === 'Other' && !customCategory.trim()) {
      next.customCategory = 'Please specify custom category'
    }

    if (Object.keys(next).length) {
      setErrors(next)
      return
    }

    const title = form.get('title')?.toString().trim()
    const description = form.get('description')?.toString().trim()
    const category = selectedCategory === 'Other' ? (customCategory.trim() || 'Other') : selectedCategory
    const date = form.get('date')?.toString().trim()
    const startTime = form.get('start')?.toString().trim()
    const endTime = form.get('end')?.toString().trim() || startTime
    const location = form.get('location')?.toString().trim()
    const capRaw = form.get('capacity')?.toString().trim()
    const capacity = capRaw && !isNaN(Number(capRaw)) && Number(capRaw) > 0 ? Number(capRaw) : undefined

    setLoading(true)
    try {
      const res = await api.post('/events', {
        title,
        description,
        category,
        date,
        startTime,
        endTime,
        location,
        ...(capacity ? { capacity } : {}),
        status: draft ? 'draft' : 'pending',
      })

      const createdEvent = res.data

      // Upload banner to Cloudinary if user selected a file
      if (bannerFile && createdEvent?._id) {
        try {
          const bannerData = new FormData()
          bannerData.append('image', bannerFile)
          bannerData.append('banner', bannerFile)
          await api.post(`/events/${createdEvent._id}/banner`, bannerData)
        } catch (bannerErr) {
          console.error('Banner upload failed:', bannerErr)
          toast('Event created, but banner upload encountered an issue')
        }
      }

      toast(draft ? 'Event saved as draft' : 'Event submitted for approval!')
      nav('/club/events')
    } catch (err) {
      const errMsg =
        err.errors?.length > 0
          ? err.errors.map((item) => `${item.field.replace('body.', '')}: ${item.message}`).join(' · ')
          : err.message || 'Failed to create event'
      setFormError(errMsg)
      toast(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="New listing"
        title="Create an event"
        description="Share a clear, inviting opportunity with the campus community."
      />

      <form className="event-form" onSubmit={submit}>
        {formError && (
          <div className="form-error" role="alert" style={{ marginBottom: 15 }}>
            {formError}
          </div>
        )}

        <section>
          <h2>Event details</h2>
          <Input label="Event title" name="title" error={errors.title} placeholder="e.g. AI & Machine Learning Workshop" required />
          <label className="field">
            <span>Description</span>
            <textarea
              name="description"
              rows={5}
              aria-invalid={!!errors.description}
              placeholder="Describe what participants will learn, build, or experience..."
              required
            />
            {errors.description && <small className="field-error">Required</small>}
          </label>

          <div className="form-grid">
            <label className="field">
              <span>Category</span>
              <select
                name="categorySelect"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  setErrors((prev) => ({ ...prev, category: undefined }))
                }}
                required
              >
                <option value="" disabled>Select category</option>
                {EVENT_CATEGORIES.map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
              {errors.category && <small className="field-error">{errors.category}</small>}
            </label>

            {selectedCategory === 'Other' ? (
              <Input
                label="Specify custom category"
                name="customCategory"
                value={customCategory}
                onChange={(e) => {
                  setCustomCategory(e.target.value)
                  setErrors((prev) => ({ ...prev, customCategory: undefined }))
                }}
                placeholder="e.g. Hackathon, Gaming, Networking, Exhibition..."
                error={errors.customCategory}
                required
              />
            ) : null}

            <Input
              label="Location"
              name="location"
              error={errors.location}
              placeholder="e.g. Academic Building, Room 501"
              required
              className={selectedCategory === 'Other' ? 'span-2' : ''}
            />
          </div>
        </section>

        <section>
          <h2>Schedule & registration</h2>
          <div className="form-grid">
            <Input label="Event date" name="date" type="date" error={errors.date} required />
            <Input label="Registration deadline (Optional)" name="deadline" type="date" />
            <Input label="Start time" name="start" type="time" error={errors.start} required />
            <Input label="End time (Optional)" name="end" type="time" />
            <Input label="Maximum participants (Optional)" name="capacity" type="number" min="1" placeholder="e.g. 100" />
          </div>
        </section>

        <section>
          <h2>Event banner (Cloudinary)</h2>
          <div
            className="upload-zone"
            onClick={() => bannerInputRef.current?.click()}
            style={{
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              minHeight: 140,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: bannerPreview ? '2px solid var(--accent)' : '2px dashed var(--border)',
              borderRadius: 12,
              padding: 20,
              background: bannerPreview ? `url(${bannerPreview}) center/cover no-repeat` : 'rgba(255,255,255,0.02)',
            }}
          >
            {bannerPreview ? (
              <div
                style={{
                  background: 'rgba(0,0,0,0.7)',
                  backdropFilter: 'blur(6px)',
                  padding: '10px 16px',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  color: '#fff',
                }}
              >
                <ImageIcon size={20} style={{ color: 'var(--accent)' }} />
                <span>
                  <strong>{bannerFile?.name}</strong>
                  <small style={{ display: 'block', opacity: 0.8 }}>Click to replace banner image</small>
                </span>
                <button
                  type="button"
                  onClick={handleRemoveBanner}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#f87171',
                    borderRadius: 6,
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <Upload size={28} style={{ color: 'var(--accent)', marginBottom: 8 }} />
                <strong style={{ fontSize: 14 }}>Click to upload an event banner</strong>
                <span style={{ fontSize: 12, color: '#888894', marginTop: 4 }}>
                  PNG, JPG or WebP &bull; Saved directly to Cloudinary &bull; max 5 MB
                </span>
              </>
            )}
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              onChange={handleBannerSelect}
              style={{ display: 'none' }}
            />
          </div>
        </section>

        <footer>
          <Button variant="ghost" type="button" onClick={() => nav('/club/events')}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            type="button"
            disabled={loading}
            onClick={(e) => submit(e, true)}
          >
            Save draft
          </Button>
          <Button type="submit" disabled={loading}>
            <Send size={17} /> {loading ? 'Publishing & uploading…' : 'Publish event'}
          </Button>
        </footer>
      </form>
    </>
  )
}

export function ClubAnnouncements(){
  const {data:raw,loading,refetch,setData}=useApi('/notices');
  const [submitting, setSubmitting] = useState(false);
  const items=(raw||[]).map(n=>({...n,id:n._id || n.id || Math.random(),date:fmt(n.publishedAt||n.createdAt)}));
  const {toast}=useToast();
  
  const submit=async e=>{
    e.preventDefault();
    const f=new FormData(e.currentTarget);
    const title = f.get('title')?.toString().trim();
    const content = f.get('content')?.toString().trim();
    const priority = f.get('priority')?.toString();
    const important = priority === 'Important' || priority === 'Urgent';

    if (!title || title.length < 2) {
      toast('Title must be at least 2 characters');
      return;
    }
    if (!content || content.length < 2) {
      toast('Content must be at least 2 characters');
      return;
    }

    setSubmitting(true);
    try{
      const created = await api.post('/notices',{
        title,
        description: content,
        category: 'Club',
        important,
        status: 'published'
      });
      toast('Announcement published successfully');
      e.currentTarget.reset();
      if (created) {
        setData((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
      }
      await refetch();
    }catch(err){
      toast(err.message||'Failed to post announcement');
    }finally{
      setSubmitting(false);
    }
  };

  if(loading)return <LoadingState/>;
  return <><PageHeader eyebrow="Community updates" title="Announcements" description="Keep members informed with clear, timely updates."/><div className="announcement-layout"><form className="settings-card" onSubmit={submit}><h2>Post an announcement</h2><Input label="Title" name="title" required minLength={2}/><label className="field"><span>Content</span><textarea name="content" rows="6" required minLength={2} placeholder="Write your announcement content here..."/></label><div className="form-grid"><label className="field"><span>Priority</span><select name="priority"><option>Normal</option><option>Important</option><option>Urgent</option></select></label><Input label="Publish date" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required/></div><Button type="submit" disabled={submitting}>{submitting ? 'Publishing…' : <><Send size={17}/> Publish announcement</>}</Button></form><section><div className="section-head"><h2>Previous announcements</h2><span>{items.length} total</span></div><div className="announcement-list">{items.map(n=><article key={n.id}><Badge tone={n.important?'amber':'neutral'}>{n.category}</Badge><h3>{n.title}</h3><p>{n.description}</p><time>{n.date}</time></article>)}</div></section></div></>
}

export function ClubMembers() {
  const { user } = useAuth()
  const { toast } = useToast()
  const clubId = typeof user?.club === 'object' ? user.club?._id : user?.club
  const { data: raw, loading, refetch } = useApi(clubId ? `/clubs/${clubId}/members` : null)
  const [q, setQ] = useState('')
  const [role, setRole] = useState('All')
  const [selectedMember, setSelectedMember] = useState(null)
  const [removeTarget, setRemoveTarget] = useState(null)
  const [updatingRole, setUpdatingRole] = useState(false)
  const [removing, setRemoving] = useState(false)

  const members = (Array.isArray(raw) ? raw : raw?.items || []).map((m) => {
    const u = m.user || {}
    return {
      id: m._id,
      userId: u._id,
      name: u.name || 'Member',
      email: u.email || '—',
      studentId: u.studentId || '—',
      department: u.department || '—',
      batch: u.batch || '',
      avatar: u.profileImage?.url || u.profileImage?.imageUrl || u.profileImage,
      role: m.role || 'member',
      clubRole: m.role === 'president' ? 'President' : m.role === 'executive' ? 'Executive' : 'Member',
      status: m.status || 'approved',
      joinDate: fmt(m.joinedAt || m.createdAt),
    }
  })

  const list = useMemo(() => {
    return members.filter((m) => {
      const matchRole = role === 'All' || m.clubRole === role
      const searchTarget = `${m.name} ${m.email} ${m.studentId} ${m.department}`.toLowerCase()
      const matchQuery = searchTarget.includes(q.toLowerCase())
      return matchRole && matchQuery
    })
  }, [members, q, role])

  const handleRoleChange = async (member, newRole) => {
    if (!clubId) return
    setUpdatingRole(true)
    try {
      await api.patch(`/clubs/${clubId}/members/${member.id}`, { role: newRole })
      toast(`${member.name}'s role updated to ${newRole}`)
      if (selectedMember && selectedMember.id === member.id) {
        setSelectedMember({
          ...selectedMember,
          role: newRole,
          clubRole: newRole === 'president' ? 'President' : newRole === 'executive' ? 'Executive' : 'Member',
        })
      }
      refetch()
    } catch (err) {
      toast(err.message || 'Failed to update member role')
    } finally {
      setUpdatingRole(false)
    }
  }

  const handleRemoveMember = async () => {
    if (!removeTarget || !clubId) return
    setRemoving(true)
    try {
      await api.delete(`/clubs/${clubId}/members/${removeTarget.id}`)
      toast(`${removeTarget.name} has been removed from the club`)
      if (selectedMember && selectedMember.id === removeTarget.id) {
        setSelectedMember(null)
      }
      refetch()
    } catch (err) {
      toast(err.message || 'Failed to remove member')
    } finally {
      setRemoving(false)
      setRemoveTarget(null)
    }
  }

  if (loading && !raw) return <LoadingState />

  return (
    <>
      <PageHeader
        eyebrow="Community"
        title="Club members"
        description={`${members.length} member${members.length === 1 ? '' : 's'} across leadership and general roles.`}
      />

      <div className="list-toolbar">
        <SearchBar value={q} onChange={setQ} placeholder="Search by name, student ID, department, or email…" />
        <label className="select-inline">
          <span className="sr-only">Filter by role</span>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="All">All Roles</option>
            <option value="President">President</option>
            <option value="Executive">Executive</option>
            <option value="Member">Member</option>
          </select>
        </label>
      </div>

      <div className="member-list">
        {list.length > 0 ? (
          list.map((m) => (
            <article key={m.id} style={{ gridTemplateColumns: '44px minmax(220px, 2fr) auto auto auto', gap: 14 }}>
              <Avatar name={m.name} src={m.avatar} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 13, color: '#f3f3f6' }}>{m.name}</strong>
                  {m.studentId !== '—' && (
                    <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', padding: '1px 7px', borderRadius: 4, color: '#d1d1d6', fontFamily: 'monospace' }}>
                      ID: {m.studentId}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4, flexWrap: 'wrap', fontSize: 11, color: '#8d8d97' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <GraduationCap size={13} style={{ color: 'var(--accent)' }} />
                    <span>Dept: <strong style={{ color: '#c4c4cc', fontWeight: 500 }}>{m.department}</strong></span>
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Mail size={13} style={{ color: '#8d8d97' }} />
                    <span style={{ color: '#aaaab3' }}>{m.email}</span>
                  </span>
                </div>
              </div>

              <Badge tone={m.clubRole === 'President' ? 'amber' : m.clubRole === 'Executive' ? 'blue' : 'neutral'}>
                {m.clubRole}
              </Badge>

              <span style={{ fontSize: 11, color: '#8d8d97', whiteSpace: 'nowrap' }}>
                Joined {m.joinDate}
              </span>

              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  onClick={() => setSelectedMember(m)}
                  aria-label={`View ${m.name}`}
                  title="View / Manage member"
                  style={{ width: 32, height: 32, borderRadius: 7, background: 'rgba(255,255,255,0.05)', color: '#aaaab3', display: 'grid', placeItems: 'center', border: 'none', cursor: 'pointer' }}
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => setRemoveTarget(m)}
                  aria-label={`Remove ${m.name}`}
                  title="Remove from club"
                  style={{ width: 32, height: 32, borderRadius: 7, background: 'rgba(239,68,68,0.08)', color: '#ef4444', display: 'grid', placeItems: 'center', border: 'none', cursor: 'pointer' }}
                >
                  <UserMinus size={16} />
                </button>
              </div>
            </article>
          ))
        ) : (
          <div style={{ padding: '36px 16px', textAlign: 'center', color: '#777782', fontSize: 13 }}>
            No members found matching your search.
          </div>
        )}
      </div>

      {/* Member Details & Role Modal */}
      <Modal open={!!selectedMember} onClose={() => setSelectedMember(null)} title="Member Profile & Leadership Role">
        {selectedMember && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Avatar name={selectedMember.name} src={selectedMember.avatar} size="lg" />
              <div>
                <h3 style={{ margin: 0, fontSize: 18, color: '#f3f3f6' }}>{selectedMember.name}</h3>
                <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
                  <Badge tone={selectedMember.clubRole === 'President' ? 'amber' : selectedMember.clubRole === 'Executive' ? 'blue' : 'neutral'}>
                    {selectedMember.clubRole}
                  </Badge>
                  <span style={{ fontSize: 11, color: '#8d8d97' }}>
                    Member since {selectedMember.joinDate}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, display: 'grid', gridTemplateColumns: '130px 1fr', gap: '10px 14px', fontSize: 13 }}>
              <span style={{ color: '#8d8d97' }}>Student ID:</span>
              <strong style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>{selectedMember.studentId}</strong>

              <span style={{ color: '#8d8d97' }}>Department:</span>
              <strong>{selectedMember.department}</strong>

              <span style={{ color: '#8d8d97' }}>Email Address:</span>
              <span>{selectedMember.email}</span>

              {selectedMember.batch && (
                <>
                  <span style={{ color: '#8d8d97' }}>Academic Batch:</span>
                  <span>{selectedMember.batch}</span>
                </>
              )}

              <span style={{ color: '#8d8d97' }}>Membership Status:</span>
              <Badge tone="green">{selectedMember.status}</Badge>

              <span style={{ color: '#8d8d97', alignSelf: 'center' }}>Change Role:</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select
                  value={selectedMember.role}
                  disabled={updatingRole}
                  onChange={(e) => handleRoleChange(selectedMember, e.target.value)}
                  style={{
                    background: '#181820',
                    border: '1px solid var(--border)',
                    borderRadius: 7,
                    color: '#f3f3f6',
                    padding: '6px 10px',
                    fontSize: 13,
                  }}
                >
                  <option value="member">General Member</option>
                  <option value="executive">Executive Member</option>
                  <option value="president">Club President</option>
                </select>
                {updatingRole && <span style={{ fontSize: 11, color: '#8d8d97' }}>Saving…</span>}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <Button
                variant="secondary"
                onClick={() => {
                  const m = selectedMember
                  setSelectedMember(null)
                  setRemoveTarget(m)
                }}
                style={{ color: '#ef4444' }}
              >
                <UserMinus size={16} /> Remove Member
              </Button>
              <Button onClick={() => setSelectedMember(null)}>Done</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Remove Member Confirmation Dialog */}
      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemoveMember}
        title={`Remove ${removeTarget?.name} from club?`}
        message="This member will be unlinked from the club and will no longer appear on your membership roster."
        confirmLabel={removing ? 'Removing…' : 'Remove member'}
        danger
      />
    </>
  )
}

export function ClubSettings(){return <SettingsPage title="Organization settings" sections={['Public organization profile','Membership notifications','Event registration alerts','Executive permissions','Weekly activity summary']}/>}
