import { useMemo, useState } from 'react'
import {
  Users,
  Building2,
  CalendarDays,
  ClipboardCheck,
  ArrowRight,
  Eye,
  Pencil,
  Ban,
  Check,
  X,
  Trash2,
  Plus,
  Send,
  ShieldCheck,
  FileText,
  Mail,
  GraduationCap,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import StatCard from '../../components/dashboard/StatCard'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Avatar from '../../components/common/Avatar'
import SearchBar from '../../components/common/SearchBar'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import LoadingState from '../../components/common/LoadingState'
import { useToast } from '../../components/common/Toast'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../hooks/useAuth'
import { api, getAssetUrl } from '../../services/api'
import { SettingsPage } from '../student/StudentPages'
import { getEventAutomatedStatus } from '../../utils/eventStatus'

function fmt(d) {
  if (!d) return ''
  const dt = new Date(d)
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function day(d) {
  if (!d) return ''
  return String(new Date(d).getDate())
}

export function AdminDashboard() {
  const { user } = useAuth()
  const { data: metrics, loading: metricsLoading, refetch: refetchMetrics } = useApi('/admin/metrics')
  const { data: eventsRaw, loading: eventsLoading } = useApi('/events', { params: { limit: 5 } })
  const { data: approvalData, loading: approvalsLoading, refetch: refetchApprovals } = useApi('/admin/approvals')
  const { toast } = useToast()

  const m = metrics || {}
  const events = (Array.isArray(eventsRaw) ? eventsRaw : eventsRaw?.items || []).map((e) => ({
    ...e,
    id: e._id,
    day: day(e.date),
    dateFormatted: fmt(e.date),
    title: e.title,
    organizer: e.organizer,
    category: e.category,
    status: e.status,
  }))

  const pendingClubs = (approvalData?.clubs || []).map((c) => ({
    ...c,
    kind: 'club',
    type: 'club',
    title: c.name,
    subtitle: `${c.category || 'Student'} Club`,
    accent: c.accent || '#F59E0B',
    initials: c.initials || c.name?.slice(0, 2),
  }))

  const pendingEvents = (approvalData?.events || []).map((e) => ({
    ...e,
    kind: 'event',
    type: 'event',
    title: e.title,
    subtitle: `Event • ${e.organizer || 'Club'}`,
    accent: '#38BDF8',
    initials: 'EV',
  }))

  const pendingNotices = (approvalData?.notices || []).map((n) => ({
    ...n,
    kind: 'notice',
    type: 'notice',
    title: n.title,
    subtitle: `Notice • ${n.category || 'General'}`,
    accent: '#10B981',
    initials: 'NO',
  }))

  const pendingList = [...pendingClubs, ...pendingEvents, ...pendingNotices].slice(0, 4)

  const handleQuickDecision = async (item, decision) => {
    try {
      await api.post(`/admin/approvals/${item._id}/${decision}`, { type: item.type })
      toast(`${item.title} ${decision === 'approve' ? 'approved' : 'rejected'}`)
      refetchApprovals()
      refetchMetrics()
    } catch (err) {
      toast(err.message || 'Action failed')
    }
  }

  // Generate dynamic SVG path for campus activity trend
  const activityData = m.activity && m.activity.length > 0
    ? m.activity
    : [
        { month: 'Mar', total: 10 },
        { month: 'Apr', total: 25 },
        { month: 'May', total: 40 },
        { month: 'Jun', total: 35 },
        { month: 'Jul', total: 60 },
        { month: 'Aug', total: 85 },
      ]

  const maxVal = Math.max(...activityData.map((d) => d.total || 0), 10)
  const chartPoints = activityData.map((d, index) => {
    const x = Math.round((index / (activityData.length - 1)) * 600)
    const normalized = (d.total || 0) / maxVal
    const y = Math.round(155 - normalized * 125)
    return { x, y }
  })

  // Build SVG path
  let pathD = `M${chartPoints[0].x} ${chartPoints[0].y}`
  for (let i = 0; i < chartPoints.length - 1; i++) {
    const current = chartPoints[i]
    const next = chartPoints[i + 1]
    const cpX1 = current.x + (next.x - current.x) / 2
    const cpY1 = current.y
    const cpX2 = current.x + (next.x - current.x) / 2
    const cpY2 = next.y
    pathD += ` C${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`
  }
  const areaD = `${pathD} L600 180 L0 180Z`

  if (metricsLoading && !metrics) return <LoadingState />

  const totalStudents = m.studentCount ?? m.users ?? 0
  const recentStudentsCount = m.recentStudents ?? 0
  const totalClubs = m.clubCount ?? m.clubs ?? 0
  const pendingClubsCount = m.pendingClubs ?? 0
  const totalEvents = m.eventCount ?? m.events ?? 0
  const publishedEventsCount = m.publishedEvents ?? 0
  const totalPending = m.pendingApprovals ?? (pendingClubsCount + (m.pendingEvents || 0) + (m.pendingNotices || 0))

  return (
    <>
      <PageHeader
        eyebrow="Platform control"
        title="Admin Dashboard"
        description="A clear view of CampusHub operations, pending moderation work, and system statistics."
        actions={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '6px 14px 6px 8px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
            }}
          >
            <Avatar name={user?.name || 'CampusHub Administrator'} src="/admin-avatar.png" role="admin" size="md" />
            <div style={{ textAlign: 'left', lineHeight: 1.25 }}>
              <strong style={{ fontSize: 13, color: '#f3f3f6', display: 'block' }}>
                {user?.name || 'Administrator'}
              </strong>
              <small style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 500 }}>
                Super Admin &bull; {user?.department || 'Student Affairs'}
              </small>
            </div>
          </div>
        }
      />

      <div className="stats-grid">
        <StatCard
          icon={Users}
          label="Total students"
          value={String(totalStudents)}
          detail={`${recentStudentsCount} recent`}
        />
        <StatCard
          icon={Building2}
          label="Total clubs"
          value={String(totalClubs)}
          detail={`${pendingClubsCount} awaiting review`}
        />
        <StatCard
          icon={CalendarDays}
          label="Total events"
          value={String(totalEvents)}
          detail={`${publishedEventsCount} published`}
        />
        <StatCard
          icon={ClipboardCheck}
          label="Pending approvals"
          value={String(totalPending)}
          detail={totalPending > 0 ? `${totalPending} need attention` : 'All caught up'}
        />
      </div>

      <div className="dashboard-columns admin-overview">
        <section>
          <div className="section-head">
            <h2>Campus activity</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, color: '#8d8d97' }}>
                Registrations: <strong>{m.registrations || 0}</strong>
              </span>
              <Badge tone="green">Healthy</Badge>
            </div>
          </div>
          <div className="admin-chart">
            <div className="chart-y">
              <span>{Math.round(maxVal)}</span>
              <span>{Math.round(maxVal * 0.75)}</span>
              <span>{Math.round(maxVal * 0.5)}</span>
              <span>{Math.round(maxVal * 0.25)}</span>
              <span>0</span>
            </div>
            <div className="line-visual">
              <svg viewBox="0 0 600 180" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#F59E0B" stopOpacity=".25" />
                    <stop offset="1" stopColor="#F59E0B" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={areaD} fill="url(#areaGrad)" />
                <path d={pathD} fill="none" stroke="#F59E0B" strokeWidth="3" />
                {chartPoints.map((pt, idx) => (
                  <circle key={idx} cx={pt.x} cy={pt.y} r="4" fill="#F59E0B" />
                ))}
              </svg>
              <div className="chart-x">
                {activityData.map((d, idx) => (
                  <span key={idx}>{d.month}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="section-head">
            <h2>Pending approvals</h2>
            <a href="/admin/approvals">
              Review all <ArrowRight size={15} />
            </a>
          </div>
          {pendingList.length > 0 ? (
            <div className="approval-mini">
              {pendingList.map((item) => (
                <article key={`${item.type}-${item._id}`}>
                  <Avatar name={item.initials} color={item.accent} />
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.subtitle}</small>
                  </span>
                  <button
                    aria-label="Approve"
                    title="Approve"
                    onClick={() => handleQuickDecision(item, 'approve')}
                  >
                    <Check />
                  </button>
                  <button
                    aria-label="Reject"
                    title="Reject"
                    onClick={() => handleQuickDecision(item, 'reject')}
                  >
                    <X />
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: 11,
                background: 'var(--card)',
                padding: '34px 20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <ShieldCheck size={32} style={{ color: '#10B981' }} />
              <strong style={{ fontSize: 13, color: '#f3f3f6' }}>Queue is cleared</strong>
              <p style={{ margin: 0, fontSize: 12, color: '#7c7c88' }}>
                All club requests, events, and notices are fully up to date.
              </p>
            </div>
          )}
        </section>
      </div>

      <div className="admin-feed-grid">
        <section>
          <div className="section-head">
            <h2>Recent events</h2>
            <a href="/admin/events" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>
              View all
            </a>
          </div>
          {events.length > 0 ? (
            events.slice(0, 5).map((e) => (
              <div className="feed-row" key={e.id}>
                <span className="event-mini-date">{e.day}</span>
                <span>
                  <strong>{e.title}</strong>
                  <small>{e.organizer}</small>
                </span>
                <Badge tone={e.status === 'published' ? 'green' : 'amber'}>{e.category}</Badge>
              </div>
            ))
          ) : (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#777782', fontSize: 13 }}>
              No campus events scheduled yet.
            </div>
          )}
        </section>

        <section>
          <div className="section-head">
            <h2>Platform status</h2>
            <Badge tone="green">All Systems Online</Badge>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
              <span style={{ color: '#8d8d97' }}>MongoDB Connection</span>
              <strong style={{ color: '#10B981' }}>Connected</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
              <span style={{ color: '#8d8d97' }}>Active Users</span>
              <strong>{m.activeUsers || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
              <span style={{ color: '#8d8d97' }}>Approved Clubs</span>
              <strong>{m.approvedClubs || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#8d8d97' }}>Published Announcements</span>
              <strong>{m.publishedNotices || 0}</strong>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

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

export function AdminUsers() {
  const { data: raw, loading, refetch } = useApi('/admin/users')
  const { toast } = useToast()
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [selectedUser, setSelectedUser] = useState(null)
  const [actionTarget, setActionTarget] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const usersList = (Array.isArray(raw) ? raw : raw?.items || []).map((u) => ({
    ...u,
    id: u._id,
    joined: fmt(u.createdAt),
    status: u.status === 'active' ? 'Active' : 'Suspended',
  }))

  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchQuery =
        (u.name || '').toLowerCase().includes(q.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(q.toLowerCase()) ||
        (u.studentId || '').toLowerCase().includes(q.toLowerCase()) ||
        (u.department || '').toLowerCase().includes(q.toLowerCase())
      if (!matchQuery) return false

      if (roleFilter === 'All') return true
      if (roleFilter === 'Students') return u.role === 'student'
      if (roleFilter === 'Clubs') return u.role === 'club'
      if (roleFilter === 'Admins') return u.role === 'admin'
      if (roleFilter === 'Suspended') return u.status === 'Suspended'
      return true
    })
  }, [usersList, q, roleFilter])

  const handleToggleStatus = (u) => {
    const isSuspended = u.status === 'Suspended'
    setActionTarget({
      type: 'status',
      user: u,
      newStatus: isSuspended ? 'active' : 'suspended',
      title: `${isSuspended ? 'Activate' : 'Suspend'} account: ${u.name}?`,
      message: isSuspended
        ? 'This user will regain access to log in and participate in events.'
        : 'This user will be logged out and unable to access their account.',
      confirmLabel: isSuspended ? 'Activate' : 'Suspend',
      danger: !isSuspended,
    })
  }

  const handleDeleteUser = (u) => {
    setActionTarget({
      type: 'delete',
      user: u,
      title: `Delete user: ${u.name}?`,
      message: 'This permanently removes the user account and associated registrations. This cannot be undone.',
      confirmLabel: 'Delete user',
      danger: true,
    })
  }

  const executeAction = async () => {
    if (!actionTarget) return
    setActionLoading(true)
    try {
      if (actionTarget.type === 'status') {
        await api.patch(`/admin/users/${actionTarget.user.id}/status`, { status: actionTarget.newStatus })
        toast(`User is now ${actionTarget.newStatus}`)
      } else if (actionTarget.type === 'delete') {
        await api.delete(`/admin/users/${actionTarget.user.id}`)
        toast('User deleted successfully')
      }
      refetch()
    } catch (err) {
      toast(err.message || 'Operation failed')
    } finally {
      setActionLoading(false)
      setActionTarget(null)
    }
  }

  if (loading && !raw) return <LoadingState />

  return (
    <>
      <PageHeader
        eyebrow="Platform management"
        title="Users"
        description="Review, search, and manage registered students, club representatives, and administrators."
      />

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <SearchBar value={q} onChange={setQ} placeholder="Search by name, email, student ID, or department…" />
        </div>
        <div className="approval-tabs" style={{ margin: 0, border: 'none', gap: 6 }}>
          {['All', 'Students', 'Clubs', 'Admins', 'Suspended'].map((filter) => (
            <button
              key={filter}
              className={roleFilter === filter ? 'active' : ''}
              onClick={() => setRoleFilter(filter)}
              style={{ height: 38, padding: '0 14px', borderRadius: 8, background: roleFilter === filter ? 'var(--card)' : 'transparent' }}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="responsive-table admin-table">
        <div className="table-head">
          <span>User</span>
          <span>ID / Email</span>
          <span>Role</span>
          <span>Department</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        {filteredUsers.length > 0 ? (
          filteredUsers.map((u) => (
            <article key={u.id}>
              <div className="table-title">
                <Avatar name={u.name} src={u.profileImage?.url || u.profileImage?.imageUrl} role={u.role} />
                <span>
                  <strong>{u.name}</strong>
                  <small>Joined {u.joined}</small>
                </span>
              </div>
              <span data-label="ID / Email">
                {u.studentId || '—'}
                <small>{u.email}</small>
              </span>
              <span data-label="Role">
                <Badge tone={u.role === 'admin' ? 'amber' : u.role === 'club' ? 'blue' : 'neutral'}>
                  {u.role}
                </Badge>
              </span>
              <span data-label="Department">{u.department || '—'}</span>
              <span data-label="Status">
                <Badge tone={u.status === 'Active' ? 'green' : 'amber'}>{u.status}</Badge>
              </span>
              <div className="table-actions">
                <button
                  onClick={() => setSelectedUser(u)}
                  aria-label={`View ${u.name}`}
                  title="View details"
                >
                  <Eye />
                </button>
                {u.role !== 'admin' && (
                  <button
                    onClick={() => handleToggleStatus(u)}
                    aria-label={`${u.status === 'Suspended' ? 'Activate' : 'Suspend'} ${u.name}`}
                    title={u.status === 'Suspended' ? 'Activate' : 'Suspend'}
                  >
                    {u.status === 'Suspended' ? <Check /> : <Ban />}
                  </button>
                )}
                {u.role !== 'admin' && (
                  <button
                    onClick={() => handleDeleteUser(u)}
                    aria-label={`Delete ${u.name}`}
                    title="Delete user"
                  >
                    <Trash2 />
                  </button>
                )}
              </div>
            </article>
          ))
        ) : (
          <div style={{ padding: '36px 16px', textAlign: 'center', color: '#777782', fontSize: 13, gridColumn: '1 / -1' }}>
            No users found matching your search.
          </div>
        )}
      </div>

      {/* User Details Modal */}
      <Modal open={!!selectedUser} onClose={() => setSelectedUser(null)} title="User Profile Details">
        {selectedUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Avatar name={selectedUser.name} src={selectedUser.profileImage?.url || selectedUser.profileImage?.imageUrl} role={selectedUser.role} size="lg" />
              <div>
                <h3 style={{ margin: 0, fontSize: 18, color: '#f3f3f6' }}>{selectedUser.name}</h3>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <Badge tone={selectedUser.role === 'admin' ? 'amber' : selectedUser.role === 'club' ? 'blue' : 'neutral'}>
                    {selectedUser.role}
                  </Badge>
                  <Badge tone={selectedUser.status === 'Active' ? 'green' : 'amber'}>
                    {selectedUser.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px 14px', fontSize: 13 }}>
              <span style={{ color: '#8d8d97' }}>Email:</span>
              <strong>{selectedUser.email}</strong>

              <span style={{ color: '#8d8d97' }}>Student / Org ID:</span>
              <span>{selectedUser.studentId || '—'}</span>

              <span style={{ color: '#8d8d97' }}>Department:</span>
              <span>{selectedUser.department || '—'}</span>

              <span style={{ color: '#8d8d97' }}>Batch:</span>
              <span>{selectedUser.batch || '—'}</span>

              <span style={{ color: '#8d8d97' }}>Phone:</span>
              <span>{selectedUser.phone || '—'}</span>

              {selectedUser.club && (
                <>
                  <span style={{ color: '#8d8d97' }}>Affiliated Club:</span>
                  <strong style={{ color: 'var(--accent)' }}>
                    {typeof selectedUser.club === 'object' ? selectedUser.club.name : 'Linked Organization'}
                  </strong>
                </>
              )}

              <span style={{ color: '#8d8d97' }}>Joined Date:</span>
              <span>{selectedUser.joined}</span>

              {selectedUser.bio && (
                <>
                  <span style={{ color: '#8d8d97' }}>Bio:</span>
                  <span style={{ color: '#c4c4cc', lineHeight: 1.5 }}>{selectedUser.bio}</span>
                </>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              {selectedUser.role !== 'admin' && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    const u = selectedUser
                    setSelectedUser(null)
                    handleToggleStatus(u)
                  }}
                >
                  {selectedUser.status === 'Suspended' ? 'Activate Account' : 'Suspend Account'}
                </Button>
              )}
              <Button onClick={() => setSelectedUser(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Action Dialog */}
      <ConfirmDialog
        open={!!actionTarget}
        onClose={() => setActionTarget(null)}
        onConfirm={executeAction}
        title={actionTarget?.title || 'Confirm action'}
        message={actionTarget?.message || 'Are you sure?'}
        confirmLabel={actionLoading ? 'Processing…' : actionTarget?.confirmLabel || 'Confirm'}
        danger={actionTarget?.danger}
      />
    </>
  )
}

export function AdminClubs() {
  const { data: raw, loading, refetch } = useApi('/clubs')
  const { toast } = useToast()
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [seedModal, setSeedModal] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [selectedAccent, setSelectedAccent] = useState('#F59E0B')
  const [createdInfo, setCreatedInfo] = useState(null)
  const [formError, setFormError] = useState('')
  const [selectedClub, setSelectedClub] = useState(null)
  const [actionTarget, setActionTarget] = useState(null)

  const clubsList = (Array.isArray(raw) ? raw : raw?.items || []).map((c) => ({
    ...c,
    id: c._id,
    members: c.memberCount || 0,
    status: c.status === 'approved' ? 'Approved' : c.status === 'pending' ? 'Pending' : 'Suspended',
    created: String(c.established || new Date(c.createdAt).getFullYear()),
  }))

  const filteredClubs = useMemo(() => {
    return clubsList.filter((c) => {
      const matchQ =
        (c.name || '').toLowerCase().includes(q.toLowerCase()) ||
        (c.category || '').toLowerCase().includes(q.toLowerCase()) ||
        (c.initials || '').toLowerCase().includes(q.toLowerCase())
      if (!matchQ) return false

      if (statusFilter === 'All') return true
      if (statusFilter === 'Approved') return c.status === 'Approved'
      if (statusFilter === 'Pending') return c.status === 'Pending'
      if (statusFilter === 'Suspended') return c.status === 'Suspended'
      return true
    })
  }, [clubsList, q, statusFilter])

  const handleClubDecision = async (club, decision) => {
    try {
      await api.post(`/admin/approvals/${club.id}/${decision}`, { type: 'club' })
      toast(`Club has been ${decision === 'approve' ? 'approved' : 'rejected'}`)
      refetch()
    } catch (err) {
      toast(err.message || 'Action failed')
    }
  }

  const handleToggleClubStatus = (c) => {
    const isSuspended = c.status === 'Suspended'
    setActionTarget({
      type: 'status',
      club: c,
      newStatus: isSuspended ? 'approved' : 'suspended',
      title: `${isSuspended ? 'Activate' : 'Suspend'} club: ${c.name}?`,
      message: isSuspended
        ? 'The club profile, events, and membership requests will become visible again.'
        : 'The club will be hidden from public view and cannot host events while suspended.',
      confirmLabel: isSuspended ? 'Activate' : 'Suspend',
      danger: !isSuspended,
    })
  }

  const executeClubAction = async () => {
    if (!actionTarget) return
    try {
      await api.patch(`/admin/clubs/${actionTarget.club.id}/status`, { status: actionTarget.newStatus })
      toast(`Club status updated to ${actionTarget.newStatus}`)
      refetch()
    } catch (err) {
      toast(err.message || 'Operation failed')
    } finally {
      setActionTarget(null)
    }
  }

  const handleSeedClub = async (e) => {
    e.preventDefault()
    setSeeding(true)
    setFormError('')
    const form = new FormData(e.currentTarget)
    const establishedRaw = form.get('established')?.toString().trim()
    const initialsRaw = form.get('initials')?.toString().trim().toUpperCase()
    const payload = {
      name: form.get('name')?.toString().trim(),
      clubId: form.get('clubId')?.toString().trim().toUpperCase(),
      email: form.get('email')?.toString().trim().toLowerCase(),
      password: form.get('password')?.toString(),
      category: form.get('category')?.toString().trim() || 'Technology',
      initials: initialsRaw ? initialsRaw.slice(0, 10) : undefined,
      description: form.get('description')?.toString().trim() || undefined,
      established: establishedRaw && !isNaN(Number(establishedRaw)) ? Number(establishedRaw) : undefined,
      accent: selectedAccent || '#F59E0B',
    }

    try {
      await api.post('/admin/clubs', payload)
      toast('Club created and credentials generated!')
      setCreatedInfo({
        name: payload.name,
        email: payload.email,
        password: payload.password,
        clubId: payload.clubId,
      })
      refetch()
    } catch (err) {
      const errMsg =
        err.errors?.length > 0
          ? err.errors.map((item) => `${item.field.replace('body.', '')}: ${item.message}`).join(' · ')
          : err.message || 'Failed to seed club'
      setFormError(errMsg)
      toast(errMsg)
    } finally {
      setSeeding(false)
    }
  }

  if (loading && !raw) return <LoadingState />

  return (
    <>
      <PageHeader
        eyebrow="Platform management"
        title="Clubs"
        description="Review campus organizations, approve new club submissions, or seed club accounts with credentials."
        actions={
          <Button
            onClick={() => {
              setCreatedInfo(null)
              setFormError('')
              setSeedModal(true)
            }}
          >
            <Plus size={17} /> Seed / Create Club
          </Button>
        }
      />

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <SearchBar value={q} onChange={setQ} placeholder="Search clubs by name, category, or initials…" />
        </div>
        <div className="approval-tabs" style={{ margin: 0, border: 'none', gap: 6 }}>
          {['All', 'Approved', 'Pending', 'Suspended'].map((filter) => (
            <button
              key={filter}
              className={statusFilter === filter ? 'active' : ''}
              onClick={() => setStatusFilter(filter)}
              style={{ height: 38, padding: '0 14px', borderRadius: 8, background: statusFilter === filter ? 'var(--card)' : 'transparent' }}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="responsive-table admin-table">
        <div className="table-head">
          <span>Club</span>
          <span>Category</span>
          <span>Members</span>
          <span>Status</span>
          <span>Created</span>
          <span>Actions</span>
        </div>

        {filteredClubs.length > 0 ? (
          filteredClubs.map((c) => (
            <article key={c.id}>
              <div className="table-title">
                <Avatar name={c.initials} color={c.accent} src={c.logo?.url || c.logo?.imageUrl} />
                <strong>{c.name}</strong>
              </div>
              <span data-label="Category">{c.category}</span>
              <span data-label="Members">{c.members.toLocaleString()}</span>
              <span data-label="Status">
                <Badge tone={c.status === 'Approved' ? 'green' : c.status === 'Pending' ? 'amber' : 'neutral'}>
                  {c.status}
                </Badge>
              </span>
              <span data-label="Created">{c.created}</span>
              <div className="table-actions">
                <button onClick={() => setSelectedClub(c)} aria-label={`View ${c.name}`} title="View details">
                  <Eye />
                </button>
                {c.status === 'Pending' ? (
                  <>
                    <button
                      onClick={() => handleClubDecision(c, 'approve')}
                      aria-label="Approve club"
                      title="Approve"
                    >
                      <Check />
                    </button>
                    <button
                      onClick={() => handleClubDecision(c, 'reject')}
                      aria-label="Reject club"
                      title="Reject"
                    >
                      <X />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleToggleClubStatus(c)}
                    aria-label={`${c.status === 'Suspended' ? 'Activate' : 'Suspend'} ${c.name}`}
                    title={c.status === 'Suspended' ? 'Activate' : 'Suspend'}
                  >
                    {c.status === 'Suspended' ? <Check /> : <Ban />}
                  </button>
                )}
              </div>
            </article>
          ))
        ) : (
          <div style={{ padding: '36px 16px', textAlign: 'center', color: '#777782', fontSize: 13, gridColumn: '1 / -1' }}>
            No clubs found matching your search.
          </div>
        )}
      </div>

      {/* Club Details Modal */}
      <Modal open={!!selectedClub} onClose={() => setSelectedClub(null)} title="Club Profile Details">
        {selectedClub && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Avatar name={selectedClub.initials} color={selectedClub.accent} src={selectedClub.logo?.url || selectedClub.logo?.imageUrl} size="lg" />
              <div>
                <h3 style={{ margin: 0, fontSize: 18, color: '#f3f3f6' }}>{selectedClub.name}</h3>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <Badge tone="blue">{selectedClub.category}</Badge>
                  <Badge tone={selectedClub.status === 'Approved' ? 'green' : selectedClub.status === 'Pending' ? 'amber' : 'neutral'}>
                    {selectedClub.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px 14px', fontSize: 13 }}>
              <span style={{ color: '#8d8d97' }}>Slug:</span>
              <code>{selectedClub.slug}</code>

              <span style={{ color: '#8d8d97' }}>Members:</span>
              <strong>{selectedClub.members} registered members</strong>

              <span style={{ color: '#8d8d97' }}>Established:</span>
              <span>{selectedClub.created}</span>

              <span style={{ color: '#8d8d97' }}>Accent Color:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 16, height: 16, borderRadius: '50%', background: selectedClub.accent, display: 'inline-block' }} />
                <code>{selectedClub.accent}</code>
              </div>

              {selectedClub.description && (
                <>
                  <span style={{ color: '#8d8d97' }}>Description:</span>
                  <span style={{ color: '#c4c4cc', lineHeight: 1.5 }}>{selectedClub.description}</span>
                </>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              {selectedClub.status === 'Pending' && (
                <>
                  <Button variant="secondary" onClick={() => { const c = selectedClub; setSelectedClub(null); handleClubDecision(c, 'reject'); }}>
                    <X size={16} /> Reject
                  </Button>
                  <Button onClick={() => { const c = selectedClub; setSelectedClub(null); handleClubDecision(c, 'approve'); }}>
                    <Check size={16} /> Approve
                  </Button>
                </>
              )}
              <Button variant="ghost" onClick={() => setSelectedClub(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Seed Club Modal */}
      <Modal
        open={seedModal}
        onClose={() => setSeedModal(false)}
        title={createdInfo ? 'Club Created & Credentials' : 'Seed / Create Club Account'}
      >
        {createdInfo ? (
          <div style={{ marginTop: 15, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '14px 16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 10 }}>
              <strong style={{ color: '#10B981', display: 'block', marginBottom: 4 }}>
                Club account created & verified!
              </strong>
              <p style={{ margin: 0, fontSize: 13, color: '#c4c4cc' }}>
                The club representative can now log in at <code>/login</code> using these credentials to edit club info, upload banner & logo, post events, and manage members.
              </p>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 12px', fontSize: 13 }}>
                <span style={{ color: '#8d8d97' }}>Organization:</span>
                <strong>{createdInfo.name}</strong>
                <span style={{ color: '#8d8d97' }}>Club ID:</span>
                <code>{createdInfo.clubId}</code>
                <span style={{ color: '#8d8d97' }}>Login Email:</span>
                <strong style={{ color: 'var(--accent)' }}>{createdInfo.email}</strong>
                <span style={{ color: '#8d8d97' }}>Password:</span>
                <code>{createdInfo.password}</code>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 5 }}>
              <Button onClick={() => setSeedModal(false)}>Done</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSeedClub} className="form-grid" style={{ marginTop: 15, gap: '14px 13px' }}>
            <Input label="Club / Organization Name" name="name" placeholder="e.g. CUET Robotics Society" required className="span-2" />
            <Input label="Club ID / Organization ID" name="clubId" placeholder="e.g. ORG-001 or RS" required />
            <Input label="Acronym / Initials (Max 10 chars)" name="initials" placeholder="e.g. RS, ACM, IEEE" maxLength={10} />

            <Input label="Club Login Email" name="email" type="email" placeholder="robotics@campushub.local" required className="span-2" />
            <Input label="Password for Club Login" name="password" type="password" minLength={8} placeholder="At least 8 characters" required className="span-2" />

            <label className="field">
              <span>Category</span>
              <select name="category" defaultValue="Technology">
                {CLUB_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </label>

            <Input label="Established Year (Optional)" name="established" type="number" min="1800" max={new Date().getFullYear()} placeholder="e.g. 2018" />

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
              </div>
            </div>

            <label className="field span-2">
              <span>Description (Optional)</span>
              <textarea name="description" rows={3} placeholder="Initial description. The club leader can edit and expand this after logging in." />
            </label>

            {formError && (
              <div className="form-error span-2" role="alert">
                {formError}
              </div>
            )}

            <div className="span-2" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <Button variant="ghost" type="button" onClick={() => setSeedModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={seeding}>
                {seeding ? 'Creating club account…' : 'Seed Club & Create Credentials'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Confirm Club Status Dialog */}
      <ConfirmDialog
        open={!!actionTarget}
        onClose={() => setActionTarget(null)}
        onConfirm={executeClubAction}
        title={actionTarget?.title || 'Confirm action'}
        message={actionTarget?.message || 'Are you sure?'}
        confirmLabel={actionTarget?.confirmLabel || 'Confirm'}
        danger={actionTarget?.danger}
      />
    </>
  )
}

export function AdminEvents() {
  const { data: raw, loading, refetch } = useApi('/events')
  const { toast } = useToast()
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const eventsList = (Array.isArray(raw) ? raw : raw?.items || []).map((e) => ({
    ...e,
    id: e._id,
    day: day(e.date),
    dateFormatted: fmt(e.date),
    status: getEventAutomatedStatus(e),
  }))

  const filteredEvents = useMemo(() => {
    return eventsList.filter((e) => {
      const matchQ =
        (e.title || '').toLowerCase().includes(q.toLowerCase()) ||
        (e.organizer || '').toLowerCase().includes(q.toLowerCase()) ||
        (e.category || '').toLowerCase().includes(q.toLowerCase()) ||
        (e.location || '').toLowerCase().includes(q.toLowerCase())
      if (!matchQ) return false

      if (statusFilter === 'All') return true
      if (statusFilter === 'Published') return e.status === 'Published'
      if (statusFilter === 'Ended') return e.status === 'Ended'
      if (statusFilter === 'Pending') return e.status === 'Pending'
      if (statusFilter === 'Draft') return e.status === 'Draft'
      return true
    })
  }, [eventsList, q, statusFilter])

  const handleEventApproval = async (event, decision) => {
    try {
      await api.post(`/admin/approvals/${event.id}/${decision}`, { type: 'event' })
      toast(`Event ${decision === 'approve' ? 'published' : 'rejected'}`)
      refetch()
    } catch (err) {
      toast(err.message || 'Action failed')
    }
  }

  const handleDeleteEvent = async () => {
    if (!deleteTarget) return
    try {
      await api.delete(`/events/${deleteTarget.id}`)
      toast('Event removed successfully')
      refetch()
    } catch (err) {
      toast(err.message || 'Delete failed')
    } finally {
      setDeleteTarget(null)
    }
  }

  if (loading && !raw) return <LoadingState />

  return (
    <>
      <PageHeader
        eyebrow="Platform management"
        title="Events"
        description="Review campus activities, publish pending events, and manage workshop or competition listings."
      />

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <SearchBar value={q} onChange={setQ} placeholder="Search events by title, organizer, category, or venue…" />
        </div>
        <div className="approval-tabs" style={{ margin: 0, border: 'none', gap: 6 }}>
          {['All', 'Published', 'Ended', 'Pending', 'Draft'].map((filter) => (
            <button
              key={filter}
              className={statusFilter === filter ? 'active' : ''}
              onClick={() => setStatusFilter(filter)}
              style={{ height: 38, padding: '0 14px', borderRadius: 8, background: statusFilter === filter ? 'var(--card)' : 'transparent' }}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="responsive-table admin-table">
        <div className="table-head">
          <span>Event</span>
          <span>Organizer</span>
          <span>Date</span>
          <span>Category</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        {filteredEvents.length > 0 ? (
          filteredEvents.map((e) => (
            <article key={e.id}>
              <div className="table-title">
                <span className="event-mini-date">{e.day}</span>
                <strong>{e.title}</strong>
              </div>
              <span data-label="Organizer">{e.organizer}</span>
              <span data-label="Date">{e.dateFormatted}</span>
              <span data-label="Category">
                <Badge>{e.category}</Badge>
              </span>
              <span data-label="Status">
                <Badge tone={e.status === 'Published' ? 'green' : e.status === 'Ended' ? 'amber' : e.status === 'Pending' ? 'amber' : 'neutral'}>
                  {e.status}
                </Badge>
              </span>
              <div className="table-actions">
                <button onClick={() => setSelectedEvent(e)} aria-label={`View ${e.title}`} title="View details">
                  <Eye />
                </button>
                {e.status === 'Pending' ? (
                  <>
                    <button
                      onClick={() => handleEventApproval(e, 'approve')}
                      aria-label="Approve event"
                      title="Approve"
                    >
                      <Check />
                    </button>
                    <button
                      onClick={() => handleEventApproval(e, 'reject')}
                      aria-label="Reject event"
                      title="Reject"
                    >
                      <X />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setDeleteTarget(e)}
                    aria-label={`Remove ${e.title}`}
                    title="Remove event"
                  >
                    <Trash2 />
                  </button>
                )}
              </div>
            </article>
          ))
        ) : (
          <div style={{ padding: '36px 16px', textAlign: 'center', color: '#777782', fontSize: 13, gridColumn: '1 / -1' }}>
            No events found matching your filter.
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      <Modal open={!!selectedEvent} onClose={() => setSelectedEvent(null)} title="Event Details">
        {selectedEvent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 14 }}>
            {selectedEvent.banner?.url && (
              <img
                src={selectedEvent.banner.url}
                alt={selectedEvent.title}
                style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8 }}
              />
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, color: '#f3f3f6' }}>{selectedEvent.title}</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#8d8d97' }}>
                  Organized by <strong>{selectedEvent.organizer}</strong>
                </p>
              </div>
              <Badge tone={selectedEvent.status === 'Published' ? 'green' : selectedEvent.status === 'Pending' ? 'amber' : 'neutral'}>
                {selectedEvent.status}
              </Badge>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px 14px', fontSize: 13 }}>
              <span style={{ color: '#8d8d97' }}>Category:</span>
              <strong>{selectedEvent.category}</strong>

              <span style={{ color: '#8d8d97' }}>Date & Time:</span>
              <span>{selectedEvent.dateFormatted} {selectedEvent.time ? `at ${selectedEvent.time}` : ''}</span>

              <span style={{ color: '#8d8d97' }}>Venue / Location:</span>
              <span>{selectedEvent.location || 'On-campus'}</span>

              <span style={{ color: '#8d8d97' }}>Registrations:</span>
              <span>{selectedEvent.registrationCount || 0} registered {selectedEvent.capacity ? `/ ${selectedEvent.capacity} spots` : ''}</span>

              {selectedEvent.description && (
                <>
                  <span style={{ color: '#8d8d97' }}>Description:</span>
                  <span style={{ color: '#c4c4cc', lineHeight: 1.5 }}>{selectedEvent.description}</span>
                </>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              {selectedEvent.status === 'Pending' && (
                <>
                  <Button variant="secondary" onClick={() => { const ev = selectedEvent; setSelectedEvent(null); handleEventApproval(ev, 'reject'); }}>
                    <X size={16} /> Reject
                  </Button>
                  <Button onClick={() => { const ev = selectedEvent; setSelectedEvent(null); handleEventApproval(ev, 'approve'); }}>
                    <Check size={16} /> Approve & Publish
                  </Button>
                </>
              )}
              <Button variant="ghost" onClick={() => setSelectedEvent(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Delete Event Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteEvent}
        title={`Remove event: ${deleteTarget?.title}?`}
        message="This will permanently delete this event and remove all registered participants. This action cannot be undone."
        confirmLabel="Remove event"
        danger
      />
    </>
  )
}

export function AdminNotices() {
  const { data: raw, loading, refetch } = useApi('/notices')
  const [editing, setEditing] = useState(null)
  const [remove, setRemove] = useState(null)
  const { toast } = useToast()

  const items = (Array.isArray(raw) ? raw : raw?.items || []).map((n) => ({
    ...n,
    id: n._id,
    date: fmt(n.publishedAt || n.createdAt),
  }))

  const submit = async (e) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const payload = {
      title: f.get('title')?.toString().trim(),
      description: f.get('content')?.toString().trim(),
      category: f.get('category')?.toString(),
      important: f.get('priority') === 'Important' || f.get('priority') === 'Urgent',
      status: 'published',
    }

    try {
      if (editing) {
        await api.put(`/notices/${editing._id}`, payload)
        toast('Notice updated successfully')
      } else {
        await api.post('/notices', payload)
        toast('Notice published successfully')
      }
      setEditing(null)
      e.currentTarget.reset()
      refetch()
    } catch (err) {
      toast(err.message || 'Operation failed')
    }
  }

  const del = async () => {
    if (!remove) return
    try {
      await api.delete(`/notices/${remove._id}`)
      toast('Notice deleted')
      refetch()
    } catch (err) {
      toast(err.message || 'Delete failed')
    } finally {
      setRemove(null)
    }
  }

  if (loading && !raw) return <LoadingState />

  return (
    <>
      <PageHeader
        eyebrow="Campus communication"
        title="Notice management"
        description="Create, publish, and maintain authoritative university announcements and updates."
        actions={
          <Button onClick={() => document.getElementById('notice-title')?.focus()}>
            <Plus size={17} /> Create notice
          </Button>
        }
      />

      <div className="admin-notice-layout">
        <form className="settings-card" onSubmit={submit}>
          <h2>{editing ? 'Edit notice' : 'Create a notice'}</h2>
          <Input
            id="notice-title"
            label="Title"
            name="title"
            defaultValue={editing?.title || ''}
            key={editing?._id || 'new'}
            required
            placeholder="Official announcement title"
          />

          <div className="form-grid">
            <label className="field">
              <span>Category</span>
              <select name="category" defaultValue={editing?.category || 'Academic'}>
                <option value="Academic">Academic</option>
                <option value="General">General</option>
                <option value="Club">Club</option>
                <option value="Event">Event</option>
                <option value="Important">Important</option>
              </select>
            </label>
            <label className="field">
              <span>Priority</span>
              <select name="priority" defaultValue={editing?.important ? 'Important' : 'Normal'}>
                <option value="Normal">Normal</option>
                <option value="Important">Important</option>
                <option value="Urgent">Urgent</option>
              </select>
            </label>
          </div>

          <label className="field">
            <span>Content</span>
            <textarea
              name="content"
              defaultValue={editing?.description || ''}
              rows="6"
              required
              placeholder="Full details of this campus announcement…"
            />
          </label>

          <div style={{ display: 'flex', gap: 10 }}>
            {editing && (
              <Button variant="ghost" type="button" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            )}
            <Button type="submit">
              <Send size={17} /> {editing ? 'Update' : 'Publish'} notice
            </Button>
          </div>
        </form>

        <section>
          <div className="section-head">
            <h2>Published notices</h2>
            <span>{items.length} total</span>
          </div>
          <div className="admin-notice-list">
            {items.length > 0 ? (
              items.map((n) => (
                <article key={n.id}>
                  <div>
                    <Badge tone={n.important ? 'amber' : 'neutral'}>{n.category}</Badge>
                    <h3>{n.title}</h3>
                    <p>{n.description}</p>
                    <time>{n.date}</time>
                  </div>
                  <button onClick={() => setEditing(n)} aria-label="Edit notice" title="Edit">
                    <Pencil />
                  </button>
                  <button onClick={() => setRemove(n)} aria-label="Delete notice" title="Delete">
                    <Trash2 />
                  </button>
                </article>
              ))
            ) : (
              <div style={{ padding: '36px 0', textAlign: 'center', color: '#777782', fontSize: 13 }}>
                No announcements published yet.
              </div>
            )}
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={!!remove}
        onClose={() => setRemove(null)}
        onConfirm={del}
        title="Delete this notice?"
        message="Students will no longer be able to see this notice on their feeds."
        confirmLabel="Delete notice"
        danger
      />
    </>
  )
}

export function AdminApprovals() {
  const [tab, setTab] = useState('Clubs')
  const { toast } = useToast()
  const { data: approvalData, loading, refetch } = useApi('/admin/approvals')
  const [previewItem, setPreviewItem] = useState(null)

  const sets = {
    Clubs: (approvalData?.clubs || []).map((c) => ({
      id: c._id,
      _id: c._id,
      title: c.name,
      by: c.createdBy?.name || c.name,
      byEmail: c.createdBy?.email,
      date: fmt(c.createdAt),
      preview: c.description || 'No description provided.',
      type: 'club',
      Icon: Building2,
      category: c.category,
      accent: c.accent || '#F59E0B',
    })),
    Events: (approvalData?.events || []).map((e) => ({
      id: e._id,
      _id: e._id,
      title: e.title,
      by: e.organizer || e.club?.name || 'Club Representative',
      date: fmt(e.createdAt),
      preview: e.description || 'No description provided.',
      type: 'event',
      Icon: CalendarDays,
      category: e.category,
      location: e.location,
    })),
    Announcements: (approvalData?.notices || []).map((n) => ({
      id: n._id,
      _id: n._id,
      title: n.title,
      by: n.author?.name || 'Department Officer',
      byEmail: n.author?.email,
      date: fmt(n.createdAt),
      preview: n.description || 'No content provided.',
      type: 'notice',
      Icon: FileText,
      category: n.category,
    })),
  }

  const act = async (item, decision) => {
    try {
      await api.post(`/admin/approvals/${item._id}/${decision}`, { type: item.type })
      toast(`${item.title} has been ${decision === 'approve' ? 'approved' : 'rejected'}`)
      refetch()
    } catch (err) {
      toast(err.message || 'Action failed')
    }
  }

  if (loading && !approvalData) return <LoadingState />

  const currentList = sets[tab] || []

  return (
    <>
      <PageHeader
        eyebrow="Review queue"
        title="Pending approvals"
        description="Review and moderate club accounts, event submissions, and announcements before they appear live."
      />

      <div className="approval-tabs">
        {Object.keys(sets).map((t) => (
          <button className={tab === t ? 'active' : ''} onClick={() => setTab(t)} key={t}>
            {t}
            <span>{sets[t].length}</span>
          </button>
        ))}
      </div>

      <div className="approval-list">
        {currentList.length > 0 ? (
          currentList.map((item) => (
            <article key={item.id}>
              <span className="approval-icon">
                <item.Icon />
              </span>
              <div>
                <div>
                  <Badge tone="amber">Pending review</Badge>
                  {item.category && <Badge tone="neutral">{item.category}</Badge>}
                  <time>Submitted {item.date}</time>
                </div>
                <h2>{item.title}</h2>
                <p>{item.preview}</p>
                <small>
                  Submitted by <strong>{item.by}</strong> {item.byEmail ? `(${item.byEmail})` : ''}
                </small>
              </div>
              <div className="approval-actions">
                <Button variant="ghost" onClick={() => setPreviewItem(item)}>
                  <Eye size={17} /> View
                </Button>
                <Button variant="secondary" onClick={() => act(item, 'reject')}>
                  <X size={17} /> Reject
                </Button>
                <Button onClick={() => act(item, 'approve')}>
                  <Check size={17} /> Approve
                </Button>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <ShieldCheck size={36} />
            <h3>Queue cleared</h3>
            <p>There are no pending {tab.toLowerCase()} waiting for review.</p>
          </div>
        )}
      </div>

      {/* Submission Preview Modal */}
      <Modal open={!!previewItem} onClose={() => setPreviewItem(null)} title="Submission Preview">
        {previewItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="approval-icon" style={{ width: 40, height: 40 }}>
                <previewItem.Icon size={18} />
              </span>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, color: '#f3f3f6' }}>{previewItem.title}</h3>
                <small style={{ color: '#8d8d97' }}>
                  Type: <strong>{previewItem.type.toUpperCase()}</strong> • Submitted {previewItem.date}
                </small>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, fontSize: 13, lineHeight: 1.6, color: '#c4c4cc' }}>
              <strong style={{ color: '#f3f3f6', display: 'block', marginBottom: 6 }}>Description:</strong>
              {previewItem.preview}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#8d8d97' }}>
              <span>Submitted by: <strong style={{ color: '#f3f3f6' }}>{previewItem.by}</strong></span>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const item = previewItem
                    setPreviewItem(null)
                    act(item, 'reject')
                  }}
                >
                  <X size={16} /> Reject
                </Button>
                <Button
                  onClick={() => {
                    const item = previewItem
                    setPreviewItem(null)
                    act(item, 'approve')
                  }}
                >
                  <Check size={16} /> Approve
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

export function AdminSettings() {
  return (
    <SettingsPage
      title="Platform settings"
      sections={[
        'New registration alerts',
        'Approval queue reminders',
        'Security notifications',
        'Weekly platform report',
        'Maintenance mode',
      ]}
    />
  )
}
