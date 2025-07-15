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
  // Parse duration to minutes for filtering
  const durationMin = parseDurationToMinutes(duration);
  const id = `${name}__${project}__${duration}__${hardness}`;
  tasks.push({ id, name, project, duration, durationMin, hardness });
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

getStartedBtn.addEventListener('click', () => {
  introSection.classList.add('hidden');
  appSection.classList.remove('hidden');
});

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

getTaskBtn.addEventListener('click', function() {
  const filtered = getFilteredTasks();
  if (filtered.length === 0) {
    selectedTaskDetails.innerHTML = '<span style="color:#e53935">Add some tasks first or adjust your filters!</span>';
    showTaskModal();
    doneBtn.style.display = 'none';
    skipBtn.style.display = 'none';
    skipMessage.classList.add('hidden');
    return;
  }
  selectedTaskIndex = Math.floor(Math.random() * filtered.length);
  const task = filtered[selectedTaskIndex];
  // Find index in main tasks array
  const mainIdx = tasks.findIndex(t => t.id === task.id);
  selectedTaskIndex = mainIdx;
  selectedTaskDetails.innerHTML = `
    <div><strong>${task.name}</strong></div>
    <div class="task-meta">
      <span>Project: ${task.project}</span>
      <span>Duration: ${task.duration}</span>
      <span>Hardness: ${task.hardness}</span>
    </div>
  `;
  doneBtn.style.display = '';
  skipBtn.style.display = '';
  doneMessage.classList.add('hidden');
  skipMessage.classList.add('hidden');
  // Animate button
  getTaskBtn.style.animation = 'btnBounce 0.22s';
  setTimeout(() => { getTaskBtn.style.animation = ''; }, 220);
  showTaskModal();
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
  // Remove task from array and skipCounts
  const task = tasks[selectedTaskIndex];
  skipCounts.delete(task.id);
  tasks.splice(selectedTaskIndex, 1);
  renderTaskList();
  // Hide after a short delay
  setTimeout(() => {
    hideTaskModal();
  }, 1600);
});

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