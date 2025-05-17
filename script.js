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
    renderCalendar();
    renderWeeklyChart();  // New
    renderMonthlyChart(); // New
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
    
    saveWorkSession();
}

function deleteWorkSession(index) {
    workSessions.splice(index, 1);
    saveData();
    updateStats();
    renderHistory();
    renderWeeklyChart();  // New
    renderMonthlyChart(); // New
}

function resetAllData() {
    if (confirm("Are you sure you want to reset all data? This cannot be undone.")) {
        workSessions = [];
        elapsedTime = 0;
        isRunning = false;
        clearInterval(timerInterval);
        
        timerDisplay.textContent = '00:00:00';
        timerBtn.textContent = 'Start Work';
        timerBtn.classList.remove('running');
        
        saveData();
        updateStats();
        renderHistory();
        renderWeeklyChart();  // New
        renderMonthlyChart(); // New
    }
}

function updateTimer() {
    const currentTime = new Date().getTime();
    elapsedTime = currentTime - startTime;
    timerDisplay.textContent = formatTime(elapsedTime);
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
    renderCalendar();
    renderWeeklyChart();  // New
    renderMonthlyChart(); // New
}

function renderHistory() {
    historyTable.innerHTML = '';
    
    workSessions.slice().reverse().forEach((session, index) => {
        const originalIndex = workSessions.length - 1 - index;
        
        const row = historyTable.insertRow();
        const dateCell = row.insertCell(0);
        const durationCell = row.insertCell(1);
        const earningsCell = row.insertCell(2);
        const deleteCell = row.insertCell(3);
        
        dateCell.textContent = session.date;
        durationCell.textContent = `${formatHours(session.duration)} hours`;
        earningsCell.textContent = `${((session.duration / (1000 * 60 * 60)) * hourlyRate).toFixed(2)}€`;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '×';
        deleteBtn.className = 'delete-btn';
        deleteBtn.addEventListener('click', () => deleteWorkSession(originalIndex));
        deleteCell.appendChild(deleteBtn);
    });
}

// Chart.js Functions
function renderWeeklyChart() {
  const ctx = document.getElementById('weeklyChart');
  const now = new Date();
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyHours = Array(7).fill(0);
  const weeklyEarnings = Array(7).fill(0);

  workSessions.forEach(session => {
    const sessionDate = new Date(session.date);
    if (sessionDate >= weekStart) {
      const dayOfWeek = sessionDate.getDay();
      weeklyHours[dayOfWeek] += session.duration;
      weeklyEarnings[dayOfWeek] += (session.duration / (1000 * 60 * 60)) * hourlyRate;
    }
  });

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: weekDays,
      datasets: [
        {
          label: 'Hours',
          data: weeklyHours.map(ms => (ms / (1000 * 60 * 60)).toFixed(1)),
          backgroundColor: 'rgba(212, 175, 55, 0.7)',
          borderColor: 'rgba(212, 175, 55, 1)',
          borderWidth: 1
        },
        {
          label: 'Earnings (€)',
          data: weeklyEarnings.map(amt => amt.toFixed(2)),
          backgroundColor: 'rgba(76, 175, 80, 0.7)',
          borderColor: 'rgba(76, 175, 80, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Hours / Earnings' }
        }
      }
    }
  });
}

function renderMonthlyChart() {
  const ctx = document.getElementById('monthlyChart');
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  
  const monthlyHours = Array(daysInMonth).fill(0);
  const monthlyEarnings = Array(daysInMonth).fill(0);

  workSessions.forEach(session => {
    const sessionDate = new Date(session.date);
    if (sessionDate >= monthStart && sessionDate.getMonth() === now.getMonth()) {
      const dayOfMonth = sessionDate.getDate() - 1;
      monthlyHours[dayOfMonth] += session.duration;
      monthlyEarnings[dayOfMonth] += (session.duration / (1000 * 60 * 60)) * hourlyRate;
    }
  });

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array.from({length: daysInMonth}, (_, i) => i + 1),
      datasets: [
        {
          label: 'Hours',
          data: monthlyHours.map(ms => (ms / (1000 * 60 * 60)).toFixed(1)),
          borderColor: 'rgba(212, 175, 55, 1)',
          backgroundColor: 'rgba(212, 175, 55, 0.1)',
          tension: 0.3,
          fill: true
        },
        {
          label: 'Earnings (€)',
          data: monthlyEarnings.map(amt => amt.toFixed(2)),
          borderColor: 'rgba(76, 175, 80, 1)',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.3,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Hours / Earnings' }
        }
      }
    }
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

// Calendar functionality
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const currentMonthEl = document.getElementById('current-month');
const calendarDays = document.getElementById('calendar-days');
let currentDate = new Date();

function renderCalendar() {
  calendarDays.innerHTML = '';
  currentMonthEl.textContent = new Intl.DateTimeFormat('en-US', { 
    month: 'long', 
    year: 'numeric' 
  }).format(currentDate);
  
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && 
                        currentDate.getFullYear() === today.getFullYear();

  for (let i = 0; i < firstDay; i++) {
    calendarDays.appendChild(document.createElement('div'));
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const day = document.createElement('div');
    day.textContent = i;
    
    if (isCurrentMonth && i === today.getDate()) {
      day.classList.add('today');
    }
    
    const workDate = `${currentDate.getFullYear()}-${(currentDate.getMonth()+1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
    const dayWorkSessions = workSessions.filter(session => session.date === workDate);
    
    if (dayWorkSessions.length > 0) {
      day.classList.add('work-day');
    }
    
    day.addEventListener('click', () => {
      document.querySelectorAll('.calendar-days div.selected').forEach(el => {
        el.classList.remove('selected');
      });
      day.classList.add('selected');
      showDayDetails(workDate, dayWorkSessions);
    });
    
    calendarDays.appendChild(day);
  }
}

function showDayDetails(date, sessions) {
  const selectedDateEl = document.getElementById('selected-date');
  const dayWorkSessionsEl = document.getElementById('day-work-sessions');
  
  selectedDateEl.textContent = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  dayWorkSessionsEl.innerHTML = '';
  
  if (sessions.length === 0) {
    dayWorkSessionsEl.innerHTML = '<p>No work sessions recorded</p>';
    return;
  }
  
  const totalDuration = sessions.reduce((sum, session) => sum + session.duration, 0);
  const totalEarnings = ((totalDuration / (1000 * 60 * 60)) * hourlyRate);
  
  const summaryEl = document.createElement('div');
  summaryEl.className = 'work-session-item summary';
  summaryEl.innerHTML = `
    <strong>Total:</strong>
    <span>${formatHours(totalDuration)} hours</span>
    <span>${totalEarnings.toFixed(2)}€</span>
  `;
  dayWorkSessionsEl.appendChild(summaryEl);
  
  sessions.forEach((session, index) => {
    const sessionEl = document.createElement('div');
    sessionEl.className = 'work-session-item';
    const earnings = ((session.duration / (1000 * 60 * 60)) * hourlyRate.toFixed(2));
    sessionEl.innerHTML = `
      <span>Session ${index + 1}: ${formatHours(session.duration)} hours</span>
      <span>${earnings}€</span>
    `;
    dayWorkSessionsEl.appendChild(sessionEl);
  });
}

// Event Listeners
document.getElementById('reset-all').addEventListener('click', resetAllData);
timerBtn.addEventListener('click', () => isRunning ? stopTimer() : startTimer());
settingsBtn.addEventListener('click', () => settingsModal.style.display = 'block');
closeBtn.addEventListener('click', () => settingsModal.style.display = 'none');
saveSettingsBtn.addEventListener('click', () => {
  hourlyRate = parseFloat(hourlyRateInput.value) || 0;
  saveData();
  updateStats();
  renderHistory();
  renderWeeklyChart();
  renderMonthlyChart();
  settingsModal.style.display = 'none';
});
window.addEventListener('click', (e) => e.target === settingsModal && (settingsModal.style.display = 'none'));
prevMonthBtn.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});
nextMonthBtn.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});

// Initialize
init();