import React, { useState } from 'react'
import { Send, MessageSquare, Phone, Mail, Clock, CheckCircle } from 'lucide-react'

const ParentCommunication = () => {
  const [selectedRecipient, setSelectedRecipient] = useState(null)
  const [messageText, setMessageText] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 1,
      from: 'Class Teacher',
      name: 'Ms. Sharma',
      role: 'English Teacher',
      lastMessage: 'Aarav did well in the last test.',
      lastMessageTime: '2024-12-12 02:30 PM',
      unread: 0,
      conversation: [
        {
          id: 1,
          sender: 'teacher',
          text: 'Hello! I wanted to discuss Aarav\'s performance in English.',
          time: '2024-12-10 10:00 AM'
        },
        {
          id: 2,
          sender: 'parent',
          text: 'Hi Ms. Sharma! Sure, please go ahead.',
          time: '2024-12-10 02:30 PM'
        },
        {
          id: 3,
          sender: 'teacher',
          text: 'Aarav did well in the last test. He scored 88/100. Great effort!',
          time: '2024-12-12 02:30 PM'
        }
      ]
    },
    {
      id: 2,
      from: 'Principal',
      name: 'Mr. Rajesh',
      role: 'School Principal',
      lastMessage: 'Thank you for your participation in the fundraiser.',
      lastMessageTime: '2024-12-08 11:15 AM',
      unread: 0,
      conversation: [
        {
          id: 1,
          sender: 'teacher',
          text: 'Dear Parent, thank you for your participation in the school fundraiser.',
          time: '2024-12-08 11:15 AM'
        }
      ]
    },
    {
      id: 3,
      from: 'Class Teacher',
      name: 'Mr. Kumar',
      role: 'Mathematics Teacher',
      lastMessage: 'Mathematics assignment is due tomorrow.',
      lastMessageTime: '2024-12-13 03:45 PM',
      unread: 1,
      conversation: [
        {
          id: 1,
          sender: 'teacher',
          text: 'Dear Parent, please remind Aarav that the Mathematics assignment is due tomorrow.',
          time: '2024-12-13 03:45 PM'
        }
      ]
    }
  ])

  const recipients = [
    { id: 'teacher', label: 'Class Teacher', icon: '👨‍🏫' },
    { id: 'principal', label: 'Principal', icon: '👔' },
    { id: 'counselor', label: 'School Counselor', icon: '👩‍⚕️' },
    { id: 'admin', label: 'School Administration', icon: '📋' }
  ]

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedRecipient) return

    const updatedMessages = messages.map(msg => {
      if (msg.id === selectedRecipient) {
        return {
          ...msg,
          lastMessage: messageText,
          lastMessageTime: new Date().toLocaleString(),
          conversation: [
            ...msg.conversation,
            {
              id: msg.conversation.length + 1,
              sender: 'parent',
              text: messageText,
              time: new Date().toLocaleString()
            }
          ]
        }
      }
      return msg
    })

    setMessages(updatedMessages)
    setMessageText('')
  }

  const selectedMessage = messages.find(m => m.id === selectedRecipient)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Communication</h1>
        <p className="text-gray-600 mt-1">Connect with teachers and school administration</p>
      </div>

      {/* Contact Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card border-l-4 border-blue-500">
          <div className="flex items-center gap-3 mb-3">
            <Phone className="text-blue-600" size={24} />
            <h3 className="font-semibold text-gray-900">School Phone</h3>
          </div>
          <p className="text-gray-700 font-semibold">+91-11-XXXX-XXXX</p>
          <p className="text-sm text-gray-600 mt-2">Monday - Friday, 9:00 AM - 4:00 PM</p>
        </div>

        <div className="card border-l-4 border-green-500">
          <div className="flex items-center gap-3 mb-3">
            <Mail className="text-green-600" size={24} />
            <h3 className="font-semibold text-gray-900">School Email</h3>
          </div>
          <p className="text-gray-700 font-semibold">info@school.com</p>
          <p className="text-sm text-gray-600 mt-2">We respond within 24 hours</p>
        </div>
      </div>

      {/* Main Communication Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recipients List */}
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Contacts</h3>
            <div className="space-y-2">
              {messages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => setSelectedRecipient(msg.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedRecipient === msg.id
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{msg.name}</p>
                      <p className="text-xs text-gray-600">{msg.role}</p>
                    </div>
                    {msg.unread > 0 && (
                      <div className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {msg.unread}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-2 truncate">{msg.lastMessage}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        {selectedMessage ? (
          <div className="lg:col-span-2 card p-0 flex flex-col h-full min-h-[500px]">
            {/* Chat Header */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h3 className="font-bold text-gray-900">{selectedMessage.name}</h3>
              <p className="text-sm text-gray-600">{selectedMessage.role}</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedMessage.conversation.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'parent' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs p-3 rounded-lg ${
                      msg.sender === 'parent'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.sender === 'parent' ? 'text-blue-100' : 'text-gray-600'
                      }`}
                    >
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-2">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..."
                  className="form-input flex-1 resize-none"
                  rows="3"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleSendMessage()
                    }
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  className="btn btn-primary self-end"
                >
                  <Send size={20} />
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">Ctrl + Enter to send</p>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 card flex items-center justify-center min-h-[500px]">
            <div className="text-center">
              <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">Select a contact to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Request Meeting */}
      <div className="card bg-purple-50 border border-purple-200">
        <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
          <Clock size={20} />
          Request a Meeting
        </h3>
        <p className="text-sm text-purple-800 mb-4">
          Schedule a one-on-one meeting with your child's teacher or principal
        </p>
        <button className="btn bg-purple-600 hover:bg-purple-700 text-white">
          Schedule a Meeting
        </button>
      </div>

      {/* Communication Guidelines */}
      <div className="card bg-blue-50 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">Communication Guidelines</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
            <span>Be respectful and professional in all communications</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
            <span>Expect responses within 24 hours during school days</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
            <span>Use this platform for routine queries and updates</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
            <span>For emergencies, please call the school directly</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default ParentCommunication
