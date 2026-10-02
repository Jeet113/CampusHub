import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Bot,
  Send,
  Trash2,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  Calendar,
  Building2,
  User,
  PlusCircle,
  HelpCircle,
  AlertCircle,
  CornerDownLeft,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { api } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'

const SUGGESTED_QUESTIONS = [
  {
    icon: Sparkles,
    text: 'Find Clubs For Me',
    category: 'AI Match',
    action: 'recommender',
  },
  {
    icon: CompassIcon,
    text: 'What can I do on CampusHub?',
    category: 'Overview',
  },
  {
    icon: Calendar,
    text: 'Help me explore campus events',
    category: 'Events',
  },
  {
    icon: User,
    text: 'How do I update my profile?',
    category: 'Profile',
  },
  {
    icon: PlusCircle,
    text: 'How can I create an event?',
    category: 'Organizations',
  },
  {
    icon: HelpCircle,
    text: 'What features are available?',
    category: 'Features',
  },
]

function CompassIcon(props) {
  return <Building2 {...props} />
}

/**
 * CodeBlock component with copy-to-clipboard functionality
 */
function CodeBlock({ children, className, ...props }) {
  const [copied, setCopied] = useState(false)
  const codeContent = String(children || '').replace(/\n$/, '')
  const languageMatch = /language-(\w+)/.exec(className || '')
  const language = languageMatch ? languageMatch[1] : 'code'

  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // If inline code
  if (!className && !props.node?.properties?.className) {
    return <code className="ai-inline-code" {...props}>{children}</code>
  }

  return (
    <div className="ai-code-wrapper">
      <div className="ai-code-header">
        <span className="ai-code-lang">{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="ai-code-copy-btn"
          title="Copy code"
        >
          {copied ? <Check size={14} className="copied" /> : <Copy size={14} />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <pre className="ai-code-pre">
        <code className={className} {...props}>
          {codeContent}
        </code>
      </pre>
    </div>
  )
}

export default function CampusHubAI({ initialContext = null, onClear, onOpenRecommender }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUserMessage, setLastUserMessage] = useState('')

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Auto-scroll to bottom on new messages or loading state
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' })
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading, scrollToBottom])

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  const handleInputChange = (e) => {
    setInputValue(e.target.value)
    adjustTextareaHeight()
  }

  // Send message
  const sendMessage = async (messageText) => {
    const text = (messageText || inputValue).trim()
    if (!text || loading) return

    setError(null)
    setLastUserMessage(text)

    const userMessageId = `user-${Date.now()}`
    const newUserMessage = {
      id: userMessageId,
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    // Build conversation history from previous non-error messages
    const conversationHistory = messages
      .filter((m) => !m.error)
      .map((m) => ({
        role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
        content: m.content,
      }))

    setMessages((prev) => [...prev, newUserMessage])
    setInputValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    setLoading(true)

    try {
      const response = await api.post('/ai/chat', {
        message: text,
        conversationHistory,
      })

      const reply = response?.reply || response?.data?.reply || response?.message

      if (!reply) {
        throw new Error("No response was returned by CampusHub AI.")
      }

      const botMessageId = `model-${Date.now()}`
      setMessages((prev) => [
        ...prev,
        {
          id: botMessageId,
          role: 'model',
          content: reply,
          timestamp: new Date(),
        },
      ])
    } catch (err) {
      console.error('Chat error:', err)
      const friendlyError =
        err?.message?.includes('network') || err?.message?.includes('connect')
          ? "Sorry, I'm having trouble connecting right now. Please try again in a moment."
          : err?.message || "Sorry, I'm having trouble connecting right now. Please try again in a moment."

      setError(friendlyError)
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          content: friendlyError,
          timestamp: new Date(),
          error: true,
        },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleClearChat = () => {
    setMessages([])
    setError(null)
    setInputValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.focus()
    }
    if (onClear) onClear()
  }

  const handleRetry = () => {
    if (lastUserMessage) {
      // Remove last error message
      setMessages((prev) => prev.filter((m) => !m.error))
      sendMessage(lastUserMessage)
    }
  }

  const firstName = user?.name ? user.name.split(' ')[0] : 'there'

  return (
    <div className="campushub-ai-container">
      {/* Top Header */}
      <header className="campushub-ai-header">
        <div className="campushub-ai-header-info">
          <div className="campushub-ai-avatar">
            <Bot size={22} />
            <span className="online-indicator" title="AI Assistant Online" />
          </div>
          <div>
            <div className="campushub-ai-title-row">
              <h3>CampusHub AI</h3>
              <span className="campushub-ai-badge">
                <Sparkles size={11} /> Campus Assistant
              </span>
            </div>
            <p>Your intelligent guide for university events, clubs & academics</p>
          </div>
        </div>

        <div className="campushub-ai-header-actions">
          {onOpenRecommender && (
            <button
              type="button"
              className="campushub-ai-clear-btn"
              onClick={onOpenRecommender}
              title="Find Clubs For Me"
              style={{ borderColor: 'rgba(245, 158, 11, 0.3)', color: 'var(--accent)' }}
            >
              <Sparkles size={14} />
              <span>Find Clubs For Me</span>
            </button>
          )}
          {messages.length > 0 && (
            <button
              type="button"
              className="campushub-ai-clear-btn"
              onClick={handleClearChat}
              title="Clear conversation"
              aria-label="Clear chat"
            >
              <Trash2 size={15} />
              <span>Clear Chat</span>
            </button>
          )}
        </div>
      </header>

      {/* Messages Stream */}
      <div className="campushub-ai-body">
        {messages.length === 0 ? (
          <div className="campushub-ai-welcome">
            <div className="welcome-glow-icon">
              <Bot size={36} />
            </div>

            <div className="welcome-heading">
              <h2>Hi {firstName}! How can I help you today?</h2>
              <p>
                I am your CampusHub university assistant. Ask me anything about
                campus events, student clubs, official announcements, profile
                settings, or general academic productivity.
              </p>
            </div>

            <div className="welcome-prompts-section">
              <span className="prompts-label">SUGGESTED QUESTIONS</span>
              <div className="welcome-prompts-grid">
                {SUGGESTED_QUESTIONS.map((q, idx) => {
                  const Icon = q.icon
                  return (
                    <button
                      key={idx}
                      type="button"
                      className="prompt-card"
                      onClick={() => {
                        if (q.action === 'recommender' && onOpenRecommender) {
                          onOpenRecommender()
                        } else {
                          sendMessage(q.text)
                        }
                      }}
                    >
                      <div className="prompt-icon">
                        <Icon size={16} />
                      </div>
                      <div className="prompt-text">
                        <span>{q.text}</span>
                        <small>{q.category}</small>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="campushub-ai-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message ${msg.role === 'user' ? 'message-user' : 'message-ai'} ${
                  msg.error ? 'message-error' : ''
                }`}
              >
                {msg.role !== 'user' && (
                  <div className="message-avatar">
                    <Bot size={18} />
                  </div>
                )}

                <div className="message-bubble">
                  {msg.role !== 'user' ? (
                    <div className="markdown-content">
                      <ReactMarkdown
                        components={{
                          code: CodeBlock,
                          a: ({ ...props }) => (
                            <a {...props} target="_blank" rel="noopener noreferrer" />
                          ),
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="user-message-text">{msg.content}</div>
                  )}

                  {msg.error && (
                    <div className="error-actions">
                      <button
                        type="button"
                        onClick={handleRetry}
                        className="retry-btn"
                      >
                        <RotateCcw size={13} />
                        <span>Retry</span>
                      </button>
                    </div>
                  )}

                  <div className="message-timestamp">
                    {msg.timestamp
                      ? new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </div>
                </div>
              </div>
            ))}

            {/* Thinking / Typing indicator */}
            {loading && (
              <div className="chat-message message-ai">
                <div className="message-avatar">
                  <Bot size={18} />
                </div>
                <div className="message-bubble thinking-bubble">
                  <div className="thinking-row">
                    <Sparkles size={15} className="thinking-sparkle" />
                    <span>CampusHub AI is thinking...</span>
                    <div className="thinking-dots">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Box Footer */}
      <footer className="campushub-ai-footer">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            sendMessage()
          }}
          className="campushub-ai-input-form"
        >
          <div className="campushub-ai-textarea-wrapper">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask CampusHub AI about events, clubs, notices, or profile..."
              maxLength={2000}
              disabled={loading}
              className="campushub-ai-textarea"
              aria-label="Ask CampusHub AI"
            />

            <div className="campushub-ai-input-actions">
              <span className="char-count">
                {inputValue.length > 0 && `${inputValue.length}/2000`}
              </span>

              <button
                type="submit"
                disabled={!inputValue.trim() || loading}
                className="campushub-ai-send-btn"
                title="Send message (Enter)"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
          </div>

          <div className="campushub-ai-input-hint">
            <span>
              Press <kbd>Enter ↵</kbd> to send • <kbd>Shift + Enter</kbd> for new line
            </span>
            <span className="privacy-pill">
              Academic context enabled
            </span>
          </div>
        </form>
      </footer>
    </div>
  )
}
