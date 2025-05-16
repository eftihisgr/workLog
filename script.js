// DOM Elements
const timerDisplay = document.getElementById('timer');
const timerBtn = document.getElementById('timer-btn');
const todayTime = document.getElementById('today-time');
const todayPay = document.getElementById('today-pay');
const weekTime = document.getElementById('week-time');
const weekPay = document.getElementById('week-pay');
const monthTime = document.getElementById('month-time');
const monthPay = document.getElementById('month-pay');
const historyTable = document.getElementById('history-table').getElementsByTagName('tbody')[0];
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeBtn = document.querySelector('.close');
const hourlyRateInput = document.getElementById('hourly-rate');
const saveSettingsBtn = document.getElementById('save-settings');

// State
let isRunning = false;
let startTime;
let elapsedTime = 0;
let timerInterval;
let hourlyRate = 0;
let workSessions = [];

// Initialize
function init() {
    loadData();
    updateStats();
    renderHistory();
    renderCalendar(); // Add this line
    hourlyRateInput.value = hourlyRate;
}

// Timer functions
function startTimer() {
    if (isRunning) return;
    
    isRunning = true;
    startTime = new Date().getTime() - elapsedTime;
    timerBtn.textContent = 'Stop';
    timerBtn.classList.add('running');
    
    timerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
    if (!isRunning) return;
    
    isRunning = false;
    clearInterval(timerInterval);
    timerBtn.textContent = 'Start Work';
    timerBtn.classList.remove('running');
    
    // Save the work session
    saveWorkSession();
}

function deleteWorkSession(index) {
    workSessions.splice(index, 1);
    saveData();
    updateStats();
    renderHistory();
}

function resetAllData() {
    if (confirm("Are you sure you want to reset all data? This cannot be undone.")) {
        workSessions = [];
        elapsedTime = 0;
        isRunning = false;
        clearInterval(timerInterval);
        
        // Reset timer display
        timerDisplay.textContent = '00:00:00';
        timerBtn.textContent = 'Start Work';
        timerBtn.classList.remove('running');
        
        // Save empty data and update UI
        saveData();
        updateStats();
        renderHistory();
    }
}

function updateTimer() {
    const currentTime = new Date().getTime();
    elapsedTime = currentTime - startTime;
    timerDisplay.textContent = formatTime(elapsedTime);
    
    // Update stats in real-time
    updateStats();
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function formatHours(ms) {
    return (ms / (1000 * 60 * 60)).toFixed(2);
}

// Stats functions
function updateStats() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Today's stats
    const todaySessions = workSessions.filter(session => session.date === today);
    const todayDuration = todaySessions.reduce((sum, session) => sum + session.duration, isRunning ? elapsedTime : 0);
    const todayEarnings = (todayDuration / (1000 * 60 * 60)) * hourlyRate;
    
    todayTime.textContent = `${formatHours(todayDuration)} hours`;
    todayPay.textContent = `${todayEarnings.toFixed(2)}€`;
    
    // Week stats (current week)
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekSessions = workSessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate >= weekStart;
    });
    const weekDuration = weekSessions.reduce((sum, session) => sum + session.duration, isRunning ? elapsedTime : 0);
    const weekEarnings = (weekDuration / (1000 * 60 * 60)) * hourlyRate;
    
    weekTime.textContent = `${formatHours(weekDuration)} hours`;
    weekPay.textContent = `${weekEarnings.toFixed(2)}€`;
    
    // Month stats (current month)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthSessions = workSessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate >= monthStart;
    });
    const monthDuration = monthSessions.reduce((sum, session) => sum + session.duration, isRunning ? elapsedTime : 0);
    const monthEarnings = (monthDuration / (1000 * 60 * 60)) * hourlyRate;
    
    monthTime.textContent = `${formatHours(monthDuration)} hours`;
    monthPay.textContent = `${monthEarnings.toFixed(2)}€`;
}

// Work session functions
function saveWorkSession() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    workSessions.push({
        date: today,
        duration: elapsedTime
    });
    
    elapsedTime = 0;
    timerDisplay.textContent = '00:00:00';
    
    saveData();
    updateStats();
    renderHistory();
    renderCalendar(); // Add this to update calendar highlights
}

function renderHistory() {
    historyTable.innerHTML = '';
    
    workSessions.slice().reverse().forEach((session, index) => {
        // We need to calculate the original index since we're reversing the array
        const originalIndex = workSessions.length - 1 - index;
        
        const row = historyTable.insertRow();
        const dateCell = row.insertCell(0);
        const durationCell = row.insertCell(1);
        const earningsCell = row.insertCell(2);
        const deleteCell = row.insertCell(3);
        
        dateCell.textContent = session.date;
        durationCell.textContent = `${formatHours(session.duration)} hours`;
        earningsCell.textContent = `${((session.duration / (1000 * 60 * 60)) * hourlyRate).toFixed(2)}€`;
        
        // Create delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '×'; // Using multiplication symbol which looks like an X
        deleteBtn.className = 'delete-btn';
        deleteBtn.addEventListener('click', () => deleteWorkSession(originalIndex));
        deleteCell.appendChild(deleteBtn);
    });
}

// Data persistence
function saveData() {
    const data = {
        hourlyRate,
        workSessions
    };
    localStorage.setItem('workLogData', JSON.stringify(data));
}

function loadData() {
    const savedData = localStorage.getItem('workLogData');
    if (savedData) {
        const data = JSON.parse(savedData);
        hourlyRate = data.hourlyRate || 0;
        workSessions = data.workSessions || [];
    }
}

// Event listeners
document.getElementById('reset-all').addEventListener('click', resetAllData);

timerBtn.addEventListener('click', () => {
    if (isRunning) {
        stopTimer();
    } else {
        startTimer();
    }
});

settingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'block';
});

closeBtn.addEventListener('click', () => {
    settingsModal.style.display = 'none';
});

saveSettingsBtn.addEventListener('click', () => {
    hourlyRate = parseFloat(hourlyRateInput.value) || 0;
    saveData();
    updateStats();
    renderHistory();
    settingsModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === settingsModal) {
        settingsModal.style.display = 'none';
    }
});

// Calendar functionality
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const currentMonthEl = document.getElementById('current-month');
const calendarDays = document.getElementById('calendar-days');

let currentDate = new Date();

function renderCalendar() {
  // Clear previous days
  calendarDays.innerHTML = '';
  
  // Set month/year header
  currentMonthEl.textContent = new Intl.DateTimeFormat('en-US', { 
    month: 'long', 
    year: 'numeric' 
  }).format(currentDate);
  
  // Get first day of month and total days
  const firstDay = new Date(
    currentDate.getFullYear(), 
    currentDate.getMonth(), 
    1
  ).getDay();
  
  const daysInMonth = new Date(
    currentDate.getFullYear(), 
    currentDate.getMonth() + 1, 
    0
  ).getDate();
  
  // Get today's date for highlighting
  const today = new Date();
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && 
                        currentDate.getFullYear() === today.getFullYear();
  
  // Add empty cells for days before first day of month
  for (let i = 0; i < firstDay; i++) {
    const emptyDay = document.createElement('div');
    calendarDays.appendChild(emptyDay);
  }
  
  // Add days of month
  for (let i = 1; i <= daysInMonth; i++) {
    const day = document.createElement('div');
    day.textContent = i;
    
    // Highlight today
    if (isCurrentMonth && i === today.getDate()) {
      day.classList.add('today');
    }
    
    // Format date to match your work sessions (YYYY-MM-DD)
    const workDate = `${currentDate.getFullYear()}-${(currentDate.getMonth()+1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
    const dayWorkSessions = workSessions.filter(session => session.date === workDate);
    
    // Add work-day class if there are sessions
    if (dayWorkSessions.length > 0) {
      day.classList.add('work-day');
    }
    
    // Add click handler to ALL days (not just work days)
    day.addEventListener('click', () => {
      // Remove previous selection
      document.querySelectorAll('.calendar-days div.selected').forEach(el => {
        el.classList.remove('selected');
      });
      
      // Add selection to clicked day
      day.classList.add('selected');
      
      // Show day details (will show "No work sessions" if empty)
      showDayDetails(workDate, dayWorkSessions);
    });
    
    calendarDays.appendChild(day);
  }
}

function showDayDetails(date, sessions) {
  const selectedDateEl = document.getElementById('selected-date');
  const dayWorkSessionsEl = document.getElementById('day-work-sessions');
  
  // Format date nicely (e.g., "January 15, 2023")
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  selectedDateEl.textContent = formattedDate;
  dayWorkSessionsEl.innerHTML = ''; // Clear previous sessions
  
  if (sessions.length === 0) {
    dayWorkSessionsEl.innerHTML = '<p>No work sessions recorded for this day</p>';
    return;
  }
  
  // Calculate totals for the day
  const totalDuration = sessions.reduce((sum, session) => sum + session.duration, 0);
  const totalEarnings = ((totalDuration / (1000 * 60 * 60)) * hourlyRate);
  
  // Add summary
  const summaryEl = document.createElement('div');
  summaryEl.className = 'work-session-item summary';
  summaryEl.innerHTML = `
    <strong>Total:</strong>
    <span>${formatHours(totalDuration)} hours</span>
    <span>${totalEarnings.toFixed(2)}€</span>
  `;
  dayWorkSessionsEl.appendChild(summaryEl);
  
  // Add each work session
  sessions.forEach((session, index) => {
    const sessionEl = document.createElement('div');
    sessionEl.className = 'work-session-item';
    
    const duration = formatHours(session.duration);
    const earnings = ((session.duration / (1000 * 60 * 60)) * hourlyRate.toFixed(2));
    
    sessionEl.innerHTML = `
      <span>Session ${index + 1}: ${duration} hours</span>
      <span>${earnings}€</span>
    `;
    
    dayWorkSessionsEl.appendChild(sessionEl);
  });
}

// Event listeners for month navigation
prevMonthBtn.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});

// Initialize calendar
renderCalendar();

// Initialize the app
init();