const apiBase = 'http://localhost:3000';
let token = localStorage.getItem('token') || null;

function showSuccessMessage(msg, container) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.textContent = msg;
  container.insertBefore(successDiv, container.firstChild);
  setTimeout(() => successDiv.remove(), 5000);
}

function showMessage(msg) {
  const container = document.getElementById('messages');
  const el = document.createElement('div');
  el.className = 'message';
  el.innerText = msg;
  container.prepend(el);
  setTimeout(() => el.remove(), 7000);
}

// Show an inline message beneath a button
function showInlineMessage(button, text, type = 'success') {
  if (!button) return;
  let container = button.closest('.actions') || button.closest('.submission-actions');
  if (!container) {
    container = document.createElement('div');
    button.insertAdjacentElement('afterend', container);
  }
  const prev = container.querySelector('.inline-message');
  if (prev) prev.remove();
  const msg = document.createElement('div');
  msg.className = 'inline-message';
  msg.textContent = text;
  msg.style.marginTop = '8px';
  msg.style.fontWeight = '600';
  msg.style.textAlign = 'center';
  msg.style.padding = '8px';
  msg.style.borderRadius = '4px';
  if (type === 'success') {
    msg.style.color = '#065f46';
    msg.style.background = '#d1fae5';
    msg.style.border = '1px solid #10b981';
  } else {
    msg.style.color = '#dc2626';
    msg.style.background = '#fee2e2';
    msg.style.border = '1px solid #ef4444';
  }
  container.appendChild(msg);
  setTimeout(() => msg.remove(), 4000);
}

function setAuthState(tkn, role) {
  token = tkn;
  if (tkn) localStorage.setItem('token', tkn);
  else localStorage.removeItem('token');

  document.getElementById('btn-login').classList.toggle('hidden', !!tkn);
  document.getElementById('btn-register').classList.toggle('hidden', !!tkn);
  document.getElementById('btn-logout').classList.toggle('hidden', !tkn);

  const btnStudent = document.getElementById('btn-student');
  const btnTeacher = document.getElementById('btn-teacher');

  // Teachers should only see the teacher view; students only the student view.
  if (role === 'teacher') {
    btnTeacher.classList.remove('hidden');
    btnStudent.classList.add('hidden');
  } else if (role === 'student') {
    btnStudent.classList.remove('hidden');
    btnTeacher.classList.add('hidden');
  } else {
    // no role or unknown: hide both
    btnStudent.classList.add('hidden');
    btnTeacher.classList.add('hidden');
  }

  // adjust body padding so the full header is visible (handles dynamic header height)
  const header = document.querySelector('header');
  if (header) {
    document.body.style.paddingTop = header.offsetHeight + 'px';
  }
}

// Helper to display a user (partner/student) whether populated or raw id
function getUserDisplay(user) {
  if (!user) return '';
  if (typeof user === 'object') {
    return user.name || user._id || user.userId || user.id || '';
  }
  return user;
}

async function api(path, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = token;
  const res = await fetch(apiBase + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && data.error) || res.statusText);
  return data;
}

// Helper: clear all field errors in a form
function clearFieldErrors(form) {
  form.querySelectorAll('.input-error').forEach(e => e.textContent = '');
}
// Helper: set error for a specific field
function setFieldError(form, field, msg) {
  const el = form.querySelector(`[name="${field}"]`);
  if (el) {
    const err = el.parentElement.querySelector('.input-error');
    if (err) err.textContent = msg;
  }
}

// UI helpers
function hideAllPanels() { document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden')) }
function setActiveNavButton(activeId) {
  document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));
  document.getElementById(activeId).classList.add('active');
}

// Login/Register
document.getElementById('btn-login').onclick = () => {
  // Clear any existing token and reset auth state
  localStorage.removeItem('token');
  token = null;
  setAuthState(null);
  hideAllPanels();
  document.getElementById('panel-login').classList.remove('hidden');
}
document.getElementById('btn-register').onclick = () => { hideAllPanels(); document.getElementById('panel-register').classList.remove('hidden') }
document.getElementById('btn-logout').onclick = () => {
  setAuthState(null);
  hideAllPanels();
  document.getElementById('panel-login').classList.remove('hidden');
  showMessage('התנתקת בהצלחה');
}

// Auth switching buttons
document.getElementById('switch-to-register').onclick = () => { hideAllPanels(); document.getElementById('panel-register').classList.remove('hidden') }
document.getElementById('switch-to-login').onclick = () => { hideAllPanels(); document.getElementById('panel-login').classList.remove('hidden') }

// Navigation buttons (top menu)
document.getElementById('btn-student').onclick = () => {
  hideAllPanels();
  document.getElementById('panel-student').classList.remove('hidden');
  setActiveNavButton('btn-student');
  loadAssignments();
  loadMySubmissions();
}
document.getElementById('btn-teacher').onclick = () => {
  hideAllPanels();
  document.getElementById('panel-teacher').classList.remove('hidden');
  setActiveNavButton('btn-teacher');
  loadAllSubmissions();
}

const formLogin = document.getElementById('form-login');
formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFieldErrors(formLogin);
  let valid = true;
  const fd = new FormData(formLogin);
  const userId = fd.get('userId');
  const password = fd.get('password');
  if (!/^\d{9}$/.test(userId)) {
    setFieldError(formLogin, 'userId', 'יש להכניס ת"ז בת 9 ספרות');
    valid = false;
  }
  if (!password || password.length < 8) {
    setFieldError(formLogin, 'password', 'סיסמה חייבת להיות לפחות 8 תווים');
    valid = false;
  }
  if (!valid) return;
  try {
    const res = await api('/auth/login', 'POST', { userId, password });
    const role = parseRoleFromToken(res.token);
    setAuthState(res.token, role);

    // Go directly to the appropriate panel based on role
    hideAllPanels();
    if (role === 'teacher') {
      document.getElementById('panel-teacher').classList.remove('hidden');
      setActiveNavButton('btn-teacher');
      loadAllSubmissions();
    } else {
      document.getElementById('panel-student').classList.remove('hidden');
      setActiveNavButton('btn-student');
      loadAssignments();
      loadMySubmissions();
    }

    createConfetti();
    showMessage('חיבור בוצע בהצלחה!');
  } catch (err) {
    const msg = (err.message || '').toLowerCase();
    if (msg.includes('password')) {
      setFieldError(formLogin, 'password', err.message);
    } else if (msg.includes('user') || msg.includes('not found') || msg.includes('does not exist')) {
      // If user not found, guide to registration and prefill userId
      showMessage('משתמש לא נמצא במערכת. אנא הירשמי כמשתמש חדש.');
      hideAllPanels();
      document.getElementById('panel-register').classList.remove('hidden');
      const regId = document.querySelector('#form-register [name="userId"]');
      if (regId) regId.value = userId;
    } else showMessage(err.message);
  }
});

const formRegister = document.getElementById('form-register');
formRegister.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFieldErrors(formRegister);
  let valid = true;
  const fd = new FormData(formRegister);
  const userId = fd.get('userId');
  const name = fd.get('name');
  const email = fd.get('email');
  const password = fd.get('password');
  const role = fd.get('role');
  if (!/^\d{9}$/.test(userId)) {
    setFieldError(formRegister, 'userId', 'יש להכניס ת"ז בת 9 ספרות');
    valid = false;
  }
  if (!name) {
    setFieldError(formRegister, 'name', 'יש להכניס שם מלא');
    valid = false;
  }
  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    setFieldError(formRegister, 'email', 'כתובת מייל לא תקינה');
    valid = false;
  }
  if (!password || password.length < 8 || !(/[a-zA-Z]/.test(password) && /[0-9]/.test(password))) {
    setFieldError(formRegister, 'password', 'סיסמה חייבת להיות לפחות 8 תווים, לכלול אותיות וספרות');
    valid = false;
  }
  if (!role) {
    setFieldError(formRegister, 'role', 'יש לבחור תפקיד');
    valid = false;
  }
  if (!valid) return;
  try {
    const res = await api('/auth/register', 'POST', { userId, name, email, password, role });

    // Show success message in the register panel
    const registerPanel = document.getElementById('panel-register');
    createConfetti();
    showSuccessMessage('הרשמה בוצעה בהצלחה! מעביר אותך לחיבור...', registerPanel);

    // Clear the form
    formRegister.reset();

    // Auto switch to login after 2 seconds
    setTimeout(() => {
      hideAllPanels();
      document.getElementById('panel-login').classList.remove('hidden');
      // Pre-fill the userId in login form
      const loginId = document.querySelector('#form-login [name="userId"]');
      if (loginId) loginId.value = userId;
      showMessage('עכשיו ניתן להתחבר עם הפרטים שלך');
    }, 2000);
  } catch (err) {
    if (err.message.includes('password')) setFieldError(formRegister, 'password', err.message);
    else if (err.message.includes('userId')) setFieldError(formRegister, 'userId', err.message);
    else if (err.message.includes('name')) setFieldError(formRegister, 'name', err.message);
    else if (err.message.includes('email')) setFieldError(formRegister, 'email', err.message);
    else showMessage(err.message);
  }
});

function parseRoleFromToken(bearer) {
  try {
    const token = bearer.split(' ')[1];
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  } catch (e) { return null }
}

// Student flows
async function loadAssignments() {
  try {
    const list = await api('/student/assignments');
    const ul = document.getElementById('assignments-list'); ul.innerHTML = '';
    list.forEach(a => {
      const li = document.createElement('li');
      li.innerText = `${a._id || a.id} - ${a.title} (תאריך הגשה: ${a.dueDate?.split ? a.dueDate.split('T')[0] : a.dueDate})`;
      ul.appendChild(li);
    });
  } catch (e) { showMessage(e.message) }
}

const formSubmission = document.getElementById('form-submission');
formSubmission.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFieldErrors(formSubmission);
  const submitBtn = e.submitter || formSubmission.querySelector('button[type="submit"]');
  let valid = true;
  const fd = new FormData(formSubmission);
  const assignmentId = fd.get('assignmentId').trim();
  const gitHubLink = fd.get('gitHubLink');
  const partner = fd.get('partner');
  if (!assignmentId) {
    setFieldError(formSubmission, 'assignmentId', 'יש להכניס מזהה משימה');
    valid = false;
  }
  if (!gitHubLink || !/^https:\/\/(github\.com)\/.+\/.+/.test(gitHubLink)) {
    setFieldError(formSubmission, 'gitHubLink', 'יש להכניס קישור מלא ל-GitHub (https://github.com/...)');
    valid = false;
  }
  if (partner && !/^\d{9}$/.test(partner)) {
    setFieldError(formSubmission, 'partner', 'ת"ז שותף צריכה להיות 9 ספרות');
    valid = false;
  }
  if (!valid) return;
  try {
    const res = await api('/student/submissions', 'POST', { assignmentId, gitHubLink, partner });
    createConfetti();
    showSuccessWithConfetti('ההגשה נשמרה בהצלחה!', document.getElementById('messages'));
    formSubmission.reset();
    closeSubmissionModal();
    loadMySubmissions();
    loadAssignments(); // Refresh assignments to update submit buttons
  } catch (e) {
    if (e.message.includes('assignmentId')) {
      const field = formSubmission.querySelector('[name="assignmentId"]');
      showErrorWithShake(e.message, field);
    } else if (e.message.includes('gitHubLink')) {
      const field = formSubmission.querySelector('[name="gitHubLink"]');
      showErrorWithShake(e.message, field);
    } else {
      showInlineMessage(submitBtn, e.message, 'error');
    }
  }
});

async function loadMySubmissions() {
  try {
    const list = await api('/student/submissions/me');
    const ul = document.getElementById('my-submissions');
    ul.innerHTML = '';

    if (!list || list.length === 0) {
      ul.innerHTML = '<li style="color:var(--muted);text-align:center;padding:20px;">📄 אין הגשות עדיין</li>';
      return;
    }

    list.forEach(s => {
      const li = document.createElement('li');
      const assignmentTitle = s.assignmentId?.title || s.assignmentId?._id || s.assignmentId || 'לא ידוע';
      const gradeText = s.grade ? `🏆 ציון: ${s.grade}` : 'ללא ציון';
      const feedbackText = s.feedback ? `<br>💬 פידבק: ${s.feedback}` : '';

      li.innerHTML = `
        <strong>📚 ${assignmentTitle}</strong><br>
        🔗 <a href="${s.gitHubLink}" target="_blank">${s.gitHubLink}</a><br>
        ${s.partner ? `🤝 שותף: ${getUserDisplay(s.partner)}<br>` : ''}
        ${gradeText}${feedbackText}
      `;
      ul.appendChild(li);
    });
  } catch (e) {
    const ul = document.getElementById('my-submissions');
    ul.innerHTML = '<li style="color:var(--error);text-align:center;padding:20px;">שגיאה בטעינת ההגשות</li>';
  }
}

// Teacher flows
const formAssignment = document.getElementById('form-assignment');
formAssignment.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFieldErrors(formAssignment);
  const submitBtn = e.submitter || formAssignment.querySelector('button[type="submit"]');
  let valid = true;
  const fd = new FormData(formAssignment);
  const title = fd.get('title');
  const dueDate = fd.get('dueDate');
  if (!title) {
    setFieldError(formAssignment, 'title', 'יש להכניס כותרת למשימה');
    valid = false;
  }
  if (!dueDate) {
    setFieldError(formAssignment, 'dueDate', 'יש לבחור תאריך הגשה');
    valid = false;
  }
  if (!valid) return;
  try {
    await api('/teacher/assignments', 'POST', Object.fromEntries(fd.entries()));
    createConfetti();
    showInlineMessage(submitBtn, 'המשימה נוצרה בהצלחה!', 'success');

    // Clear the form after successful creation
    formAssignment.reset();

    loadAllSubmissions();
  } catch (e) {
    if (e.message.includes('title')) setFieldError(formAssignment, 'title', e.message);
    else if (e.message.includes('dueDate')) setFieldError(formAssignment, 'dueDate', e.message);
    else showInlineMessage(submitBtn, e.message, 'error');
  }
});

async function loadAllSubmissions() {
  try {
    const list = await api('/teacher/submissions');
    const container = document.getElementById('submissions-container');
    container.innerHTML = '';

    if (list.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:var(--muted);padding:20px;">📄 אין הגשות עדיין</p>';
      return;
    }

    list.forEach(s => {
      const card = document.createElement('div');
      card.className = 'submission-card';

      const studentName = s.studentId?.name || s.studentId?._id || s.studentId || 'לא ידוע';
      const assignmentTitle = s.assignmentId?.title || s.assignmentId?._id || s.assignmentId || 'לא ידוע';
      const currentGrade = s.grade || '';

      card.innerHTML = `
        <div class="submission-header">
          <div class="submission-info">
            <strong>👨‍🎓 ${studentName}</strong><br>
            <small>📚 משימה: ${assignmentTitle}</small>
          </div>
          <div class="submission-actions">
            <input type="number" class="grade-input" placeholder="ציון" min="0" max="100" value="${currentGrade}" data-submission-id="${s._id}">
            <textarea class="feedback-input" placeholder="פידבק" data-submission-id="${s._id}">${s.feedback || ''}</textarea>
            <button class="btn-update-grade" onclick="updateSubmission('${s._id}')">עדכן</button>
          </div>
        </div>
        <div>
          🔗 <a href="${s.gitHubLink}" target="_blank" class="github-link">${s.gitHubLink}</a><br>
          ${s.partner ? `🤝 שותף: ${getUserDisplay(s.partner)}<br>` : ''}
          ${s.feedback ? `<div style="margin-top:8px;padding:8px;background:#f0f9ff;border-radius:4px;border-left:3px solid var(--accent);"><strong>💬 פידבק:</strong> ${s.feedback}</div>` : ''}
        </div>
      `;

      container.appendChild(card);
    });
  } catch (e) {
    showMessage(e.message);
    document.getElementById('submissions-container').innerHTML = '<p style="text-align:center;color:var(--error);padding:20px;">שגיאה בטעינת ההגשות</p>';
  }
}

document.getElementById('btn-get-averages').onclick = async () => {
  try {
    const res = await api('/teacher/stats/averages');
    const ul = document.getElementById('averages-list'); ul.innerHTML = '';

    if (!res) {
      ul.innerHTML = '<li style="color:var(--muted)">אין נתונים להצגה</li>';
      return;
    }

    // If server returned an array of averages
    if (Array.isArray(res)) {
      res.forEach((a, i) => {
        const li = document.createElement('li');
        li.innerText = `משימה ${i + 1}: ${a}`;
        ul.appendChild(li);
      });
      return;
    }

    // If server returned an object mapping assignmentTitle -> average
    if (typeof res === 'object') {
      Object.entries(res).forEach(([title, avg]) => {
        const li = document.createElement('li');
        li.innerText = `${title}: ${Number(avg).toFixed(2)}`;
        ul.appendChild(li);
      });
      return;
    }

    ul.innerHTML = '<li style="color:var(--muted)">אין נתונים להצגה</li>';
  } catch (e) { showMessage(e.message) }
}

// Function to update submission with grade and feedback
async function updateSubmission(submissionId) {
  const gradeInput = document.querySelector(`input[data-submission-id="${submissionId}"]`);
  const feedbackInput = document.querySelector(`textarea[data-submission-id="${submissionId}"]`);
  const updateBtn = document.querySelector(`button[onclick="updateSubmission('${submissionId}')"]`);
  const grade = gradeInput.value;
  const feedback = feedbackInput.value;

  if (!grade || grade < 0 || grade > 100) {
    showInlineMessage(updateBtn, 'יש להכניס ציון בין 0 ל-100', 'error');
    return;
  }

  try {
    // Get fresh submission data from server
    const submissions = await api('/teacher/submissions');
    const submission = submissions.find(s => s._id === submissionId);

    if (!submission) {
      showInlineMessage(updateBtn, 'לא נמצאה הגשה', 'error');
      return;
    }

    console.log('Submission data:', submission); // Debug log

    let studentId, assignmentId;

    // Handle different data structures
    if (typeof submission.studentId === 'object' && submission.studentId !== null) {
      studentId = submission.studentId._id || submission.studentId.userId;
    } else {
      studentId = submission.studentId;
    }

    if (typeof submission.assignmentId === 'object' && submission.assignmentId !== null) {
      assignmentId = submission.assignmentId._id;
    } else {
      assignmentId = submission.assignmentId;
    }

    console.log('Extracted IDs:', { studentId, assignmentId }); // Debug log

    if (!studentId || !assignmentId || studentId === 'null' || assignmentId === 'null') {
      showInlineMessage(updateBtn, 'שגיאה: לא ניתן לזהות את התלמיד או המשימה', 'error');
      return;
    }

    await api(`/teacher/submissions/${studentId}/${assignmentId}`, 'PUT', {
      grade: parseInt(grade),
      feedback: feedback
    });

    createConfetti();
    showInlineMessage(updateBtn, 'ההגשה עודכנה בהצלחה!', 'success');
    loadAllSubmissions(); // Refresh the list
  } catch (e) {
    showInlineMessage(updateBtn, 'שגיאה בעדכון ההגשה: ' + e.message, 'error');
  }
}

// Make createConfetti available globally
window.createConfetti = createConfetti;

// Make updateSubmission available globally
window.updateSubmission = updateSubmission;

// initial UI state
(function init() {
  // Always show login panel on page load, regardless of token
  document.getElementById('panel-login').classList.remove('hidden');
})();
// Modal functions
function openSubmissionModal(assignmentId, title, dueDate) {
  const modal = document.getElementById('submission-modal');
  const assignmentIdInput = document.getElementById('modal-assignment-id');
  const assignmentInfo = document.getElementById('modal-assignment-info');
  
  assignmentIdInput.value = assignmentId;
  assignmentInfo.innerHTML = `
    <h4 style="margin: 0 0 8px 0; color: var(--accent);">📚 ${title}</h4>
    <p style="margin: 0; color: var(--muted);">מזהה: ${assignmentId} | תאריך הגשה: ${dueDate}</p>
  `;
  
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeSubmissionModal() {
  const modal = document.getElementById('submission-modal');
  const form = document.getElementById('form-submission');
  
  modal.classList.add('hidden');
  document.body.style.overflow = 'auto';
  form.reset();
  clearFieldErrors(form);
}

// Make functions global
window.openSubmissionModal = openSubmissionModal;
window.closeSubmissionModal = closeSubmissionModal;

// Close modal when clicking outside
document.addEventListener('click', (e) => {
  const modal = document.getElementById('submission-modal');
  if (e.target === modal) {
    closeSubmissionModal();
  }
});

// Override loadAssignments function
const originalLoadAssignments = window.loadAssignments || function() {};
window.loadAssignments = async function() {
  try {
    const list = await api('/student/assignments');
    const container = document.getElementById('assignments-cards');
    if (!container) return originalLoadAssignments();
    
    container.innerHTML = '';
    
    if (!list || list.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:var(--muted);padding:40px;">📚 אין משימות פתוחות כרגע</p>';
      return;
    }
    
    // Get submitted assignments to disable buttons
    let submittedAssignments = [];
    try {
      const submissions = await api('/student/submissions/me');
      submittedAssignments = submissions.map(s => s.assignmentId?._id || s.assignmentId);
    } catch (e) {}
    
    list.forEach(a => {
      const card = document.createElement('div');
      card.className = 'assignment-card';
      
      const dueDate = a.dueDate?.split ? a.dueDate.split('T')[0] : a.dueDate;
      const assignmentId = a._id || a.id;
      const isSubmitted = submittedAssignments.includes(assignmentId);
      
      card.innerHTML = `
        <div class="assignment-header">
          <div>
            <h4 class="assignment-title">📚 ${a.title}</h4>
            <small style="color: var(--muted);">מזהה: ${assignmentId}</small>
          </div>
          <div class="assignment-due">📅 ${dueDate}</div>
        </div>
        ${a.description ? `<div class="assignment-description">${a.description}</div>` : ''}
        <div class="assignment-actions">
          <button class="btn-submit ${isSubmitted ? 'btn-submitted' : ''}" 
                  ${isSubmitted ? 'disabled' : `onclick="openSubmissionModal('${assignmentId}', '${a.title}', '${dueDate}')"`}>
            ${isSubmitted ? '✅ הוגש' : '📤 הגש עבודה'}
          </button>
        </div>
      `;
      
      container.appendChild(card);
    });
  } catch (e) { 
    const container = document.getElementById('assignments-cards');
    if (container) {
      container.innerHTML = '<p style="text-align:center;color:var(--error);padding:40px;">שגיאה בטעינת המשימות</p>';
    }
  }
};
// Advanced Visual Effects JavaScript

// Add ripple effect to buttons
function addRippleEffect() {
  document.querySelectorAll('button').forEach(button => {
    button.classList.add('btn-ripple');
  });
}

// Create confetti animation
function createConfetti() {
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 70%, 60%)`;
    confetti.style.animationDelay = Math.random() * 3 + 's';
    confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
    document.body.appendChild(confetti);
    
    setTimeout(() => confetti.remove(), 5000);
  }
}

// Add shake animation to element
function shakeElement(element) {
  element.classList.add('shake');
  setTimeout(() => element.classList.remove('shake'), 500);
}

// Progress bar animation
function animateProgress(element, targetWidth) {
  let width = 0;
  const interval = setInterval(() => {
    if (width >= targetWidth) {
      clearInterval(interval);
    } else {
      width += 2;
      element.style.width = width + '%';
    }
  }, 20);
}

// Add floating animation to cards
function addFloatingCards() {
  document.querySelectorAll('.card').forEach((card, index) => {
    card.style.animationDelay = (index * 0.2) + 's';
    card.classList.add('floating');
  });
}

// Add glow effect to important buttons
function addGlowEffects() {
  document.querySelectorAll('.btn-submit, .actions button').forEach(btn => {
    btn.classList.add('glow');
  });
}

// Typewriter effect for titles
function typewriterEffect(element, text, speed = 100) {
  element.innerHTML = '';
  element.classList.add('typewriter');
  let i = 0;
  const timer = setInterval(() => {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
    } else {
      clearInterval(timer);
      element.classList.remove('typewriter');
    }
  }, speed);
}

// Enhanced success message with confetti
function showSuccessWithConfetti(msg, container) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message pulse';
  successDiv.textContent = msg;
  container.insertBefore(successDiv, container.firstChild);
  
  createConfetti();
  
  setTimeout(() => successDiv.remove(), 5000);
}

// Enhanced error message with shake
function showErrorWithShake(msg, element) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'input-error';
  errorDiv.textContent = msg;
  errorDiv.style.color = 'var(--error)';
  
  if (element.parentElement) {
    const existingError = element.parentElement.querySelector('.input-error');
    if (existingError) existingError.remove();
    element.parentElement.appendChild(errorDiv);
  }
  
  shakeElement(element);
}

// Initialize all effects
function initializeEffects() {
  addRippleEffect();
  addFloatingCards();
  addGlowEffects();
  
  // Add gradient text to main title
  const mainTitle = document.querySelector('header h1');
  if (mainTitle) {
    mainTitle.classList.add('gradient-text');
  }
  
  // Add morph effect to action buttons
  document.querySelectorAll('.actions button').forEach(btn => {
    btn.classList.add('btn-morph');
  });
  
  // Add bubble effect to cards
  document.querySelectorAll('.card').forEach(card => {
    card.classList.add('bubble');
  });
}

// Override existing success/error functions
const originalShowMessage = window.showMessage;
window.showMessage = function(msg) {
  const container = document.getElementById('messages');
  if (msg.includes('הצלחה') || msg.includes('בוצע')) {
    showSuccessWithConfetti(msg, container);
  } else {
    originalShowMessage(msg);
  }
};

// Initialize effects when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeEffects);

// Add progress bar to form submissions
const originalFormSubmission = document.getElementById('form-submission');
if (originalFormSubmission) {
  originalFormSubmission.addEventListener('submit', function(e) {
    const progressContainer = document.createElement('div');
    progressContainer.innerHTML = '<div class="progress-bar"><div class="progress-fill" style="width: 0%"></div></div>';
    this.appendChild(progressContainer);
    
    const progressFill = progressContainer.querySelector('.progress-fill');
    animateProgress(progressFill, 100);
    
    setTimeout(() => progressContainer.remove(), 3000);
  });
}