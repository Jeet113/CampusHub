import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  Check,
  ArrowRight,
  Clock,
  Compass,
  Award,
  BookOpen,
  Users,
  Target,
  AlertCircle,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react'
import { api } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import Avatar from '../common/Avatar'
import Badge from '../common/Badge'

const INTEREST_OPTIONS = [
  'Programming & Technology',
  'Robotics',
  'Business',
  'Entrepreneurship',
  'Career Development',
  'Debate & Public Speaking',
  'Photography',
  'Cultural Activities',
  'Sports',
  'Volunteering',
  'Social Work',
  'Research',
  'Design & Creativity',
  'Leadership',
]

const GOAL_OPTIONS = [
  'Learn new skills',
  'Career development',
  'Improve communication',
  'Develop leadership',
  'Meet new people',
  'Participate in competitions',
  'Work on projects',
  'Socialize',
  'Volunteer',
]

const EXPERIENCE_OPTIONS = ['Beginner', 'Intermediate', 'Experienced']

const TIME_OPTIONS = [
  '1–2 hours/week',
  '3–5 hours/week',
  '5–10 hours/week',
  '10+ hours/week',
]

export default function ClubRecommender({ onNavigateClub }) {
  const { user } = useAuth()

  // Form states
  const [selectedInterests, setSelectedInterests] = useState([])
  const [selectedGoal, setSelectedGoal] = useState('')
  const [selectedExperience, setSelectedExperience] = useState('Beginner')
  const [selectedTime, setSelectedTime] = useState('3–5 hours/week')

  // UI flow states: 'initial' | 'form' | 'loading' | 'results' | 'empty'
  const [viewState, setViewState] = useState('initial')
  const [recommendations, setRecommendations] = useState([])
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [formError, setFormError] = useState('')
  const [networkError, setNetworkError] = useState('')

  const routeBase = user?.role === 'student' ? '/student/clubs' : '/clubs'

  // Toggle interest selection
  const handleToggleInterest = (interest) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    )
    if (formError) setFormError('')
  }

  // Handle questionnaire submit
  const handleGetRecommendations = async (e) => {
    if (e) e.preventDefault()

    if (selectedInterests.length === 0) {
      setFormError('Please select at least one interest.')
      return
    }

    if (!selectedGoal) {
      setFormError('Please select your primary goal.')
      return
    }

    setFormError('')
    setNetworkError('')
    setViewState('loading')

    try {
      const response = await api.post('/ai/club-recommendations', {
        interests: selectedInterests,
        goal: selectedGoal,
        experienceLevel: selectedExperience,
        availableTime: selectedTime,
      })

      const data = response?.data || response
      const items = Array.isArray(data?.recommendations)
        ? data.recommendations
        : []

      if (items.length > 0) {
        setRecommendations(items)
        setFeedbackMessage('')
        setViewState('results')
      } else {
        setRecommendations([])
        setFeedbackMessage(
          data?.message ||
            "We couldn't find a strong match based on your current preferences. Try selecting more interests or goals.",
        )
        setViewState('empty')
      }
    } catch (err) {
      console.error('Club recommendation error:', err)
      setNetworkError(
        err?.message ||
          'Failed to retrieve club recommendations. Please try again.',
      )
      setViewState('form')
    }
  }

  const handleReset = () => {
    setFormError('')
    setNetworkError('')
    setViewState('form')
  }

  return (
    <div className="club-recommender-container">
      {/* Intro state before starting form */}
      {viewState === 'initial' && (
        <div className="recommender-hero-card">
          <div className="recommender-hero-badge">
            <Sparkles size={14} className="accent-icon" />
            <span>AI Campus Matching</span>
          </div>

          <h2>Find Clubs For Me</h2>
          <p className="recommender-hero-desc">
            Discover student organizations tailored specifically to your academic
            profile, personal goals, skills, and weekly availability.
          </p>

          <div className="recommender-hero-features">
            <div className="feature-pill">
              <Compass size={16} />
              <span>Real MongoDB Campus Clubs</span>
            </div>
            <div className="feature-pill">
              <Award size={16} />
              <span>Compatibility Match Scores</span>
            </div>
            <div className="feature-pill">
              <BookOpen size={16} />
              <span>Personalized AI Explanations</span>
            </div>
          </div>

          <div className="recommender-hero-action">
            <button
              type="button"
              className="btn btn-primary recommender-start-btn"
              onClick={() => setViewState('form')}
            >
              <Sparkles size={18} />
              <span>Find Clubs For Me</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Preference Form */}
      {viewState === 'form' && (
        <div className="recommender-card">
          <div className="recommender-card-header">
            <div className="header-title-group">
              <div className="icon-bubble">
                <Compass size={22} />
              </div>
              <div>
                <h3>Club Recommendation Preferences</h3>
                <p>Tell CampusHub AI what you are looking for in student organizations.</p>
              </div>
            </div>
          </div>

          {networkError && (
            <div className="form-error recommender-alert">
              <AlertCircle size={16} />
              <span>{networkError}</span>
            </div>
          )}

          {formError && (
            <div className="form-error recommender-alert">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleGetRecommendations} className="recommender-form">
            {/* Question 1: Interests */}
            <div className="recommender-section">
              <div className="section-label-row">
                <span className="step-number">1</span>
                <div>
                  <h4 className="section-question">What are you interested in?</h4>
                  <span className="section-hint">Select one or more topics that excite you</span>
                </div>
              </div>

              <div className="interest-chips-grid">
                {INTEREST_OPTIONS.map((interest) => {
                  const isSelected = selectedInterests.includes(interest)
                  return (
                    <button
                      type="button"
                      key={interest}
                      onClick={() => handleToggleInterest(interest)}
                      className={`interest-chip ${isSelected ? 'selected' : ''}`}
                    >
                      <span className="chip-check">
                        {isSelected ? <Check size={13} /> : '+'}
                      </span>
                      <span>{interest}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Question 2: Main Goal */}
            <div className="recommender-section">
              <div className="section-label-row">
                <span className="step-number">2</span>
                <div>
                  <h4 className="section-question">What is your main goal?</h4>
                  <span className="section-hint">Pick your primary objective for joining a club</span>
                </div>
              </div>

              <div className="goals-grid">
                {GOAL_OPTIONS.map((goal) => {
                  const isSelected = selectedGoal === goal
                  return (
                    <button
                      type="button"
                      key={goal}
                      onClick={() => {
                        setSelectedGoal(goal)
                        if (formError) setFormError('')
                      }}
                      className={`goal-card ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="goal-indicator">
                        {isSelected && <span className="indicator-dot" />}
                      </div>
                      <span className="goal-text">{goal}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Questions 3 & 4: Experience Level & Time Commitment */}
            <div className="recommender-dual-row">
              {/* Question 3: Experience */}
              <div className="recommender-section">
                <div className="section-label-row">
                  <span className="step-number">3</span>
                  <div>
                    <h4 className="section-question">Experience level:</h4>
                    <span className="section-hint">Your current familiarity with the domain</span>
                  </div>
                </div>

                <div className="experience-options-grid">
                  {EXPERIENCE_OPTIONS.map((level) => {
                    const isSelected = selectedExperience === level
                    return (
                      <button
                        type="button"
                        key={level}
                        onClick={() => setSelectedExperience(level)}
                        className={`experience-btn ${isSelected ? 'selected' : ''}`}
                      >
                        {level}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Question 4: Time Commitment */}
              <div className="recommender-section">
                <div className="section-label-row">
                  <span className="step-number">4</span>
                  <div>
                    <h4 className="section-question">How much time can you give?</h4>
                    <span className="section-hint">Estimated weekly hours for activities</span>
                  </div>
                </div>

                <div className="time-options-grid">
                  {TIME_OPTIONS.map((time) => {
                    const isSelected = selectedTime === time
                    return (
                      <button
                        type="button"
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`time-btn ${isSelected ? 'selected' : ''}`}
                      >
                        <Clock size={14} />
                        <span>{time}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Form Footer Action */}
            <div className="recommender-form-footer">
              <button
                type="submit"
                className="btn btn-primary recommender-submit-btn"
              >
                <Sparkles size={18} />
                <span>Get My Recommendations</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading State */}
      {viewState === 'loading' && (
        <div className="recommender-loading-card">
          <div className="ai-pulse-orb">
            <Sparkles size={38} className="pulse-sparkle" />
          </div>
          <h3>Calculating Best Matches...</h3>
          <p>
            CampusHub AI is comparing your interests, academic profile, and availability
            with verified campus organizations in MongoDB.
          </p>
          <div className="thinking-dots" style={{ justifyContent: 'center', marginTop: 16 }}>
            <span />
            <span />
            <span />
          </div>
        </div>
      )}

      {/* Results View */}
      {viewState === 'results' && (
        <div className="recommender-results-view">
          <div className="results-header">
            <div className="results-header-text">
              <div className="results-title-row">
                <Sparkles size={22} className="accent-icon" />
                <h2>Clubs Recommended For You</h2>
              </div>
              <p className="results-subtitle">
                Based on your interests, goals and profile
              </p>
            </div>

            <button
              type="button"
              className="btn btn-secondary recommender-edit-btn"
              onClick={handleReset}
            >
              <SlidersHorizontal size={15} />
              <span>Adjust Preferences</span>
            </button>
          </div>

          {/* User Preferences Summary Pill Bar */}
          <div className="results-summary-bar">
            <span className="summary-label">Applied Criteria:</span>
            <div className="summary-tags">
              {selectedInterests.map((interest) => (
                <span key={interest} className="summary-pill interest-pill">
                  {interest}
                </span>
              ))}
              <span className="summary-pill goal-pill">Goal: {selectedGoal}</span>
              <span className="summary-pill level-pill">{selectedExperience}</span>
              <span className="summary-pill time-pill">{selectedTime}</span>
            </div>
          </div>

          {/* Recommended Clubs List */}
          <div className="recommended-clubs-grid">
            {recommendations.map((club, index) => {
              const medal =
                index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '✨'
              const clubDetailUrl = `${routeBase}/${club.slug || club._id}`

              return (
                <article key={club._id || club.id || index} className="recommendation-card">
                  {/* Top card header */}
                  <div className="rec-card-header">
                    <div className="rec-identity">
                      <div className="rec-avatar-wrapper">
                        <Avatar
                          name={club.initials || club.name}
                          size="lg"
                          color={club.accent}
                          src={club.logo}
                        />
                        <span className="medal-badge" title={`Rank #${index + 1}`}>
                          {medal}
                        </span>
                      </div>
                      <div className="rec-title-group">
                        <div className="rec-name-row">
                          <Link to={clubDetailUrl} className="rec-club-name">
                            {club.name}
                          </Link>
                        </div>
                        <div className="rec-meta-row">
                          <Badge className="badge-amber">{club.category}</Badge>
                          {club.initials && (
                            <span className="rec-initials-tag">{club.initials}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="match-score-badge">
                      <span className="match-score-number">{club.matchScore}%</span>
                      <span className="match-score-label">Match</span>
                    </div>
                  </div>

                  {/* Match percentage meter */}
                  <div className="match-bar-track">
                    <div
                      className="match-bar-fill"
                      style={{
                        width: `${Math.min(100, Math.max(10, club.matchScore))}%`,
                      }}
                    />
                  </div>

                  {/* Personalized Reason */}
                  <div className="personalized-reason-box">
                    <p>{club.personalizedReason}</p>
                  </div>

                  {/* Why it matches */}
                  {club.matchingFactors && club.matchingFactors.length > 0 && (
                    <div className="matching-factors-block">
                      <span className="block-title">Why it matches:</span>
                      <ul className="factors-list">
                        {club.matchingFactors.map((factor, idx) => (
                          <li key={idx} className="factor-item">
                            <Check size={14} className="check-icon" />
                            <span>{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* You may gain */}
                  {club.potentialBenefits && club.potentialBenefits.length > 0 && (
                    <div className="potential-benefits-block">
                      <span className="block-title">You may gain:</span>
                      <ul className="benefits-list">
                        {club.potentialBenefits.map((benefit, idx) => (
                          <li key={idx} className="benefit-item">
                            <span className="bullet-dot">•</span>
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Card Footer with View Club button */}
                  <div className="rec-card-footer">
                    <Link
                      to={clubDetailUrl}
                      className="btn btn-primary view-club-action-btn"
                    >
                      <span>View Club</span>
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>

          <div className="recommender-footer-callout">
            <p>
              Looking to adjust your preferences?{' '}
              <button
                type="button"
                className="inline-link-btn"
                onClick={handleReset}
              >
                Change your answers to explore other club categories.
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Empty State / No strong match */}
      {viewState === 'empty' && (
        <div className="recommender-empty-card">
          <div className="empty-icon-wrap">
            <Compass size={40} />
          </div>
          <h3>No Strong Match Found</h3>
          <p className="empty-message-text">
            {feedbackMessage ||
              "We couldn't find a strong match based on your current preferences. Try selecting more interests or goals."}
          </p>

          <div className="empty-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleReset}
            >
              <RotateCcw size={16} />
              <span>Try Selecting More Interests</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
