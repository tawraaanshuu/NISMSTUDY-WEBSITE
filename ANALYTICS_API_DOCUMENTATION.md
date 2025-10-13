# 📊 Analytics API Documentation

Complete documentation for the NISMSTUDY.COM Analytics Features

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Analytics Endpoints](#analytics-endpoints)
4. [Data Models](#data-models)
5. [Usage Examples](#usage-examples)
6. [Frontend Integration](#frontend-integration)

---

## Overview

The Analytics API provides comprehensive performance tracking, personalized recommendations, and detailed insights for students taking quizzes on the NISMSTUDY.COM platform.

### Key Features

- ✅ **Performance Analytics** - Track overall and topic-wise performance
- 📈 **Trend Analysis** - Identify improving or declining performance patterns
- 💪 **Strengths & Weaknesses** - Categorize topics by proficiency level
- 🎯 **Personalized Recommendations** - Get smart suggestions for quizzes and courses
- 📊 **Peer Comparison** - Compare performance with other students
- ⏰ **Early Completion Prompts** - Encourage answer review when finishing early
- 🔍 **Detailed Attempt Analytics** - Deep dive into individual quiz attempts

---

## Authentication

All analytics endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-token-here>
```

---

## Analytics Endpoints

### 1. Get Overall Performance Analytics

Get comprehensive performance analytics across all quizzes.

**Endpoint:** `GET /api/student/analytics/performance`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "overallPerformance": {
      "totalAttempts": 15,
      "averageScore": 74,
      "passRate": 80,
      "highestScore": 92,
      "lowestScore": 56
    },
    "topicWisePerformance": [
      {
        "topic": "Mutual Funds",
        "totalQuestions": 120,
        "correctAnswers": 98,
        "incorrectAnswers": 22,
        "percentage": 82,
        "attempts": 5,
        "averagePerAttempt": 20
      }
    ],
    "strengthsAndWeaknesses": {
      "strengths": [
        {
          "topic": "Regulatory Framework",
          "percentage": 85,
          "suggestion": "Excellent! Keep maintaining your 85% performance in Regulatory Framework."
        }
      ],
      "needsImprovement": [
        {
          "topic": "Mutual Funds",
          "percentage": 72,
          "suggestion": "Good progress! Focus a bit more on Mutual Funds to push from 72% to 80%+."
        }
      ],
      "critical": [
        {
          "topic": "Derivatives",
          "percentage": 54,
          "suggestion": "Needs attention! Allocate more study time for Derivatives. Current: 54%, Target: 60%+."
        }
      ]
    },
    "recentTrend": {
      "trend": "improving",
      "message": "Great! Your recent attempts show improvement."
    }
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "No quiz attempts found yet",
  "analytics": {
    "overallPerformance": null,
    "topicWisePerformance": [],
    "strengthsAndWeaknesses": {
      "strengths": [],
      "needsImprovement": [],
      "critical": []
    },
    "recentTrend": null
  }
}
```

---

### 2. Get Course-Specific Analytics

Get analytics for a specific course.

**Endpoint:** `GET /api/student/analytics/courses/:courseId`

**Parameters:**
- `courseId` - MongoDB ObjectId of the course

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "totalQuizzesTaken": 5,
    "averageScore": 76,
    "quizProgress": [
      {
        "quizNumber": 1,
        "quizTitle": "NISM Series V-A - Mock Test 1",
        "score": 68,
        "isPassed": true,
        "timeTaken": 95,
        "attemptDate": "2025-10-11T10:00:00.000Z",
        "topicPerformance": [
          {
            "topic": "Indian Financial System",
            "total": 10,
            "correct": 8,
            "incorrect": 2,
            "percentage": 80
          }
        ]
      }
    ],
    "topicPerformance": [
      {
        "topic": "Mutual Funds",
        "percentage": 82,
        "correct": 98,
        "total": 120
      }
    ],
    "bestQuiz": {
      "quizNumber": 3,
      "quizTitle": "NISM Series V-A - Mock Test 3",
      "score": 92
    },
    "worstQuiz": {
      "quizNumber": 1,
      "quizTitle": "NISM Series V-A - Mock Test 1",
      "score": 68
    }
  }
}
```

---

### 3. Get Personalized Recommendations

Get smart recommendations for quizzes, courses, and study focus.

**Endpoint:** `GET /api/student/analytics/recommendations`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "recommendations": {
    "retakeQuizzes": [
      {
        "quiz": {
          "_id": "quiz123",
          "title": "NISM Series V-A - Mock Test 1",
          "quizNumber": 1,
          "totalQuestions": 50
        },
        "course": {
          "_id": "course123",
          "title": "NISM Series V-A",
          "category": "NISM"
        },
        "lastScore": 58,
        "attempts": 2,
        "reason": "You scored 58% - below passing. Review study materials."
      }
    ],
    "untakenQuizzes": [
      {
        "quiz": {
          "_id": "quiz456",
          "title": "NISM Series V-A - Mock Test 5",
          "quizNumber": 5,
          "totalQuestions": 50
        },
        "course": {
          "_id": "course123",
          "title": "NISM Series V-A"
        },
        "reason": "New quiz available in your purchased course"
      }
    ],
    "weakTopicFocus": [
      {
        "topic": "Derivatives",
        "currentPerformance": 54,
        "questionsAttempted": 45,
        "suggestion": "Focus on Derivatives. Current: 54%. Practice more questions on this topic."
      }
    ],
    "nextCourses": [
      {
        "course": {
          "_id": "course789",
          "title": "NISM Series X-A",
          "category": "NISM",
          "price": 2999
        },
        "reason": "Based on your performance in NISM courses"
      }
    ]
  }
}
```

---

### 4. Compare Performance with Peers

Compare student's performance with other students in the same course.

**Endpoint:** `GET /api/student/analytics/comparison/:courseId`

**Parameters:**
- `courseId` - MongoDB ObjectId of the course

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "comparison": {
    "yourAverageScore": 76,
    "classAverage": 68,
    "topScore": 95,
    "yourPercentile": 75,
    "totalStudents": 156,
    "comparison": "You're performing above average! Your score is 8% higher than the class average.",
    "ranking": "Good"
  }
}
```

**Ranking Levels:**
- `Excellent` - 90th percentile or above
- `Good` - 75th to 89th percentile
- `Average` - 50th to 74th percentile
- `Needs Improvement` - Below 50th percentile

---

### 5. Get Detailed Attempt Analytics

Get detailed analytics for a specific quiz attempt.

**Endpoint:** `GET /api/student/analytics/attempts/:attemptId`

**Parameters:**
- `attemptId` - MongoDB ObjectId of the quiz attempt

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "basicInfo": {
      "score": 76,
      "isPassed": true,
      "correctAnswers": 38,
      "wrongAnswers": 10,
      "unanswered": 2
    },
    "timeAnalysis": {
      "totalTime": 95,
      "avgTimePerQuestion": 114,
      "timeEfficiency": 79,
      "finishedEarly": false
    },
    "topicPerformance": [
      {
        "topic": "Mutual Funds",
        "total": 20,
        "correct": 16,
        "incorrect": 4,
        "percentage": 80
      }
    ],
    "difficultyPerformance": [
      {
        "level": "easy",
        "correct": 14,
        "total": 15,
        "percentage": 93
      },
      {
        "level": "medium",
        "correct": 18,
        "total": 25,
        "percentage": 72
      },
      {
        "level": "hard",
        "correct": 6,
        "total": 10,
        "percentage": 60
      }
    ],
    "suggestions": {
      "time": "Good time management!",
      "accuracy": "Good work! Review the topics where you made mistakes.",
      "overall": "Congratulations on passing! Keep up the good work."
    }
  }
}
```

---

### 6. Mark Answers as Reviewed

Mark that a student has reviewed their quiz answers.

**Endpoint:** `POST /api/student/analytics/attempts/:attemptId/reviewed`

**Parameters:**
- `attemptId` - MongoDB ObjectId of the quiz attempt

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "message": "Marked as reviewed"
}
```

---

## Data Models

### Topic Performance Object

```typescript
interface TopicPerformance {
  topic: string;
  total: number;
  correct: number;
  incorrect: number;
  percentage: number;
}
```

### Strength/Weakness Object

```typescript
interface StrengthWeakness {
  topic: string;
  percentage: number;
  suggestion: string;
}
```

### Quiz Recommendation Object

```typescript
interface QuizRecommendation {
  quiz: {
    _id: string;
    title: string;
    quizNumber: number;
    totalQuestions: number;
  };
  course: {
    _id: string;
    title: string;
    category?: string;
  };
  lastScore?: number;
  attempts?: number;
  reason: string;
}
```

### Performance Trend

```typescript
type TrendType = 'improving' | 'declining' | 'stable';

interface PerformanceTrend {
  trend: TrendType;
  message: string;
}
```

---

## Usage Examples

### JavaScript/Fetch Example

```javascript
// Get performance analytics
async function getPerformanceAnalytics() {
  const token = localStorage.getItem('token');
  
  const response = await fetch('/api/student/analytics/performance', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Average Score:', data.analytics.overallPerformance.averageScore);
    console.log('Topics:', data.analytics.topicWisePerformance);
  }
}

// Get recommendations
async function getRecommendations() {
  const token = localStorage.getItem('token');
  
  const response = await fetch('/api/student/analytics/recommendations', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Weak Topics:', data.recommendations.weakTopicFocus);
    console.log('Quizzes to Retake:', data.recommendations.retakeQuizzes);
  }
}

// Mark as reviewed
async function markReviewed(attemptId) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`/api/student/analytics/attempts/${attemptId}/reviewed`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  console.log(data.message);
}
```

### React Example

```jsx
import { useEffect, useState } from 'react';

function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadAnalytics() {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/student/analytics/performance', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.analytics);
      }
      
      setLoading(false);
    }
    
    loadAnalytics();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  if (!analytics) return <div>No data available</div>;
  
  return (
    <div>
      <h1>Your Performance</h1>
      <div className="stats">
        <div>Average Score: {analytics.overallPerformance.averageScore}%</div>
        <div>Pass Rate: {analytics.overallPerformance.passRate}%</div>
        <div>Total Attempts: {analytics.overallPerformance.totalAttempts}</div>
      </div>
      
      <h2>Topics</h2>
      {analytics.topicWisePerformance.map(topic => (
        <div key={topic.topic}>
          <strong>{topic.topic}:</strong> {topic.percentage}%
        </div>
      ))}
    </div>
  );
}
```

---

## Frontend Integration

### Early Completion Review Prompt

The system automatically detects when a student finishes a quiz more than 15 minutes before the time limit and prompts them to review their answers.

**Implementation in Quiz Submission:**

```javascript
// In submitQuiz controller response
{
  "success": true,
  "results": {
    "score": 76,
    "finishedEarly": true,
    // ... other results
  },
  "shouldReview": true,
  "reviewMessage": "You finished early! We recommend reviewing your answers before final submission."
}
```

**Frontend Usage:**

```javascript
if (response.shouldReview) {
  // Show review prompt modal
  showReviewPrompt(response.reviewMessage);
} else {
  // Show normal results
  showResults(response.results);
}
```

### Topic-Wise Performance Display

Display color-coded topic performance:

```javascript
function getTopicColor(percentage) {
  if (percentage >= 80) return '#10b981'; // Green - Excellent
  if (percentage >= 70) return '#3b82f6'; // Blue - Good
  if (percentage >= 60) return '#f59e0b'; // Orange - Average
  return '#ef4444'; // Red - Poor
}

function displayTopics(topics) {
  topics.forEach(topic => {
    const color = getTopicColor(topic.percentage);
    // Render topic with appropriate color
  });
}
```

### Recommendation Cards

Display personalized recommendations with action buttons:

```javascript
function displayRecommendations(recommendations) {
  // Retake quizzes
  recommendations.retakeQuizzes.forEach(item => {
    const card = createCard({
      title: item.quiz.title,
      badge: `Score: ${item.lastScore}%`,
      reason: item.reason,
      action: () => startQuiz(item.quiz._id)
    });
    appendToContainer(card);
  });
  
  // Weak topics
  recommendations.weakTopicFocus.forEach(topic => {
    const card = createCard({
      title: topic.topic,
      badge: `${topic.currentPerformance}%`,
      suggestion: topic.suggestion
    });
    appendToContainer(card);
  });
}
```

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "success": false,
  "message": "Error description here"
}
```

Common HTTP Status Codes:
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (course not purchased)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Best Practices

### 1. Caching

Cache analytics data on the frontend to reduce API calls:

```javascript
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

let analyticsCache = {
  data: null,
  timestamp: null
};

async function getAnalytics() {
  const now = Date.now();
  
  if (analyticsCache.data && (now - analyticsCache.timestamp) < CACHE_DURATION) {
    return analyticsCache.data;
  }
  
  const data = await fetchAnalytics();
  analyticsCache = {
    data,
    timestamp: now
  };
  
  return data;
}
```

### 2. Progressive Enhancement

Load basic analytics first, then fetch detailed data:

```javascript
async function loadAnalyticsDashboard() {
  // Load overall performance first
  const performance = await getPerformanceAnalytics();
  displayBasicStats(performance);
  
  // Then load recommendations
  const recommendations = await getRecommendations();
  displayRecommendations(recommendations);
  
  // Finally, load course-specific data
  const courseAnalytics = await getCourseAnalytics(courseId);
  displayCourseAnalytics(courseAnalytics);
}
```

### 3. Error Handling

Always handle errors gracefully:

```javascript
async function safeApiCall(endpoint) {
  try {
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    showErrorMessage('Failed to load analytics. Please try again.');
    return null;
  }
}
```

---

## Summary

The Analytics API provides comprehensive insights into student performance with:

✅ **7 API Endpoints** for different analytics needs
✅ **Topic-wise performance tracking** for detailed insights
✅ **Smart recommendations** based on historical performance
✅ **Peer comparison** for competitive motivation
✅ **Early completion prompts** to improve accuracy
✅ **Detailed attempt analytics** for deep dive analysis

For questions or issues, contact support@nismstudy.com

---

**Last Updated:** October 13, 2025  
**Version:** 1.0.0  
**API Base URL:** `/api/student/analytics`

