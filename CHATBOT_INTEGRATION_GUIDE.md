# 🤖 AI Chatbot Integration Guide

## Overview

This guide will help you integrate the AI-powered FAQ chatbot into your NISMSTUDY.COM website. The chatbot can intelligently answer questions based on your FAQ data and provides a modern, user-friendly interface.

---

## 📁 Files Created

1. **`faq-data.js`** - FAQ database and matching logic
2. **`routes/chat.js`** - Backend API routes for chat
3. **`public/chatbot.html`** - Standalone chatbot page (for testing)
4. **`public/chatbot.js`** - Chatbot frontend JavaScript
5. **`chatbot-widget.html`** - Widget snippet for integration

---

## 🚀 Quick Start

### Step 1: Install Dependencies (if needed)

No additional dependencies required! The chatbot uses vanilla JavaScript and your existing Express setup.

### Step 2: Add Chat Routes to Server

Add the chat routes to your main server file (e.g., `server.js` or `app.js`):

```javascript
// Add this near your other route imports
const chatRoutes = require('./routes/chat');

// Add this after your other route definitions
app.use('/api/chat', chatRoutes);
```

### Step 3: Test the Chatbot

1. Start your server: `npm start`
2. Open: `http://localhost:5000/chatbot.html`
3. Click the chat button and ask a question!

### Step 4: Integrate into Your Website

Add the following snippet to **any page** where you want the chatbot to appear (usually in the footer or before closing `</body>` tag):

```html
<!-- AI Chatbot Widget -->
<div id="ai-chatbot-widget"></div>
<link rel="stylesheet" href="/chatbot-styles.css">
<script src="/chatbot.js"></script>
```

---

## 🔧 Integration Methods

### Method 1: Widget on All Pages (Recommended)

Add to your main layout file or template that's used across all pages:

```html
<!DOCTYPE html>
<html>
<head>
  <title>NISMSTUDY - Your Course Page</title>
  <!-- Your existing head content -->
</head>
<body>
  <!-- Your page content -->
  
  <!-- AI Chatbot Widget - Add before closing body tag -->
  <div class="chat-widget">
    <button class="chat-button" id="chatButton" aria-label="Open chat">
      <svg class="icon-chat" viewBox="0 0 24 24">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        <path d="M7 9h10v2H7zm0-3h10v2H7zm0 6h7v2H7z"/>
      </svg>
      <svg class="icon-close" viewBox="0 0 24 24">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </button>

    <div class="chat-window" id="chatWindow">
      <div class="chat-header">
        <div class="chat-header-avatar">🤖</div>
        <div class="chat-header-info">
          <h3>NISM Study Assistant</h3>
          <p><span class="chat-header-status"></span>Online - We reply instantly</p>
        </div>
      </div>

      <div class="quick-questions" id="quickQuestions">
        <button class="quick-question-btn" data-question="What courses do you offer?">📚 Courses</button>
        <button class="quick-question-btn" data-question="How do I register?">✍️ Register</button>
        <button class="quick-question-btn" data-question="What payment methods do you accept?">💳 Payment</button>
        <button class="quick-question-btn" data-question="Do you provide mock tests?">📝 Mock Tests</button>
      </div>

      <div class="chat-messages" id="chatMessages">
        <div class="welcome-message">
          <h4>👋 Welcome to NISMSTUDY!</h4>
          <p>Hi! I'm your AI assistant. Ask me anything about NISM certifications.</p>
        </div>
      </div>

      <div class="chat-input">
        <input type="text" id="chatInput" placeholder="Type your question here..." autocomplete="off"/>
        <button id="sendButton" aria-label="Send message">
          <svg viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>

  <link rel="stylesheet" href="/chatbot-styles.css">
  <script src="/chatbot.js"></script>
</body>
</html>
```

### Method 2: Include as External Component

Create a reusable component file `chatbot-widget.html` and include it:

```html
<!-- In your main pages -->
<script>
  fetch('/chatbot-widget.html')
    .then(response => response.text())
    .then(html => {
      document.body.insertAdjacentHTML('beforeend', html);
      const script = document.createElement('script');
      script.src = '/chatbot.js';
      document.body.appendChild(script);
    });
</script>
```

---

## 🎨 Customization

### Change Colors

Edit the CSS variables in the chatbot styles:

```css
:root {
  --primary-color: #4a90e2;        /* Your brand color */
  --secondary-color: #f0f4f8;      /* Background color */
  --bot-message-bg: #e8f4fd;       /* Bot message background */
  --user-message-bg: #4a90e2;      /* User message background */
}
```

### Customize Welcome Message

Edit in `chatbot.js`:

```javascript
showWelcomeMessage() {
  setTimeout(() => {
    this.addBotMessage(
      "Your custom welcome message here! 👋",
      []
    );
  }, 1000);
}
```

### Add/Edit FAQs

Edit `faq-data.js`:

```javascript
{
  id: 16,
  category: "Your Category",
  question: "Your question?",
  answer: "Your detailed answer here...",
  keywords: ["keyword1", "keyword2", "phrase"]
}
```

---

## 🔌 API Endpoints

### POST `/api/chat`

Send a message and get AI response.

**Request:**
```json
{
  "message": "What courses do you offer?",
  "sessionId": "optional_session_id"
}
```

**Response:**
```json
{
  "success": true,
  "response": {
    "message": "We offer comprehensive study materials for...",
    "faqs": [...],
    "relatedQuestions": [...],
    "timestamp": "2025-10-11T..."
  }
}
```

### GET `/api/chat/quick-questions`

Get popular quick questions for the UI.

**Response:**
```json
{
  "success": true,
  "questions": [
    {
      "id": 1,
      "text": "What courses do you offer?",
      "category": "Courses"
    }
  ]
}
```

### GET `/api/chat/history/:sessionId`

Get chat history for a session.

**Response:**
```json
{
  "success": true,
  "messages": [...]
}
```

---

## 🎯 Features

### ✅ Implemented Features

- ✅ **Floating chat widget** - Modern, non-intrusive design
- ✅ **FAQ-based AI responses** - Intelligent question matching
- ✅ **Quick question buttons** - One-click common questions
- ✅ **Related questions** - Suggests relevant follow-ups
- ✅ **Typing indicator** - Shows when bot is "thinking"
- ✅ **Session management** - Maintains conversation context
- ✅ **Mobile responsive** - Works on all devices
- ✅ **Notification badge** - Alerts when chat is closed
- ✅ **Smooth animations** - Professional UX
- ✅ **XSS protection** - Secure message handling

### 🚀 Future Enhancements (Optional)

- 🔄 Connect to OpenAI/GPT for advanced responses
- 💾 Store chat history in database
- 📧 Email transcript feature
- 🌍 Multi-language support
- 📊 Analytics and tracking
- 👥 Live agent handoff
- 🔔 Web push notifications
- 🎨 Multiple themes

---

## 🔗 Integrating with OpenAI (Optional)

If you want to use OpenAI's GPT instead of the FAQ matching:

### Step 1: Install OpenAI SDK

```bash
npm install openai
```

### Step 2: Update `routes/chat.js`

```javascript
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// In your POST route:
const completion = await openai.createChatCompletion({
  model: "gpt-3.5-turbo",
  messages: [
    {
      role: "system",
      content: "You are a helpful assistant for NISMSTUDY.COM, an education platform for NISM certifications. Answer questions about courses, registration, payments, and exams."
    },
    {
      role: "user",
      content: message
    }
  ],
});

const aiResponse = completion.data.choices[0].message.content;
```

### Step 3: Add to `.env`

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

---

## 🧪 Testing

### Test Checklist

- [ ] Chat button appears on page
- [ ] Chat window opens/closes smoothly
- [ ] Quick questions work
- [ ] Can send custom messages
- [ ] Bot responds appropriately
- [ ] Related questions are clickable
- [ ] Works on mobile devices
- [ ] Notification badge appears
- [ ] API endpoints respond correctly

### Test Questions to Try

1. "What courses do you offer?"
2. "How do I register?"
3. "What payment methods do you accept?"
4. "Do you provide mock tests?"
5. "How long is course access?"
6. "What is your refund policy?"
7. "I forgot my password"
8. "Can I access on mobile?"

---

## 🐛 Troubleshooting

### Chatbot doesn't appear

**Check:**
1. JavaScript file is loaded: Check browser console
2. CSS file is loaded: Check network tab
3. No JavaScript errors: Check console for errors

### Bot doesn't respond

**Check:**
1. API endpoint is registered in server
2. `faq-data.js` is in correct location
3. Server is running: Check `http://localhost:5000/api/chat/quick-questions`
4. Check browser console for API errors

### Styling issues

**Check:**
1. CSS file path is correct
2. No CSS conflicts with existing styles
3. Check z-index if widget is hidden behind other elements

---

## 📱 Mobile Considerations

The chatbot is fully responsive and automatically:
- Goes full-screen on mobile devices
- Adjusts button size for touch
- Optimizes scrolling behavior
- Hides notification when appropriate

No additional configuration needed!

---

## 🎨 Example Integration Snippet

Copy and paste this complete snippet into any HTML page:

```html
<!-- Place this right before closing </body> tag -->
<div class="chat-widget">
  <button class="chat-button" id="chatButton" aria-label="Open chat">
    <svg class="icon-chat" viewBox="0 0 24 24">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
      <path d="M7 9h10v2H7zm0-3h10v2H7zm0 6h7v2H7z"/>
    </svg>
    <svg class="icon-close" viewBox="0 0 24 24">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
  </button>
  <div class="chat-window" id="chatWindow">
    <!-- Chat content here - see chatbot.html for full markup -->
  </div>
</div>
<link rel="stylesheet" href="/chatbot-styles.css">
<script src="/chatbot.js"></script>
```

---

## 🚀 Going Live

### Before Production:

1. **Review FAQs**: Update `faq-data.js` with your actual FAQs
2. **Test thoroughly**: Try all features on different devices
3. **Customize colors**: Match your brand colors
4. **Update contact info**: Change support email in responses
5. **Add analytics**: Track chatbot usage (optional)
6. **Security**: Ensure rate limiting is enabled
7. **Performance**: Test with multiple concurrent users

---

## 📊 Analytics (Optional)

Track chatbot usage by adding:

```javascript
// In chatbot.js, add after successful message send:
if (typeof gtag !== 'undefined') {
  gtag('event', 'chatbot_message', {
    'event_category': 'Chatbot',
    'event_label': text
  });
}
```

---

## 🎯 Success!

Your AI chatbot is now ready to help your users 24/7! 

**What you have:**
- ✅ Intelligent FAQ-based responses
- ✅ Modern, professional UI
- ✅ Mobile-responsive design
- ✅ Easy customization
- ✅ Scalable architecture

**Next steps:**
1. Add chatbot to your main pages
2. Customize FAQs and branding
3. Test with real users
4. Collect feedback and improve

---

## 📞 Support

If you need help:
- Check the troubleshooting section above
- Review browser console for errors
- Test API endpoints directly
- Verify file paths are correct

**Happy chatting! 🤖💬**



