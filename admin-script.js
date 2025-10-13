const API_URL = 'http://localhost:5000/api';
let token = localStorage.getItem('adminToken');

// Check authentication
if (!token) {
    // For demo mode, show login form or redirect
    showLoginForm();
}

function showLoginForm() {
    document.body.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
            <div style="background: white; padding: 2rem; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.15); text-align: center; max-width: 400px;">
                <h2 style="color: #10b981; margin-bottom: 1rem;">📊 Admin Login</h2>
                <div id="loginError" style="color: red; margin-bottom: 1rem;"></div>
                <form id="quickLogin">
                    <div style="margin-bottom: 1rem;">
                        <input type="email" id="email" placeholder="Email" style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 8px;" value="admin@nismstudy.com">
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <input type="password" id="password" placeholder="Password" style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 8px;" value="Admin@123456">
                    </div>
                    <button type="submit" style="width: 100%; padding: 0.75rem; background: #10b981; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Login</button>
                </form>
                <p style="margin-top: 1rem; color: #666; font-size: 0.9rem;">Demo credentials pre-filled</p>
            </div>
        </div>
    `;
    
    document.getElementById('quickLogin').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // For demo mode, just simulate login
        if (email === 'admin@nismstudy.com' && password === 'Admin@123456') {
            localStorage.setItem('adminToken', 'demo-token');
            location.reload();
        } else {
            document.getElementById('loginError').textContent = 'Invalid credentials';
        }
    });
}

// Set authorization header for all requests
const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
};

// Load dashboard data on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadDashboardStats();
    await loadCourses();
});

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const response = await fetch(`${API_URL}/admin/stats`, { headers });
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('totalStudents').textContent = data.data.totalStudents;
            document.getElementById('totalCourses').textContent = data.data.totalCourses;
            document.getElementById('totalQuizzes').textContent = data.data.totalQuizzes;
            document.getElementById('totalMaterials').textContent = data.data.totalMaterials;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load courses for dropdowns
async function loadCourses() {
    try {
        const response = await fetch(`${API_URL}/student/courses`);
        const data = await response.json();
        
        if (data.success) {
            const options = data.data.courses.map(course => 
                `<option value="${course._id}">${course.title}</option>`
            ).join('');
            
            document.getElementById('uploadCourse').innerHTML = 
                '<option value="">Select a course</option>' + options;
            document.getElementById('quizCourse').innerHTML = 
                '<option value="">Select a course</option>' + options;
        }
    } catch (error) {
        console.error('Error loading courses:', error);
    }
}

// Tab switching
function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// File selection display
document.getElementById('pdfFile').addEventListener('change', (e) => {
    const fileName = e.target.files[0]?.name;
    document.getElementById('fileName').textContent = fileName ? `Selected: ${fileName}` : '';
});

// Upload form submission
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('course', document.getElementById('uploadCourse').value);
    formData.append('title', document.getElementById('uploadTitle').value);
    formData.append('description', document.getElementById('uploadDescription').value);
    formData.append('isFree', document.getElementById('isFree').checked);
    formData.append('file', document.getElementById('pdfFile').files[0]);
    
    try {
        const response = await fetch(`${API_URL}/admin/study-materials`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('upload-success', 'Study material uploaded successfully!');
            document.getElementById('uploadForm').reset();
            document.getElementById('fileName').textContent = '';
            await loadDashboardStats();
        } else {
            showMessage('upload-error', data.message || 'Upload failed');
        }
    } catch (error) {
        showMessage('upload-error', 'Error uploading file: ' + error.message);
    }
});

// Update question count based on quiz number
function updateQuestionCount() {
    const quizNumber = parseInt(document.getElementById('quizNumber').value);
    
    if (!quizNumber) {
        document.getElementById('questionsContainer').innerHTML = 
            '<p style="color: #666;">Select a quiz number to start adding questions</p>';
        document.getElementById('submitQuiz').style.display = 'none';
        return;
    }
    
    const questionCount = (quizNumber >= 1 && quizNumber <= 8) ? 50 : 100;
    const duration = questionCount === 50 ? '2 hours' : '3 hours';
    
    let html = `
        <h3>Add ${questionCount} Questions (Duration: ${duration})</h3>
        <p style="color: #666; margin-bottom: 1rem;">Add all ${questionCount} questions below. Each question must have 4 options with one correct answer.</p>
    `;
    
    for (let i = 1; i <= questionCount; i++) {
        html += `
            <div class="question-item">
                <h4>Question ${i}</h4>
                <div class="form-group">
                    <label>Question Text*</label>
                    <textarea id="q${i}_text" rows="2" required placeholder="Enter question text"></textarea>
                </div>
                <div class="form-group">
                    <label>Option A*</label>
                    <input type="text" id="q${i}_opt0" required placeholder="Enter option A">
                </div>
                <div class="form-group">
                    <label>Option B*</label>
                    <input type="text" id="q${i}_opt1" required placeholder="Enter option B">
                </div>
                <div class="form-group">
                    <label>Option C*</label>
                    <input type="text" id="q${i}_opt2" required placeholder="Enter option C">
                </div>
                <div class="form-group">
                    <label>Option D*</label>
                    <input type="text" id="q${i}_opt3" required placeholder="Enter option D">
                </div>
                <div class="form-group">
                    <label>Correct Answer*</label>
                    <select id="q${i}_correct" required>
                        <option value="">Select correct answer</option>
                        <option value="0">Option A</option>
                        <option value="1">Option B</option>
                        <option value="2">Option C</option>
                        <option value="3">Option D</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Explanation (optional)</label>
                    <textarea id="q${i}_explanation" rows="2" placeholder="Explain why this is the correct answer"></textarea>
                </div>
            </div>
        `;
    }
    
    document.getElementById('questionsContainer').innerHTML = html;
    document.getElementById('submitQuiz').style.display = 'block';
}

// Quiz form submission
document.getElementById('quizForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const quizNumber = parseInt(document.getElementById('quizNumber').value);
    const questionCount = (quizNumber >= 1 && quizNumber <= 8) ? 50 : 100;
    
    const questions = [];
    for (let i = 1; i <= questionCount; i++) {
        const questionText = document.getElementById(`q${i}_text`).value;
        const correctAnswer = parseInt(document.getElementById(`q${i}_correct`).value);
        
        if (!questionText || isNaN(correctAnswer)) {
            showMessage('quiz-error', `Please fill all required fields for question ${i}`);
            return;
        }
        
        questions.push({
            questionText,
            options: [
                { optionText: document.getElementById(`q${i}_opt0`).value, isCorrect: correctAnswer === 0 },
                { optionText: document.getElementById(`q${i}_opt1`).value, isCorrect: correctAnswer === 1 },
                { optionText: document.getElementById(`q${i}_opt2`).value, isCorrect: correctAnswer === 2 },
                { optionText: document.getElementById(`q${i}_opt3`).value, isCorrect: correctAnswer === 3 }
            ],
            correctAnswer,
            explanation: document.getElementById(`q${i}_explanation`).value || ''
        });
    }
    
    const quizData = {
        course: document.getElementById('quizCourse').value,
        title: document.getElementById('quizTitle').value,
        description: document.getElementById('quizDescription').value,
        quizNumber,
        questions
    };
    
    try {
        const response = await fetch(`${API_URL}/admin/quizzes`, {
            method: 'POST',
            headers,
            body: JSON.stringify(quizData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('quiz-success', 'Quiz created successfully!');
            document.getElementById('quizForm').reset();
            document.getElementById('questionsContainer').innerHTML = 
                '<p style="color: #666;">Select a quiz number to start adding questions</p>';
            document.getElementById('submitQuiz').style.display = 'none';
            await loadDashboardStats();
        } else {
            showMessage('quiz-error', data.message || 'Quiz creation failed');
        }
    } catch (error) {
        showMessage('quiz-error', 'Error creating quiz: ' + error.message);
    }
});

// Show message helper
function showMessage(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.display = 'block';
    
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

// Logout
function logout() {
    localStorage.removeItem('adminToken');
    window.location.href = '/';
}

