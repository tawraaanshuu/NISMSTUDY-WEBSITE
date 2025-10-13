# 🚀 Chatbot Quick Start - 5 Minutes Setup

Get your AI chatbot running in just 5 minutes!

---

## Step 1: Add Chat Routes (1 minute)

Open your main server file (`server.js` or `app.js`) and add:

```javascript
// Add this with your other require statements
const chatRoutes = require('./routes/chat');

// Add this with your other routes
app.use('/api/chat', chatRoutes);
```

---

## Step 2: Copy Widget to Your Pages (2 minutes)

Open `chatbot-widget-snippet.html` and copy ALL the content.

Paste it into your HTML pages **before the closing `</body>` tag**.

Example:
```html
<!DOCTYPE html>
<html>
<head>
  <title>My Page</title>
</head>
<body>
  <!-- Your page content here -->
  
  <h1>Welcome to NISMSTUDY</h1>
  <p>Your content...</p>
  
  <!-- PASTE CHATBOT WIDGET HERE (before closing body tag) -->
  <div class="chat-widget">
    <!-- ... widget content ... -->
  </div>
  <link rel="stylesheet" href="/chatbot-styles.css">
  <script src="/chatbot.js"></script>
  
</body>
</html>
```

---

## Step 3: Test It! (2 minutes)

1. **Start your server:**
   ```bash
   npm start
   ```

2. **Open your website:**
   ```
   http://localhost:5000
   ```

3. **Click the chat button** (bottom-right corner)

4. **Ask a question:**
   - "What courses do you offer?"
   - "How do I register?"
   - "Do you provide mock tests?"

---

## ✅ Done!

Your chatbot is now live! 🎉

---

## 🎨 Customize (Optional)

### Change Colors

Edit `public/chatbot-styles.css`:

```css
:root {
  --primary-color: #4a90e2;  /* Change to your brand color */
}
```

### Add More FAQs

Edit `faq-data.js`:

```javascript
{
  id: 16,
  category: "Your Category",
  question: "Your question?",
  answer: "Your answer here...",
  keywords: ["keyword1", "keyword2"]
}
```

---

## 🐛 Troubleshooting

### Chat button doesn't appear?

1. Check browser console for errors (F12)
2. Verify files exist:
   - `/public/chatbot-styles.css`
   - `/public/chatbot.js`
   - `/routes/chat.js`
   - `/faq-data.js`

### Bot doesn't respond?

1. Check server logs
2. Test API directly: `http://localhost:5000/api/chat/quick-questions`
3. Verify `faq-data.js` is in project root

### Need more help?

See the full guide: `CHATBOT_INTEGRATION_GUIDE.md`

---

## 📁 File Locations

```
your-project/
├── faq-data.js                    ← FAQ database
├── routes/
│   └── chat.js                    ← Backend API
├── public/
│   ├── chatbot.html               ← Standalone test page
│   ├── chatbot.js                 ← Frontend JavaScript
│   └── chatbot-styles.css         ← Styles
└── chatbot-widget-snippet.html    ← Copy/paste widget
```

---

## 🎯 What's Next?

1. ✅ Chatbot is working
2. 📝 Customize FAQs for your needs
3. 🎨 Match your brand colors
4. 📱 Test on mobile devices
5. 🚀 Deploy to production!

---

**Enjoy your new AI chatbot! 🤖💬**



