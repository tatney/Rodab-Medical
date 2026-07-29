import React, { useState, useRef, useEffect } from 'react'
import SEO from '../components/SEO'
import colors from '../utils/colors'

const conversations = [
  {
    id: 1,
    sender: 'Dr. Ahmad Khalil',
    role: 'Cardiologist',
    initials: 'AK',
    unread: true,
    messages: [
      {
        id: 1,
        from: 'Dr. Ahmad Khalil',
        text: 'Hello! I have reviewed your recent consultation request.',
        time: '2:15 PM',
        sent: false,
      },
      {
        id: 2,
        from: 'You',
        text: 'Thank you, Doctor. Is everything okay?',
        time: '2:18 PM',
        sent: true,
      },
      {
        id: 3,
        from: 'Dr. Ahmad Khalil',
        text: 'Your lab results are ready. Overall everything looks good, but I would like to discuss your cholesterol levels in more detail.',
        time: '2:22 PM',
        sent: false,
      },
      {
        id: 4,
        from: 'Dr. Ahmad Khalil',
        text: 'Please schedule a follow-up appointment at your earliest convenience so we can go over a few dietary recommendations.',
        time: '2:23 PM',
        sent: false,
      },
    ],
    preview: 'Your lab results are ready. Overall everything looks good...',
    timestamp: '2h ago',
  },
  {
    id: 2,
    sender: 'Dr. Sara Mansour',
    role: 'General Practitioner',
    initials: 'SM',
    unread: false,
    messages: [
      {
        id: 1,
        from: 'Dr. Sara Mansour',
        text: 'Hi there! Your prescription has been renewed and is now available for collection at the pharmacy.',
        time: 'Yesterday',
        sent: false,
      },
      {
        id: 2,
        from: 'You',
        text: 'Great, thank you! I will pick it up today.',
        time: 'Yesterday',
        sent: true,
      },
      {
        id: 3,
        from: 'Dr. Sara Mansour',
        text: 'Perfect. Remember to take it after meals as previously discussed.',
        time: 'Yesterday',
        sent: false,
      },
    ],
    preview: 'Your prescription has been renewed and is now available...',
    timestamp: '1d ago',
  },
  {
    id: 3,
    sender: 'Support Team',
    role: 'Patient Support',
    initials: 'ST',
    unread: false,
    messages: [
      {
        id: 1,
        from: 'Support Team',
        text: 'Hello! Thank you for reaching out to us regarding your billing inquiry.',
        time: '3 days ago',
        sent: false,
      },
      {
        id: 2,
        from: 'Support Team',
        text: 'Your feedback has been received and forwarded to our billing department. You will receive a detailed response within 48 hours.',
        time: '3 days ago',
        sent: false,
      },
    ],
    preview: 'Your feedback has been received and forwarded...',
    timestamp: '3d ago',
  },
]

function getInitials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConversation])

  const filteredConversations = conversations.filter(
    (c) =>
      c.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.preview.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeConversation =
    selectedConversation !== null
      ? filteredConversations.find((c) => c.id === selectedConversation)
      : null

  const handleSend = () => {
    if (!newMessage.trim() || selectedConversation === null) return
    setNewMessage('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSelectConversation = (id) => {
    setSelectedConversation(id)
    setSearchQuery('')
  }

  const showThread = !isMobile || selectedConversation !== null
  const showList = !isMobile || selectedConversation === null

  return (
    <main style={{ fontFamily: "'Barlow', sans-serif", minHeight: '100vh', backgroundColor: colors.gray50 }}>
      <SEO title="Messages" description="Secure messaging with your healthcare providers at Rodab Medical." url="/messages" />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: colors.gray900, margin: 0, fontFamily: "'Barlow', sans-serif" }}>
              Messages
            </h1>
            <p style={{ fontSize: 15, color: colors.gray500, margin: '6px 0 0', fontFamily: "'Barlow', sans-serif" }}>
              View and reply to messages from your healthcare team
            </p>
          </div>
          <button
            style={{
              padding: '12px 24px',
              backgroundColor: colors.accent,
              color: colors.white,
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'Barlow', sans-serif",
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            + New Message
          </button>
        </div>

        {/* Split Panel */}
        <div
          style={{
            display: 'flex',
            backgroundColor: colors.white,
            borderRadius: 12,
            border: `1px solid ${colors.gray200}`,
            overflow: 'hidden',
            height: isMobile ? 'calc(100vh - 240px)' : 620,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          {/* Left Panel - Conversation List */}
          {showList && (
            <div
              style={{
                width: isMobile ? '100%' : 320,
                flexShrink: 0,
                borderRight: isMobile ? 'none' : `1px solid ${colors.gray200}`,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Search Bar */}
              <div style={{ padding: '16px', borderBottom: `1px solid ${colors.gray100}` }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: colors.gray50,
                    borderRadius: 8,
                    border: `1px solid ${colors.gray200}`,
                    padding: '0 12px',
                  }}
                >
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.gray400} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    aria-label="Search conversations"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px 10px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      fontSize: 14,
                      fontFamily: "'Barlow', sans-serif",
                      outline: 'none',
                      color: colors.gray900,
                    }}
                  />
                </div>
              </div>

              {/* Conversation Items */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {filteredConversations.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: colors.gray500, fontSize: 14 }}>
                    No conversations found
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectConversation(conv.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectConversation(conv.id); } }}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: '16px',
                        cursor: 'pointer',
                        backgroundColor: selectedConversation === conv.id ? colors.gray50 : 'transparent',
                        borderBottom: `1px solid ${colors.gray100}`,
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        if (selectedConversation !== conv.id) e.currentTarget.style.backgroundColor = colors.gray50
                      }}
                      onMouseLeave={(e) => {
                        if (selectedConversation !== conv.id) e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      {/* Avatar */}
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          backgroundColor: colors.primary,
                          color: colors.white,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 15,
                          fontWeight: 700,
                          flexShrink: 0,
                          fontFamily: "'Barlow', sans-serif",
                        }}
                      >
                        {conv.initials}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: conv.unread ? 700 : 600,
                              color: colors.gray900,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {conv.sender}
                          </span>
                          <span style={{ fontSize: 12, color: colors.gray400, flexShrink: 0, marginLeft: 8 }}>
                            {conv.timestamp}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <p
                            style={{
                              fontSize: 13,
                              color: conv.unread ? colors.gray700 : colors.gray500,
                              fontWeight: conv.unread ? 500 : 400,
                              margin: 0,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              flex: 1,
                            }}
                          >
                            {conv.preview}
                          </p>
                          {conv.unread && (
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: colors.info,
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Right Panel - Message Thread */}
          {showThread && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
              }}
            >
              {activeConversation ? (
                <>
                  {/* Thread Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '16px 20px',
                      borderBottom: `1px solid ${colors.gray100}`,
                      backgroundColor: colors.white,
                    }}
                  >
                    {isMobile && (
                      <button
                        onClick={() => setSelectedConversation(null)}
                        aria-label="Back"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          color: colors.primary,
                          marginRight: 4,
                          minHeight: 44,
                          minWidth: 44,
                        }}
                      >
                        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                      </button>
                    )}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: colors.primary,
                        color: colors.white,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 700,
                        flexShrink: 0,
                        fontFamily: "'Barlow', sans-serif",
                      }}
                    >
                      {activeConversation.initials}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: colors.gray900 }}>
                        {activeConversation.sender}
                      </div>
                      <div style={{ fontSize: 12, color: colors.gray400 }}>
                        {activeConversation.role}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      backgroundColor: colors.gray50,
                    }}
                  >
                    {activeConversation.messages.map((msg) => (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          justifyContent: msg.sent ? 'flex-end' : 'flex-start',
                        }}
                      >
                        {!msg.sent && (
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              backgroundColor: colors.primaryLight,
                              color: colors.white,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 11,
                              fontWeight: 700,
                              flexShrink: 0,
                              marginRight: 8,
                              marginTop: 4,
                              fontFamily: "'Barlow', sans-serif",
                            }}
                          >
                            {activeConversation.initials}
                          </div>
                        )}
                        <div
                          style={{
                            maxWidth: '70%',
                          }}
                        >
                          <div
                            style={{
                              padding: '12px 16px',
                              borderRadius: msg.sent ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                              backgroundColor: msg.sent ? colors.primary : colors.white,
                              color: msg.sent ? colors.white : colors.gray800,
                              fontSize: 14,
                              lineHeight: 1.6,
                              border: msg.sent ? 'none' : `1px solid ${colors.gray200}`,
                              fontFamily: "'Barlow', sans-serif",
                            }}
                          >
                            {msg.text}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: colors.gray400,
                              marginTop: 4,
                              textAlign: msg.sent ? 'right' : 'left',
                              paddingLeft: msg.sent ? 0 : 4,
                              paddingRight: msg.sent ? 4 : 0,
                            }}
                          >
                            {msg.time}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div
                    style={{
                      padding: '16px 20px',
                      borderTop: `1px solid ${colors.gray100}`,
                      backgroundColor: colors.white,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Type your message..."
                      aria-label="Type your message"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        borderRadius: 8,
                        border: `1px solid ${colors.gray200}`,
                        backgroundColor: colors.gray50,
                        fontSize: 14,
                        fontFamily: "'Barlow', sans-serif",
                        color: colors.gray900,
                        transition: 'border-color 0.15s',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = colors.accent)}
                      onBlur={(e) => (e.target.style.borderColor = colors.gray200)}
                    />
                    <button
                      onClick={handleSend}
                      aria-label="Send message"
                      disabled={!newMessage.trim()}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 8,
                        backgroundColor: newMessage.trim() ? colors.accent : colors.gray200,
                        color: newMessage.trim() ? colors.white : colors.gray400,
                        border: 'none',
                        cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background-color 0.15s',
                        flexShrink: 0,
                      }}
                    >
                      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </button>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.gray400,
                  }}
                >
                  <svg aria-hidden="true" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={colors.gray300} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}>
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                  <p style={{ fontSize: 16, fontWeight: 600, margin: 0, fontFamily: "'Barlow', sans-serif" }}>
                    Select a conversation
                  </p>
                  <p style={{ fontSize: 13, margin: '6px 0 0', fontFamily: "'Barlow', sans-serif" }}>
                    Choose from your existing conversations or start a new one
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
