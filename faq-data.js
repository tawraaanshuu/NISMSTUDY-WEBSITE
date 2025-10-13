// FAQ Data for AI Chatbot - NISMSTUDY.COM
// This file contains all the FAQ data that the chatbot will use to answer questions

const faqData = [
  {
    id: 1,
    category: "General",
    question: "What is NISM?",
    answer: "NISM (National Institute of Securities Markets) is an educational initiative by SEBI (Securities and Exchange Board of India) to promote securities market education. NISM offers various certification exams for professionals in the financial services industry.",
    keywords: ["nism", "what is nism", "national institute", "sebi", "certification"]
  },
  {
    id: 2,
    category: "Courses",
    question: "What courses do you offer?",
    answer: "We offer comprehensive study materials and practice tests for all NISM certifications including: NISM Series V-A (Mutual Fund Distributors), Series VIII (Equity Derivatives), Series XV (Research Analyst), Series I (Currency Derivatives), and many more. Each course includes video lessons, PDFs, and mock tests.",
    keywords: ["courses", "what courses", "certifications", "series", "study materials"]
  },
  {
    id: 3,
    category: "Registration",
    question: "How do I register?",
    answer: "Registration is simple! Click on the 'Register' button at the top of the page, fill in your details (name, email, password), and click submit. You'll receive a confirmation and can immediately start browsing free materials. For full course access, you'll need to purchase the specific course you're interested in.",
    keywords: ["register", "sign up", "create account", "registration", "how to register"]
  },
  {
    id: 4,
    category: "Payment",
    question: "What payment methods do you accept?",
    answer: "We accept all major payment methods through Razorpay including Credit Cards, Debit Cards, Net Banking, UPI, and digital wallets. All transactions are secure and encrypted. You'll get instant access to your course after successful payment.",
    keywords: ["payment", "pay", "payment methods", "credit card", "upi", "razorpay"]
  },
  {
    id: 5,
    category: "Course Access",
    question: "How long do I have access to the course?",
    answer: "Once you purchase a course, you get lifetime access to all the materials! You can study at your own pace, revisit lessons anytime, and access all future updates to the course content at no additional cost.",
    keywords: ["access", "lifetime", "duration", "how long", "validity", "expiry"]
  },
  {
    id: 6,
    category: "Exams",
    question: "Do you provide mock tests?",
    answer: "Yes! Each course includes multiple full-length mock tests that simulate the actual NISM exam environment. Our mock tests have the same number of questions, difficulty level, and time limit as the real exam. You'll get detailed explanations for each answer to help you learn.",
    keywords: ["mock test", "practice test", "exam", "quiz", "test papers"]
  },
  {
    id: 7,
    category: "Pricing",
    question: "What are your course prices?",
    answer: "Our courses are very competitively priced, typically ranging from ₹999 to ₹2,999 depending on the certification level and content depth. We also offer combo packages at discounted rates. Check the 'Courses' section for current pricing and any ongoing offers.",
    keywords: ["price", "cost", "fees", "how much", "pricing", "charges"]
  },
  {
    id: 8,
    category: "Study Materials",
    question: "What study materials are included?",
    answer: "Each course includes comprehensive PDF study guides, video lectures, chapter-wise notes, formula sheets, important questions, previous year papers, and multiple mock tests. All materials are prepared by NISM-certified experts and are regularly updated.",
    keywords: ["materials", "study materials", "pdf", "videos", "notes", "content"]
  },
  {
    id: 9,
    category: "Technical Support",
    question: "I'm having trouble accessing my course. What should I do?",
    answer: "If you're having technical issues: 1) Make sure you're logged in with the correct email, 2) Clear your browser cache and try again, 3) Check if payment was successful, 4) Try a different browser. If problems persist, contact our support team at support@nismstudy.com with your registration email and order details.",
    keywords: ["problem", "issue", "not working", "can't access", "technical", "support", "help"]
  },
  {
    id: 10,
    category: "Exam Preparation",
    question: "How long does it take to prepare for NISM exams?",
    answer: "Preparation time varies by certification and your background. Generally, with consistent study using our materials: Series V-A takes 2-3 weeks, Series VIII takes 3-4 weeks, and Series XV takes 4-6 weeks. Our structured courses help you prepare efficiently. We recommend taking at least one mock test per week to track your progress.",
    keywords: ["preparation", "how long", "study time", "duration", "prepare"]
  },
  {
    id: 11,
    category: "Login",
    question: "I forgot my password. How can I reset it?",
    answer: "Click on the 'Forgot Password' link on the login page, enter your registered email address, and you'll receive a password reset link. If you don't receive the email within 5 minutes, check your spam folder or contact support.",
    keywords: ["forgot password", "reset password", "can't login", "password recovery"]
  },
  {
    id: 12,
    category: "Refund Policy",
    question: "What is your refund policy?",
    answer: "We offer a 7-day money-back guarantee if you're not satisfied with the course. To request a refund, email us at support@nismstudy.com with your order number and reason. Refunds are processed within 5-7 business days. Note that refunds are not available after you've completed more than 50% of the course content.",
    keywords: ["refund", "money back", "return", "guarantee", "cancel"]
  },
  {
    id: 13,
    category: "Contact",
    question: "How can I contact you?",
    answer: "You can reach us through: Email: support@nismstudy.com, Phone: +91-XXXXXXXXXX (Mon-Fri, 10 AM - 6 PM IST), or use this chat to ask questions anytime! We typically respond to emails within 24 hours on business days.",
    keywords: ["contact", "email", "phone", "reach", "support", "help"]
  },
  {
    id: 14,
    category: "Updates",
    question: "How often is course content updated?",
    answer: "We update our course content regularly to reflect any changes in NISM syllabus or exam patterns. All updates are free for existing students. We also add new mock tests and questions quarterly. You'll receive email notifications whenever major updates are released.",
    keywords: ["updates", "updated", "new content", "latest", "revision"]
  },
  {
    id: 15,
    category: "Mobile Access",
    question: "Can I access courses on mobile?",
    answer: "Yes! Our platform is fully mobile-responsive. You can access all course materials, watch videos, and take mock tests on any device - smartphone, tablet, or computer. Just log in through your mobile browser. We recommend using Chrome or Safari for the best experience.",
    keywords: ["mobile", "phone", "smartphone", "tablet", "app", "android", "ios"]
  }
];

// Helper function to find relevant FAQ based on user query
function findRelevantFAQ(query) {
  const queryLower = query.toLowerCase();
  const matches = [];

  faqData.forEach(faq => {
    let relevanceScore = 0;
    
    // Check if any keyword matches
    faq.keywords.forEach(keyword => {
      if (queryLower.includes(keyword.toLowerCase())) {
        relevanceScore += 2;
      }
    });

    // Check if question words match
    const questionWords = faq.question.toLowerCase().split(' ');
    questionWords.forEach(word => {
      if (word.length > 3 && queryLower.includes(word)) {
        relevanceScore += 1;
      }
    });

    if (relevanceScore > 0) {
      matches.push({ ...faq, relevanceScore });
    }
  });

  // Sort by relevance score (highest first)
  matches.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  return matches.slice(0, 3); // Return top 3 matches
}

// Generate AI-like response based on FAQ matches
function generateResponse(query, matches) {
  if (matches.length === 0) {
    return {
      message: "I'm not sure about that specific question. Could you please rephrase it or contact our support team at support@nismstudy.com for personalized assistance? You can also browse our FAQs section for more information.",
      faqs: [],
      suggestedQuestions: [
        "What courses do you offer?",
        "How do I register?",
        "What are the payment methods?",
        "Do you provide mock tests?"
      ]
    };
  }

  // If we have a strong match, return the primary answer
  if (matches[0].relevanceScore >= 4) {
    return {
      message: matches[0].answer,
      faqs: matches.slice(0, 3),
      relatedQuestions: matches.slice(1, 3).map(m => m.question)
    };
  }

  // If we have moderate matches, provide multiple options
  return {
    message: `I found a few relevant answers that might help you:`,
    faqs: matches.slice(0, 3),
    relatedQuestions: matches.map(m => m.question)
  };
}

module.exports = {
  faqData,
  findRelevantFAQ,
  generateResponse
};



