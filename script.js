// ZenDo Task Manager
const tasks = [];
const skipCounts = new Map(); // key: task id, value: skip count
let selectedTaskIndex = null;
let projects = [];

const taskForm = document.getElementById('task-form');
const taskNameInput = document.getElementById('task-name');
const taskProjectSelect = document.getElementById('task-project');
const addProjectBtn = document.getElementById('add-project-btn');
const addProjectModal = document.getElementById('add-project-modal');
const newProjectInput = document.getElementById('new-project-input');
const saveProjectBtn = document.getElementById('save-project-btn');
const cancelProjectBtn = document.getElementById('cancel-project-btn');
const taskDurationInput = document.getElementById('task-duration');
const taskHardnessInput = document.getElementById('task-hardness');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');
const getTaskBtn = document.getElementById('get-task-btn');
const selectedTaskContainer = document.getElementById('selected-task-container');
const selectedTaskDetails = document.getElementById('selected-task-details');
const doneBtn = document.getElementById('done-btn');
const skipBtn = document.getElementById('skip-btn');
const doneMessage = document.getElementById('done-message');
const skipMessage = document.getElementById('skip-message');
const filterProject = document.getElementById('filter-project');
const filterDurationMin = document.getElementById('filter-duration-min');
const filterDurationMax = document.getElementById('filter-duration-max');

// Landing page flow
const introSection = document.getElementById('intro-section');
const appSection = document.getElementById('app-section');
const getStartedBtn = document.getElementById('get-started-btn');
const taskModal = document.getElementById('task-modal');
const closeModalBtn = document.getElementById('close-modal-btn');

// ROULETTE WHEEL LOGIC
const rouletteWheel = document.getElementById('roulette-wheel');
const spinBtn = document.getElementById('spin-btn');
let rouletteAngle = 0;
let spinning = false;

function drawRouletteWheel(tasks, highlightIndex = null) {
  const ctx = rouletteWheel.getContext('2d');
  ctx.clearRect(0, 0, rouletteWheel.width, rouletteWheel.height);
  const cx = rouletteWheel.width / 2;
  const cy = rouletteWheel.height / 2;
  const radius = Math.min(cx, cy) - 10;
  const n = tasks.length;
  if (n === 0) {
    ctx.save();
    ctx.font = 'bold 1.2rem Quicksand, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e53935';
    ctx.fillText('No tasks', cx, cy);
    ctx.restore();
    return;
  }
  const colors = ['#7EE787', '#5AC8FA', '#fff176', '#FF6B6B', '#FFD166', '#43a047'];
  for (let i = 0; i < n; i++) {
    const angleStart = rouletteAngle + (i * 2 * Math.PI / n);
    const angleEnd = rouletteAngle + ((i + 1) * 2 * Math.PI / n);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, angleStart, angleEnd);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.globalAlpha = (highlightIndex === i) ? 0.85 : 1;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angleStart + (angleEnd - angleStart) / 2);
    ctx.textAlign = 'right';
    ctx.font = 'bold 1rem Quicksand, Arial, sans-serif';
    ctx.fillStyle = '#222';
    ctx.save();
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 4;
    ctx.fillText(tasks[i].name, radius - 12, 6);
    ctx.restore();
    ctx.restore();
  }
}

function updateRoulette() {
  const filtered = getFilteredTasks();
  drawRouletteWheel(filtered);
}

// Add pointer above the wheel
const rouletteContainer = document.getElementById('roulette-container');
if (rouletteContainer && !document.querySelector('.roulette-pointer')) {
  const pointer = document.createElement('div');
  pointer.className = 'roulette-pointer';
  rouletteContainer.insertBefore(pointer, rouletteWheel);
}

// Redraw wheel on task/filter changes
['filter-project','filter-duration-min','filter-duration-max'].forEach(id => {
  document.getElementById(id).addEventListener('input', updateRoulette);
});

// Redraw on task add/remove
const origRenderTaskList = renderTaskList;
renderTaskList = function() {
  origRenderTaskList.apply(this, arguments);
  updateRoulette();
};

// Initial draw
updateRoulette();

function updateProjectDropdowns() {
  // Clear and repopulate both project selects
  taskProjectSelect.innerHTML = '<option value="" disabled selected>Select Project</option>';
  filterProject.innerHTML = '<option value="">All Projects</option>';
  projects.forEach(p => {
    const opt1 = document.createElement('option');
    opt1.value = p;
    opt1.textContent = p;
    taskProjectSelect.appendChild(opt1);
    const opt2 = document.createElement('option');
    opt2.value = p;
    opt2.textContent = p;
    filterProject.appendChild(opt2);
  });
}

function showAddProjectModal() {
  addProjectModal.classList.remove('hidden');
  newProjectInput.value = '';
  newProjectInput.focus();
}
function hideAddProjectModal() {
  addProjectModal.classList.add('hidden');
}
addProjectBtn.addEventListener('click', showAddProjectModal);
saveProjectBtn.addEventListener('click', () => {
  const val = newProjectInput.value.trim();
  if (val && !projects.includes(val)) {
    projects.push(val);
    updateProjectDropdowns();
    taskProjectSelect.value = val;
    filterProject.value = '';
  }
  hideAddProjectModal();
});
cancelProjectBtn.addEventListener('click', hideAddProjectModal);
newProjectInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    saveProjectBtn.click();
  } else if (e.key === 'Escape') {
    hideAddProjectModal();
  }
});

taskForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const name = taskNameInput.value.trim();
  const project = taskProjectSelect.value;
  const duration = taskDurationInput.value.trim();
  const hardness = taskHardnessInput.value;
  if (!name || !project || !duration || !hardness) return;
  // Parse duration as integer minutes
  const durationMin = Math.max(1, parseInt(duration, 10));
  const id = `${name}__${project}__${durationMin}__${hardness}`;
  tasks.push({ id, name, project, duration: durationMin, durationMin, hardness });
  renderTaskList();
  taskForm.reset();
  taskNameInput.focus();
});

function parseDurationToMinutes(str) {
  // Accepts '30 min', '1 hour', '15 minutes', '45', '2h', '1.5h', etc.
  str = str.trim().toLowerCase();
  if (/^\d+$/.test(str)) return parseInt(str, 10);
  if (str.includes('hour')) {
    const match = str.match(/([\d.]+)/);
    return match ? Math.round(parseFloat(match[1]) * 60) : 60;
  }
  if (str.includes('h')) {
    const match = str.match(/([\d.]+)h/);
    return match ? Math.round(parseFloat(match[1]) * 60) : 60;
  }
  const match = str.match(/([\d.]+)/);
  return match ? Math.round(parseFloat(match[1])) : 30;
}

function renderTaskList() {
  taskList.innerHTML = '';
  tasks.forEach((task, idx) => {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.innerHTML = `
      <div><strong>${task.name}</strong></div>
      <div class="task-meta">
        <span>Project: ${task.project}</span>
        <span>Duration: ${task.duration}</span>
        <span>Hardness: ${task.hardness}</span>
      </div>
    `;
    taskList.appendChild(li);
  });
}

function getFilteredTasks() {
  let filtered = tasks;
  const proj = filterProject.value;
  let min = parseInt(filterDurationMin.value, 10);
  let max = parseInt(filterDurationMax.value, 10);
  if (proj) filtered = filtered.filter(t => t.project === proj);
  if (!isNaN(min)) filtered = filtered.filter(t => t.durationMin >= min);
  if (!isNaN(max)) filtered = filtered.filter(t => t.durationMin <= max);
  return filtered;
}

// --- Navigation Logic ---
const navLinks = document.querySelectorAll('.nav-link');
const sections = {
  home: document.getElementById('home-section'),
  tasks: document.getElementById('tasks-section'),
  roulette: document.getElementById('roulette-section'),
  profile: document.getElementById('profile-section'),
};
function showSection(section) {
  Object.values(sections).forEach(sec => sec.classList.remove('active'));
  Object.keys(sections).forEach(key => {
    if (key === section) sections[key].classList.add('active');
  });
  navLinks.forEach(link => link.classList.remove('active'));
  const navId = 'nav-' + section;
  const nav = document.getElementById(navId);
  if (nav) nav.classList.add('active');
}
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const href = link.getAttribute('href');
    if (href.startsWith('#')) {
      const section = href.replace('#', '');
      showSection(section);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
});
document.getElementById('get-started-btn').addEventListener('click', () => {
  showSection('tasks');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
// Show home by default
showSection('home');

// --- Fullscreen Alarm Overlay Logic ---
const rewardAlarmOverlay = document.getElementById('reward-alarm-overlay');
function showAlarmOverlay() {
  rewardAlarmOverlay.classList.remove('hidden');
}
function hideAlarmOverlay() {
  rewardAlarmOverlay.classList.add('hidden');
}
rewardAlarmOverlay.addEventListener('click', hideAlarmOverlay);

function showTaskModal() {
  taskModal.classList.remove('hidden');
}
function hideTaskModal() {
  taskModal.classList.add('hidden');
  selectedTaskDetails.innerHTML = '';
  skipMessage.classList.add('hidden');
  doneMessage.classList.add('hidden');
  selectedTaskIndex = null;
}
closeModalBtn.addEventListener('click', hideTaskModal);

spinBtn.addEventListener('click', function() {
  if (spinning) return;
  const filtered = getFilteredTasks();
  if (filtered.length === 0) {
    drawRouletteWheel(filtered);
    return;
  }
  spinning = true;
  spinBtn.disabled = true;
  let spins = 8 + Math.floor(Math.random() * 3); // 8-10 full spins
  const n = filtered.length;
  const winnerIdx = Math.floor(Math.random() * n);
  const anglePer = 2 * Math.PI / n;
  const stopAngle = (3 * Math.PI / 2) - (winnerIdx * anglePer) - anglePer / 2; // pointer at top
  const startAngle = rouletteAngle % (2 * Math.PI);
  const totalAngle = (2 * Math.PI) * spins + ((stopAngle - startAngle + 2 * Math.PI) % (2 * Math.PI));
  const duration = 3200 + Math.random() * 600;
  const start = performance.now();
  function animate(now) {
    const elapsed = now - start;
    const t = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const ease = 1 - Math.pow(1 - t, 3);
    rouletteAngle = startAngle + totalAngle * ease;
    drawRouletteWheel(filtered, t > 0.95 ? winnerIdx : null);
    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      rouletteAngle = stopAngle;
      drawRouletteWheel(filtered, winnerIdx);
      setTimeout(() => {
        // Show winner in modal
        selectedTaskIndex = tasks.findIndex(t => t.id === filtered[winnerIdx].id);
        selectedTaskDetails.innerHTML = `
          <div><strong>${filtered[winnerIdx].name}</strong></div>
          <div class="task-meta">
            <span>Project: ${filtered[winnerIdx].project}</span>
            <span>Duration: ${filtered[winnerIdx].duration}</span>
            <span>Hardness: ${filtered[winnerIdx].hardness}</span>
          </div>
        `;
        doneBtn.style.display = '';
        skipBtn.style.display = '';
        doneMessage.classList.add('hidden');
        skipMessage.classList.add('hidden');
        showTaskModal();
        spinning = false;
        spinBtn.disabled = false;
      }, 600);
    }
  }
  requestAnimationFrame(animate);
});

skipBtn.addEventListener('click', function() {
  if (selectedTaskIndex === null || selectedTaskIndex >= tasks.length) return;
  const task = tasks[selectedTaskIndex];
  const count = (skipCounts.get(task.id) || 0) + 1;
  skipCounts.set(task.id, count);
  if (count === 1) {
    skipMessage.innerHTML = '<span class="skip-emoji">😢</span> Skipped once!';
    skipMessage.classList.remove('hidden');
  } else if (count === 2) {
    skipMessage.innerHTML = '<span class="middle-finger">' +
      '<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6v16" stroke="#e53935" stroke-width="4" stroke-linecap="round"/><rect x="14" y="22" width="8" height="8" rx="4" fill="#e53935"/><rect x="8" y="30" width="20" height="4" rx="2" fill="#e53935"/></svg>' +
      '</span> no way out, get it done!';
    skipMessage.classList.remove('hidden');
  } else {
    skipMessage.innerHTML = '<span class="middle-finger">' +
      '<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6v16" stroke="#e53935" stroke-width="4" stroke-linecap="round"/><rect x="14" y="22" width="8" height="8" rx="4" fill="#e53935"/><rect x="8" y="30" width="20" height="4" rx="2" fill="#e53935"/></svg>' +
      '</span> no way out, get it done!';
    skipMessage.classList.remove('hidden');
  }
  // Hide after a short delay, but keep the task visible
  setTimeout(() => {
    hideTaskModal();
  }, 1400);
});

// Surprise messages and effects for task completion
const surprises = [
  { type: 'text', html: 'Great job! 🎉' },
  { type: 'text', html: 'You crushed it! 💪' },
  { type: 'text', html: 'Zen mode: ACTIVATED 🧘‍♂️' },
  { type: 'text', html: 'You did it! 🌟' },
  { type: 'text', html: 'Productivity unlocked! 🔓' },
  { type: 'text', html: 'You rock! 🤘' },
  { type: 'text', html: 'Task obliterated! 💥' },
  { type: 'text', html: 'On fire! 🔥' },
  { type: 'text', html: 'Youre unstoppable! 🚀' },
  { type: 'text', html: 'Victory dance! 💃🕺' },
  { type: 'text', html: 'Focus master! 🧠' },
  { type: 'text', html: 'Youre a ZenDo hero! 🦸' },
  { type: 'text', html: 'Another one bites the dust! 🎶' },
  { type: 'text', html: 'Youre a productivity ninja! 🥷' },
  { type: 'text', html: 'Boom! Done! 💣' },
  { type: 'text', html: 'Youre a legend! 🏆' },
  { type: 'text', html: 'Confetti time! 🎊', confetti: true },
  { type: 'text', html: 'Youre a task terminator! 🤖' },
  { type: 'text', html: 'Youve earned a break! ☕️' },
  { type: 'text', html: 'Youre a focus wizard! 🧙' },
  { type: 'text', html: 'Youre a star! ⭐️' },
  { type: 'text', html: 'Youre a champion! 🥇' },
  { type: 'text', html: 'Youre a task slayer! ⚔️' },
  { type: 'text', html: 'Youre a Zen master! 🧘' },
  { type: 'text', html: 'Youre a productivity beast! 🐯' },
  { type: 'text', html: 'Youre a focus machine! 🤖' },
  { type: 'text', html: 'Youre a goal crusher! 🏅' },
  { type: 'text', html: 'Youre a task conqueror! 🏔️' },
  { type: 'text', html: 'Youre a ZenDo superstar! 🌠' },
  { type: 'text', html: 'Youre a productivity guru! 🕉️' },
];

// Confetti rain effect
function confettiRain() {
  // Remove any existing confetti
  let confetti = document.getElementById('zendo-confetti');
  if (confetti) confetti.remove();
  confetti = document.createElement('div');
  confetti.id = 'zendo-confetti';
  confetti.style.position = 'fixed';
  confetti.style.left = '0';
  confetti.style.top = '0';
  confetti.style.width = '100vw';
  confetti.style.height = '100vh';
  confetti.style.pointerEvents = 'none';
  confetti.style.zIndex = '9999';
  document.body.appendChild(confetti);
  const colors = ['#7EE787', '#5AC8FA', '#fff176', '#FF6B6B', '#43a047', '#FFD166'];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.width = '16px';
    el.style.height = '16px';
    el.style.borderRadius = '4px';
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.left = Math.random() * 100 + 'vw';
    el.style.top = (Math.random() * -20) + 'vh';
    el.style.opacity = 0.85;
    el.style.transform = `rotate(${Math.random()*360}deg)`;
    confetti.appendChild(el);
    const drift = (Math.random() - 0.5) * 60;
    const rotateStart = Math.random() * 360;
    const rotateEnd = rotateStart + 720 + Math.random() * 360;
    el.animate([
      { top: el.style.top, left: el.style.left, transform: `rotate(${rotateStart}deg)` },
      { top: (80 + Math.random() * 20) + 'vh', left: `calc(${el.style.left} + ${drift}px)`, transform: `rotate(${rotateEnd}deg)` }
    ], {
      duration: 3000 + Math.random() * 1200,
      easing: 'linear',
      fill: 'forwards'
    });
  }
  setTimeout(() => { if (confetti) confetti.remove(); }, 3500);
}

// REWARD SYSTEM
let rewardMinutes = 0;
let rewardSecondsLeft = 0;
let rewardTimer = null;
let rewardRunning = false;
const rewardMinutesSpan = document.getElementById('reward-minutes');
const rewardStartBtn = document.getElementById('reward-start-btn');
const rewardStopBtn = document.getElementById('reward-stop-btn');
const rewardTimerDisplay = document.getElementById('reward-timer-display');
const rewardTimerSpan = document.getElementById('reward-timer');
const rewardAlarm = document.getElementById('reward-alarm');

// Update reward counter UI with icon and progress bar
function updateRewardDisplay() {
  rewardMinutesSpan.textContent = Math.floor(rewardMinutes);
  // Add icon if not present
  const counter = document.getElementById('reward-counter');
  if (!counter.querySelector('.reward-icon')) {
    const icon = document.createElement('span');
    icon.className = 'reward-icon';
    icon.textContent = '🎁';
    counter.insertBefore(icon, rewardMinutesSpan.parentNode.firstChild);
  }
  // Progress bar
  let bar = document.getElementById('reward-progress-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'reward-progress-bar';
    bar.innerHTML = '<div id="reward-progress"></div>';
    counter.parentNode.appendChild(bar);
  }
  const progress = document.getElementById('reward-progress');
  // Assume 30 min is "full" for visual, but can go above
  let percent = Math.min(rewardMinutes / 30, 1) * 100;
  progress.style.width = percent + '%';
  if (rewardMinutes > 10) confettiRain();
}

function updateRewardTimerDisplay() {
  const min = Math.floor(rewardSecondsLeft / 60);
  const sec = rewardSecondsLeft % 60;
  rewardTimerSpan.textContent = `${min}:${sec.toString().padStart(2, '0')}`;
}
function startRewardTimer() {
  if (rewardRunning || rewardMinutes <= 0) return;
  rewardRunning = true;
  rewardStartBtn.disabled = true;
  rewardStopBtn.disabled = false;
  rewardTimerDisplay.classList.remove('hidden');
  rewardAlarm.classList.add('hidden');
  rewardSecondsLeft = Math.floor(rewardMinutes * 60);
  updateRewardTimerDisplay();
  rewardTimer = setInterval(() => {
    rewardSecondsLeft--;
    updateRewardTimerDisplay();
    if (rewardSecondsLeft <= 0) {
      clearInterval(rewardTimer);
      rewardTimer = null;
      rewardRunning = false;
      rewardMinutes = 0;
      updateRewardDisplay();
      rewardStartBtn.disabled = false;
      rewardStopBtn.disabled = true;
      rewardAlarm.classList.remove('hidden');
      rewardTimerDisplay.classList.add('hidden');
      // Optionally: play a sound
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = 880;
        o.connect(ctx.destination);
        o.start();
        setTimeout(() => { o.stop(); ctx.close(); }, 700);
      } catch (e) {}
    }
  }, 1000);
}
function stopRewardTimer() {
  if (!rewardRunning) return;
  rewardRunning = false;
  rewardStartBtn.disabled = false;
  rewardStopBtn.disabled = true;
  clearInterval(rewardTimer);
  rewardTimer = null;
  rewardMinutes = rewardSecondsLeft / 60;
  updateRewardDisplay();
  rewardTimerDisplay.classList.add('hidden');
  rewardAlarm.classList.add('hidden');
}
rewardStartBtn.addEventListener('click', startRewardTimer);
rewardStopBtn.addEventListener('click', stopRewardTimer);

// --- Reward Timer Clock Logic ---
const rewardTimerBtn = document.getElementById('reward-timer-btn');
const rewardTimerSVG = document.getElementById('reward-timer-svg');
const rewardTimerText = document.getElementById('reward-timer-text');
const rewardTimerProgress = document.getElementById('reward-timer-progress');
let rewardTimerTotal = 0;

function setRewardTimerDisplay(seconds, totalSeconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  rewardTimerText.textContent = `${min}:${sec.toString().padStart(2, '0')}`;
  // Animate SVG progress
  const circ = 2 * Math.PI * 54;
  let percent = totalSeconds > 0 ? (seconds / totalSeconds) : 0;
  rewardTimerProgress.style.strokeDashoffset = circ * (1 - percent);
}

function startRewardTimerClock() {
  if (rewardRunning || rewardMinutes <= 0) return;
  rewardRunning = true;
  rewardTimerBtn.textContent = 'Stop';
  rewardAlarm.classList.add('hidden');
  rewardAlarmOverlay.classList.add('hidden');
  rewardTimerTotal = Math.floor(rewardMinutes * 60);
  rewardSecondsLeft = rewardTimerTotal;
  setRewardTimerDisplay(rewardSecondsLeft, rewardTimerTotal);
  rewardTimer = setInterval(() => {
    rewardSecondsLeft--;
    setRewardTimerDisplay(rewardSecondsLeft, rewardTimerTotal);
    if (rewardSecondsLeft <= 0) {
      clearInterval(rewardTimer);
      rewardTimer = null;
      rewardRunning = false;
      rewardMinutes = 0;
      updateRewardDisplay();
      rewardTimerBtn.textContent = 'Start';
      rewardAlarm.classList.remove('hidden');
      setRewardTimerDisplay(0, rewardTimerTotal);
      showAlarmOverlay();
      // Optionally: play a sound
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = 880;
        o.connect(ctx.destination);
        o.start();
        setTimeout(() => { o.stop(); ctx.close(); }, 700);
      } catch (e) {}
    }
  }, 1000);
}
function stopRewardTimerClock() {
  if (!rewardRunning) return;
  rewardRunning = false;
  clearInterval(rewardTimer);
  rewardTimer = null;
  rewardMinutes = rewardSecondsLeft / 60;
  updateRewardDisplay();
  rewardTimerBtn.textContent = 'Start';
  rewardAlarm.classList.add('hidden');
}
rewardTimerBtn.addEventListener('click', function() {
  if (!rewardRunning) {
    startRewardTimerClock();
  } else {
    stopRewardTimerClock();
  }
});

// Update timer display on load
setRewardTimerDisplay(0, 1);
rewardTimerBtn.textContent = 'Start';


// Optional: Enter key on any input submits form
['task-name','task-duration'].forEach(id => {
  document.getElementById(id).addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTaskBtn.click();
    }
  });
});

// Project select: Enter key on modal
// Already handled above

// Initialize with a default project for demo
projects = ['General'];
updateProjectDropdowns(); 

// Only allow positive integers in duration input
taskDurationInput.addEventListener('input', function() {
  let val = this.value.replace(/[^\d]/g, '');
  if (val === '' || parseInt(val, 10) < 1) val = '1';
  this.value = val;
});

doneBtn.addEventListener('click', function() {
  if (selectedTaskIndex === null || selectedTaskIndex >= tasks.length) return;
  // Animate button
  doneBtn.style.animation = 'doneShake 0.18s';
  setTimeout(() => { doneBtn.style.animation = ''; }, 180);
  // Show random surprise
  const surprise = surprises[Math.floor(Math.random() * surprises.length)];
  doneMessage.innerHTML = surprise.html;
  doneMessage.classList.remove('hidden');
  if (surprise.confetti) confettiRain();
  // Add reward time: 10% of duration (in min)
  const task = tasks[selectedTaskIndex];
  skipCounts.delete(task.id);
  let addMin = Math.round(task.durationMin * 0.1 * 10) / 10;
  if (isNaN(addMin) || addMin < 0) addMin = 0;
  rewardMinutes += addMin;
  updateRewardDisplay();
  setRewardTimerDisplay(Math.floor(rewardMinutes * 60), Math.floor(rewardMinutes * 60));
  rewardTimerBtn.textContent = rewardRunning ? 'Stop' : 'Start';
  tasks.splice(selectedTaskIndex, 1);
  renderTaskList();
  // Hide after a short delay
  setTimeout(() => {
    hideTaskModal();
  }, 1600);
}); 