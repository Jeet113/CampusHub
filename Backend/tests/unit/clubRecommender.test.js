import { describe, expect, it } from 'vitest'
import { calculateMatchScore } from '../../src/services/clubRecommender.service.js'

describe('Club Recommender scoring algorithm', () => {
  const mockTechClub = {
    _id: 'club_tech_1',
    name: 'IEEE Computer Society',
    category: 'Technology',
    description: 'Community for computing and programming enthusiasts.',
    mission: 'Empowering students with practical coding and software skills.',
    interests: ['Programming & Technology', 'Robotics', 'Research'],
    activities: ['Workshops', 'Coding Competitions', 'Projects', 'Hackathons'],
    skills: ['Programming', 'Problem Solving', 'Software Engineering'],
    goals: ['Learn new skills', 'Work on projects', 'Career development'],
    experienceLevel: ['Beginner', 'Intermediate', 'Experienced'],
    timeCommitment: '3–5 hours/week',
    tags: ['Programming', 'Technology', 'Coding'],
  }

  const mockCareerClub = {
    _id: 'club_career_2',
    name: 'CUET Career Club',
    category: 'Career',
    description: 'Professional networking and corporate readiness.',
    mission: 'Helping students build leadership and communication skills.',
    interests: ['Career Development', 'Leadership', 'Business'],
    activities: ['Career Seminars', 'Networking Sessions', 'Mentorship'],
    skills: ['Resume Building', 'Interviewing', 'Leadership', 'Public Speaking'],
    goals: ['Career development', 'Improve communication', 'Develop leadership'],
    experienceLevel: ['Beginner', 'Intermediate', 'Experienced'],
    timeCommitment: '1–2 hours/week',
    tags: ['Career', 'Jobs', 'Leadership'],
  }

  const mockUser = {
    name: 'Jeet Saha',
    department: 'Computer Science & Engineering',
    batch: '2026',
    role: 'student',
  }

  it('calculates high match score for tech student interested in programming', () => {
    const preferences = {
      interests: ['Programming & Technology'],
      goal: 'Work on projects',
      experienceLevel: 'Intermediate',
      availableTime: '3–5 hours/week',
    }

    const techResult = calculateMatchScore({
      club: mockTechClub,
      userProfile: mockUser,
      preferences,
    })

    const careerResult = calculateMatchScore({
      club: mockCareerClub,
      userProfile: mockUser,
      preferences,
    })

    expect(techResult.matchScore).toBeGreaterThanOrEqual(75)
    expect(techResult.interestPoints).toBeGreaterThan(0)
    expect(techResult.matchScore).toBeGreaterThan(careerResult.matchScore)
    expect(techResult.matchingFactors).toContain('Programming & Technology')
  })

  it('calculates high match score for career and leadership preferences', () => {
    const preferences = {
      interests: ['Career Development', 'Leadership'],
      goal: 'Career development',
      experienceLevel: 'Beginner',
      availableTime: '1–2 hours/week',
    }

    const careerResult = calculateMatchScore({
      club: mockCareerClub,
      userProfile: mockUser,
      preferences,
    })

    expect(careerResult.matchScore).toBeGreaterThanOrEqual(85)
    expect(careerResult.goalPoints).toBe(25) // Goal match component is 25%
    expect(careerResult.interestPoints).toBeGreaterThan(0)
  })

  it('dynamically calculates score and does not return static numbers', () => {
    const prefA = {
      interests: ['Programming & Technology'],
      goal: 'Work on projects',
      experienceLevel: 'Intermediate',
      availableTime: '3–5 hours/week',
    }

    const prefB = {
      interests: ['Programming & Technology', 'Robotics', 'Career Development'],
      goal: 'Learn new skills',
      experienceLevel: 'Beginner',
      availableTime: '10+ hours/week',
    }

    const resultA = calculateMatchScore({
      club: mockTechClub,
      userProfile: mockUser,
      preferences: prefA,
    })

    const resultB = calculateMatchScore({
      club: mockTechClub,
      userProfile: mockUser,
      preferences: prefB,
    })

    expect(resultA.matchScore).not.toBe(resultB.matchScore)
  })

  it('gives 0 interest points when user interest has no overlap with club', () => {
    const preferences = {
      interests: ['Sports'],
      goal: 'Participate in competitions',
      experienceLevel: 'Beginner',
      availableTime: '1–2 hours/week',
    }

    const careerResult = calculateMatchScore({
      club: mockCareerClub,
      userProfile: mockUser,
      preferences,
    })

    expect(careerResult.interestPoints).toBe(0)
  })
})
