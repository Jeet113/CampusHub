import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import mongoose from 'mongoose'
import request from 'supertest'
import { createApp } from '../../src/app.js'
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js'
import User from '../../src/models/User.js'

const runIntegration = process.env.RUN_INTEGRATION_TESTS === 'true'
const suite = runIntegration ? describe : describe.skip

suite('CampusHub API integration', () => {
  const app = createApp()
  const studentAgent = request.agent(app)
  const clubAgent = request.agent(app)
  let adminToken
  let studentToken
  let clubToken
  let clubId
  let eventId

  beforeAll(async () => {
    await connectDatabase()
    const databaseName = mongoose.connection.name
    if (!/test/i.test(databaseName)) throw new Error(`Refusing to run destructive integration tests against ${databaseName}`)
    await mongoose.connection.db.dropDatabase()
    await User.create({
      name: 'Test Administrator',
      email: 'admin@integration.test',
      password: 'AdminPass123',
      studentId: 'TEST-ADMIN',
      department: 'Administration',
      role: 'admin',
    })
    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@integration.test',
      password: 'AdminPass123',
    })
    adminToken = login.body.data.accessToken
  })

  afterAll(async () => {
    if (mongoose.connection.readyState === 1 && /test/i.test(mongoose.connection.name)) {
      await mongoose.connection.db.dropDatabase()
    }
    await disconnectDatabase()
  })

  it('registers, authenticates, refreshes, protects, and logs out a student', async () => {
    const registration = await studentAgent.post('/api/v1/auth/register').send({
      name: 'Integration Student',
      email: 'student@integration.test',
      password: 'StudentPass123',
      role: 'student',
      studentId: 'TEST-STUDENT-1',
      department: 'CSE',
      batch: '2026',
    })
    expect(registration.status).toBe(201)
    expect(registration.body.data.user.password).toBeUndefined()
    studentToken = registration.body.data.accessToken

    const duplicate = await request(app).post('/api/v1/auth/register').send({
      name: 'Duplicate Student',
      email: 'student@integration.test',
      password: 'StudentPass123',
      role: 'student',
      studentId: 'TEST-STUDENT-2',
      department: 'CSE',
    })
    expect(duplicate.status).toBe(409)

    const wrongPassword = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student@integration.test', password: 'wrong' })
    expect(wrongPassword.status).toBe(401)

    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${studentToken}`)
    expect(me.status).toBe(200)
    expect(me.body.data.role).toBe('student')

    const refresh = await studentAgent.post('/api/v1/auth/refresh').send({})
    expect(refresh.status).toBe(200)
    studentToken = refresh.body.data.accessToken

    const logout = await studentAgent.post('/api/v1/auth/logout').send({})
    expect(logout.status).toBe(200)
  })

  it('creates a moderated club account and enforces admin-only approval', async () => {
    const registration = await clubAgent.post('/api/v1/auth/register').send({
      name: 'Integration Club Owner',
      email: 'club@integration.test',
      password: 'ClubPass123',
      role: 'club',
      organizationId: 'TEST-CLUB-1',
      organizationName: 'Integration Engineering Club',
      initials: 'IEC',
      category: 'Technology',
      description: 'A test organization used only by the backend integration suite.',
      department: 'Registered Organizations',
    })
    expect(registration.status).toBe(201)
    expect(registration.body.data.club.status).toBe('pending')
    clubToken = registration.body.data.accessToken
    clubId = registration.body.data.club._id

    const forbidden = await request(app)
      .post(`/api/v1/admin/approvals/${clubId}/approve`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ type: 'club' })
    expect(forbidden.status).toBe(403)

    const approval = await request(app)
      .post(`/api/v1/admin/approvals/${clubId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'club' })
    expect(approval.status).toBe(200)
    expect(approval.body.data.status).toBe('approved')
  })

  it('handles membership requests and owner approval', async () => {
    const join = await request(app)
      .post(`/api/v1/clubs/${clubId}/join`)
      .set('Authorization', `Bearer ${studentToken}`)
    expect(join.status).toBe(201)

    const duplicate = await request(app)
      .post(`/api/v1/clubs/${clubId}/join`)
      .set('Authorization', `Bearer ${studentToken}`)
    expect(duplicate.status).toBe(409)

    const members = await request(app)
      .get(`/api/v1/clubs/${clubId}/members?status=pending`)
      .set('Authorization', `Bearer ${clubToken}`)
    expect(members.status).toBe(200)
    const membershipId = members.body.data[0]._id

    const approval = await request(app)
      .patch(`/api/v1/clubs/${clubId}/members/${membershipId}`)
      .set('Authorization', `Bearer ${clubToken}`)
      .send({ status: 'approved', role: 'member' })
    expect(approval.body.data.status).toBe('approved')
  })

  it('moderates events and enforces duplicate registration and capacity', async () => {
    const created = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${clubToken}`)
      .send({
        title: 'Integration Capacity Event',
        description: 'A complete event description for backend integration testing.',
        category: 'Technology',
        date: '2030-01-10',
        startTime: '10:00',
        endTime: '12:00',
        location: 'Test Auditorium',
        capacity: 1,
      })
    expect(created.status).toBe(201)
    expect(created.body.data.registrationCount).toBe(0)
    eventId = created.body.data._id

    const hidden = await request(app).get(`/api/v1/events/${eventId}`)
    expect(hidden.status).toBe(404)

    const approval = await request(app)
      .post(`/api/v1/admin/approvals/${eventId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'event' })
    expect(approval.body.data.status).toBe('published')

    const first = await request(app)
      .post(`/api/v1/events/${eventId}/register`)
      .set('Authorization', `Bearer ${studentToken}`)
    expect(first.status).toBe(201)

    const duplicate = await request(app)
      .post(`/api/v1/events/${eventId}/register`)
      .set('Authorization', `Bearer ${studentToken}`)
    expect(duplicate.status).toBe(409)

    const cancellation = await request(app)
      .delete(`/api/v1/events/${eventId}/register`)
      .set('Authorization', `Bearer ${studentToken}`)
    expect(cancellation.status).toBe(200)

    const again = await request(app)
      .post(`/api/v1/events/${eventId}/register`)
      .set('Authorization', `Bearer ${studentToken}`)
    expect(again.status).toBe(201)
  })

  it('enforces ownership and supports notices, search, metrics, and suspension', async () => {
    const secondClub = await request(app).post('/api/v1/auth/register').send({
      name: 'Second Club Owner',
      email: 'club-two@integration.test',
      password: 'ClubPass123',
      role: 'club',
      organizationId: 'TEST-CLUB-2',
      organizationName: 'Second Integration Club',
      initials: 'SIC',
      category: 'Cultural',
      description: 'A separate club account used to verify resource ownership checks.',
      department: 'Registered Organizations',
    })
    const secondClubToken = secondClub.body.data.accessToken
    const ownership = await request(app)
      .put(`/api/v1/events/${eventId}`)
      .set('Authorization', `Bearer ${secondClubToken}`)
      .send({ title: 'Unauthorized Event Rename' })
    expect(ownership.status).toBe(403)

    const notice = await request(app)
      .post('/api/v1/notices')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Integration academic notice',
        description: 'This notice verifies the complete administrative notice workflow.',
        category: 'Academic',
        important: true,
      })
    expect(notice.status).toBe(201)
    expect(notice.body.data.status).toBe('published')

    const search = await request(app).get('/api/v1/search?q=Integration')
    expect(search.status).toBe(200)
    expect(search.body.data.events.length).toBeGreaterThan(0)
    expect(search.body.data.notices.length).toBeGreaterThan(0)

    const metrics = await request(app).get('/api/v1/admin/metrics').set('Authorization', `Bearer ${adminToken}`)
    expect(metrics.status).toBe(200)
    expect(metrics.body.data.users).toBeGreaterThanOrEqual(4)

    const student = await User.findOne({ email: 'student@integration.test' })
    const suspension = await request(app)
      .patch(`/api/v1/admin/users/${student._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'suspended' })
    expect(suspension.status).toBe(200)

    const protectedRequest = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${studentToken}`)
    expect(protectedRequest.status).toBe(403)
  })
})
