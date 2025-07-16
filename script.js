// ZenDo Main Script
// ==================
// Handles navigation, task management, roulette, rewards, profile, and stats.

// --- Navigation ---
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.page-section');
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = link.getAttribute('href').replace('#', '');
    sections.forEach(sec => sec.classList.remove('active'));
    document.getElementById(target).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

// --- Local Storage Helpers ---
function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function loadData(key, fallback) {
  const val = localStorage.getItem(key);
  return val ? JSON.parse(val) : fallback;
}

// --- Task Management ---
let tasks = loadData('zendo_tasks', []);
let completedTasks = loadData('zendo_completed', []);
let rewardTime = loadData('zendo_reward_time', 0); // in minutes
let maybeLaterClicks = loadData('zendo_maybe_later', {}); // {taskId: count}

function renderTasks() {
  const list = document.getElementById('tasks-list');
  list.innerHTML = '';
  if (tasks.length === 0) {
    list.innerHTML = '<p>No outstanding tasks! 🎉</p>';
    return;
  }
  tasks.forEach((task, idx) => {
    const div = document.createElement('div');
    div.className = 'task-item';
    div.innerHTML = `
      <b>${task.name}</b> ${task.project ? ' <span style="color:#2176ff">[' + task.project + ']</span>' : ''}<br>
      <span>⏳ ${task.duration} min</span> | <span>💡 ${task.difficulty}</span>
    `;
    list.appendChild(div);
  });
}

function addTask(e) {
  e.preventDefault();
  const name = document.getElementById('task-name').value.trim();
  const project = document.getElementById('task-project').value.trim();
  const duration = parseInt(document.getElementById('task-duration').value, 10);
  const difficulty = document.getElementById('task-difficulty').value;
  if (!name || !duration || !difficulty) return;
  const task = {
    id: Date.now() + Math.random().toString(36).slice(2),
    name, project, duration, difficulty
  };
  tasks.push(task);
  saveData('zendo_tasks', tasks);
  renderTasks();
  document.getElementById('task-form').reset();
  renderRoulette();
}
document.getElementById('task-form').addEventListener('submit', addTask);
renderTasks();

// --- Roulette ---
function renderRoulette() {
  const wheel = document.getElementById('roulette-wheel');
  const spinBtn = document.getElementById('spin-btn');
  const noTasksMsg = document.getElementById('no-tasks-message');
  wheel.innerHTML = '';
  if (tasks.length === 0) {
    spinBtn.style.display = 'none';
    noTasksMsg.style.display = 'block';
    return;
  }
  spinBtn.style.display = 'block';
  noTasksMsg.style.display = 'none';
  // SVG roulette wheel
  const n = tasks.length;
  const svgNS = 'http://www.w3.org/2000/svg';
  const size = 240;
  const r = size/2;
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  // White background circle
  const bgCircle = document.createElementNS(svgNS, 'circle');
  bgCircle.setAttribute('cx', r);
  bgCircle.setAttribute('cy', r);
  bgCircle.setAttribute('r', r);
  bgCircle.setAttribute('fill', '#fff');
  svg.appendChild(bgCircle);
  let angle = 0;
  for (let i = 0; i < n; i++) {
    const theta1 = angle;
    const theta2 = angle + 2 * Math.PI / n;
    const x1 = r + r * Math.cos(theta1);
    const y1 = r + r * Math.sin(theta1);
    const x2 = r + r * Math.cos(theta2);
    const y2 = r + r * Math.sin(theta2);
    const largeArc = (2 * Math.PI / n) > Math.PI ? 1 : 0;
    const path = document.createElementNS(svgNS, 'path');
    const d = `M${r},${r} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`;
    path.setAttribute('d', d);
    path.setAttribute('fill', '#F0C5E1');
    path.setAttribute('stroke', '#3352F9');
    path.setAttribute('stroke-width', '4');
    svg.appendChild(path);
    // Add emoji label
    const midAngle = angle + Math.PI / n;
    const lx = r + (r * 0.65) * Math.cos(midAngle);
    const ly = r + (r * 0.65) * Math.sin(midAngle) - 8;
    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('x', lx);
    text.setAttribute('y', ly);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '22');
    text.setAttribute('dominant-baseline', 'middle');
    text.textContent = ['📝','💡','🔥','🎯','⭐','🎵','🧩','🧠','🧹','📚','🛠️','🎨','🧘','🚀','🍀','🌟','🎉','🏆','💪','✨'][i % 20];
    svg.appendChild(text);
    // Add task name (centered, blue, below emoji)
    const nameText = document.createElementNS(svgNS, 'text');
    nameText.setAttribute('x', lx);
    nameText.setAttribute('y', ly + 22);
    nameText.setAttribute('text-anchor', 'middle');
    nameText.setAttribute('font-size', '13');
    nameText.setAttribute('fill', '#3352F9');
    nameText.setAttribute('font-weight', 'bold');
    nameText.textContent = tasks[i].name.length > 16 ? tasks[i].name.slice(0, 14) + '…' : tasks[i].name;
    svg.appendChild(nameText);
    angle += 2 * Math.PI / n;
  }
  // Draw pointer (fixed, not rotating)
  const pointer = document.createElementNS(svgNS, 'polygon');
  pointer.setAttribute('points', `${r-12},10 ${r+12},10 ${r},38`);
  pointer.setAttribute('fill', '#3352F9');
  pointer.setAttribute('style', 'z-index:2;');
  svg.appendChild(pointer);
  wheel.appendChild(svg);
}
renderRoulette();

document.getElementById('spin-btn').addEventListener('click', spinRoulette);

function spinRoulette() {
  if (tasks.length === 0) return;
  const wheel = document.getElementById('roulette-wheel').querySelector('svg');
  const n = tasks.length;
  const selected = Math.floor(Math.random() * n);
  const anglePer = 360 / n;
  const spinRounds = 5 + Math.floor(Math.random()*2); // 5-6 rounds
  const finalAngle = 360 * spinRounds + (360 - selected * anglePer - anglePer/2);
  // Only rotate the wheel, not the pointer
  wheel.style.transition = 'none';
  wheel.style.transform = 'rotate(0deg)';
  setTimeout(() => {
    wheel.style.transition = 'transform 2.5s cubic-bezier(.17,.67,.83,.67)';
    wheel.style.transform = `rotate(${finalAngle}deg)`;
    setTimeout(() => {
      showTaskModal(tasks[selected]);
    }, 2600);
  }, 30);
}

// --- Modal Logic ---
function showTaskModal(task) {
  const modal = document.getElementById('modal');
  const content = document.getElementById('modal-content');
  const emoji = pickTaskEmoji(task);
  content.innerHTML = `
    <h2>${emoji} ${task.name}</h2>
    <p>${task.project ? 'Project: <b>' + task.project + '</b><br>' : ''}
    Duration: <b>${task.duration} min</b><br>
    Difficulty: <b>${task.difficulty}</b></p>
    <div style="margin-top:1.5em;">
      <button id="done-btn">Done ✅</button>
      <button id="maybe-later-btn">Maybe Later 😴</button>
    </div>
  `;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  document.getElementById('done-btn').onclick = () => {
    completeTask(task);
    modal.style.display = 'none';
    document.body.style.overflow = '';
  };
  document.getElementById('maybe-later-btn').onclick = () => {
    handleMaybeLater(task);
  };
}
function pickTaskEmoji(task) {
  const map = {
    'Simple': '😊',
    'Mundane': '😐',
    'Hard': '🔥',
    'Brain Teaser': '🧠'
  };
  return map[task.difficulty] || '📝';
}

// --- Surprise Animations ---
function triggerSurprise() {
  const effects = [confettiRain, smileyBurst, hoorayText, twinkleStars, fireworks, awesomePopup, nailedIt, starMessage, successSound, zenBurst, rainbowText, emojiRain, popEmoji, bounceText, sparkleConfetti, wowText, thumbsUp, partyPopper, happyDance, trophyShow, zenMaster];
  const idx = Math.floor(Math.random() * effects.length);
  effects[idx]();
}
function confettiRain() {
  const container = document.getElementById('surprise-animations');
  for (let i = 0; i < 40; i++) {
    const conf = document.createElement('div');
    conf.className = 'confetti';
    conf.style.left = Math.random()*100 + 'vw';
    conf.style.background = ['#2176ff','#ff5fa2','#ffe3f6','#f0f4ff'][i%4];
    conf.style.animationDelay = (Math.random()*0.7)+'s';
    container.appendChild(conf);
    setTimeout(() => conf.remove(), 1400);
  }
}
function smileyBurst() { showBurst('😃'); }
function hoorayText() { showTextBurst('Hooray! 🎉'); }
function twinkleStars() { showBurst('✨'); }
function fireworks() { showBurst('🎆'); }
function awesomePopup() { showTextBurst('Awesome! 🌟'); }
function nailedIt() { showTextBurst('Nailed It! 💪'); }
function starMessage() { showTextBurst("You're a star! ⭐"); }
function successSound() { try { new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YYQAAAD//w8A').play(); } catch(e){} }
function zenBurst() { showBurst('🧘'); }
function rainbowText() { showTextBurst('🌈 Success!'); }
function emojiRain() { showBurst('🎊'); }
function popEmoji() { showBurst('🤩'); }
function bounceText() { showTextBurst('Great Job! 🏆'); }
function sparkleConfetti() { showBurst('💫'); }
function wowText() { showTextBurst('Wow! 🎇'); }
function thumbsUp() { showBurst('👍'); }
function partyPopper() { showBurst('🎉'); }
function happyDance() { showBurst('💃'); }
function trophyShow() { showBurst('🏆'); }
function zenMaster() { showTextBurst('Zen Master! ✨'); }
function showBurst(emoji) {
  const container = document.getElementById('surprise-animations');
  for (let i = 0; i < 18; i++) {
    const span = document.createElement('span');
    span.textContent = emoji;
    span.style.position = 'absolute';
    span.style.left = Math.random()*100 + 'vw';
    span.style.top = Math.random()*60 + 10 + 'vh';
    span.style.fontSize = (2 + Math.random()*2) + 'em';
    span.style.opacity = 0.8;
    span.style.animation = 'fadePop 1.2s linear forwards';
    container.appendChild(span);
    setTimeout(() => span.remove(), 1300);
  }
}
function showTextBurst(text) {
  const container = document.getElementById('surprise-animations');
  const div = document.createElement('div');
  div.textContent = text;
  div.style.position = 'fixed';
  div.style.left = '50%';
  div.style.top = '40%';
  div.style.transform = 'translate(-50%, -50%) scale(1)';
  div.style.fontSize = '2.2em';
  div.style.color = '#ff5fa2';
  div.style.background = '#fff';
  div.style.padding = '0.5em 1.2em';
  div.style.borderRadius = '18px';
  div.style.boxShadow = '0 2px 12px rgba(33,118,255,0.13)';
  div.style.zIndex = 300;
  div.style.opacity = 1;
  div.style.animation = 'popText 1.2s linear forwards';
  container.appendChild(div);
  setTimeout(() => div.remove(), 1300);
}
// Add keyframes for fadePop and popText in CSS if needed

// --- Task Completion ---
let completedCount = 0;
function completeTask(task) {
  // Remove from outstanding
  tasks = tasks.filter(t => t.id !== task.id);
  saveData('zendo_tasks', tasks);
  // Add to completed
  completedTasks.push({ ...task, completedAt: Date.now() });
  saveData('zendo_completed', completedTasks);
  // Add reward time (10% of duration, rounded up, minimum 1)
  const addTime = Math.max(1, Math.ceil(task.duration * 0.1));
  rewardTime += addTime;
  saveData('zendo_reward_time', rewardTime);
  // Reset maybe later count
  delete maybeLaterClicks[task.id];
  saveData('zendo_maybe_later', maybeLaterClicks);
  renderTasks();
  renderRoulette();
  renderRewardTime();
  renderStats();
  completedCount++;
  if (completedCount % 5 === 0) {
    confettiRain();
    showTextBurst(randomCheekyText(true));
  } else {
    showTextBurst(randomCheekyText(false));
  }
}
const cheekyTexts = [
  'Good job! 😎',
  'Well done, ZenMaster! 🧘‍♂️',
  'You crushed it! 💪',
  'Task obliterated! 🚀',
  'You rock! 🤘',
  'Another one bites the dust! 🎶',
  'You did it! 🎉',
  'On fire! 🔥',
  'That was easy! 😏',
  'You make it look easy! 😁',
  'Legendary! 🏆',
  'You’re unstoppable! 🦸',
  'Keep it up! ✨',
  'You’re a productivity ninja! 🥷',
  'Boom! 💥',
  'Mission accomplished! 🎯',
  'You’re a star! ⭐',
  'Victory! 🏅',
  'You’re on a roll! 🥳',
  'Task? What task? 😏'
];
function randomCheekyText(isConfetti) {
  if (isConfetti) {
    const confettiTexts = [
      'Confetti time! 🎊',
      'Milestone! 🎉',
      '5 tasks done! 🖐️',
      'You’re on fire! 🔥🔥',
      'Productivity legend! 🏆'
    ];
    return confettiTexts[Math.floor(Math.random() * confettiTexts.length)];
  }
  return cheekyTexts[Math.floor(Math.random() * cheekyTexts.length)];
}

// --- Maybe Later Logic ---
function handleMaybeLater(task) {
  maybeLaterClicks[task.id] = (maybeLaterClicks[task.id] || 0) + 1;
  saveData('zendo_maybe_later', maybeLaterClicks);
  const container = document.getElementById('surprise-animations');
  if (maybeLaterClicks[task.id] === 1) {
    showTextBurst('😔');
  } else {
    showTextBurst("No way to exit, let's get it done! 💪");
  }
}

// --- Rewards & Timer ---
function renderRewardTime() {
  const disp = document.getElementById('reward-time');
  if (rewardTime < 60) {
    disp.textContent = rewardTime + ' min';
  } else {
    const h = Math.floor(rewardTime/60);
    const m = rewardTime%60;
    disp.textContent = `${h}h ${m}min`;
  }
  // Confetti if > 10 min
  if (rewardTime > 10) confettiRain();
}
renderRewardTime();

let timer = null;
let timerRunning = false;
let timerLeft = 0;
function updateTimerDisplay() {
  const t = timerLeft;
  const min = Math.floor(t/60);
  const sec = t%60;
  document.getElementById('timer').textContent = `${min.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
}
function startTimer() {
  if (timerRunning || rewardTime === 0) return;
  timerRunning = true;
  timerLeft = rewardTime * 60;
  updateTimerDisplay();
  timer = setInterval(() => {
    if (timerLeft > 0) {
      timerLeft--;
      updateTimerDisplay();
      if (timerLeft % 60 === 0) {
        rewardTime--;
        saveData('zendo_reward_time', rewardTime);
        renderRewardTime();
      }
    } else {
      stopTimer(true);
    }
  }, 1000);
}
function stopTimer(alarm) {
  if (!timerRunning) return;
  timerRunning = false;
  clearInterval(timer);
  timer = null;
  rewardTime = Math.ceil(timerLeft/60);
  saveData('zendo_reward_time', rewardTime);
  renderRewardTime();
  if (alarm) triggerTimerAlarm();
}
function triggerTimerAlarm() {
  const timerDisplay = document.getElementById('timer');
  timerDisplay.classList.add('timer-alarm');
  setTimeout(() => timerDisplay.classList.remove('timer-alarm'), 2000);
}
document.getElementById('start-timer-btn').onclick = startTimer;
document.getElementById('stop-timer-btn').onclick = stopTimer;

// --- Profile SVG ---
function renderProfilePic() {
  const container = document.getElementById('profile-pic');
  const svgs = [
    '<svg width="70" height="70" viewBox="0 0 70 70"><circle cx="35" cy="35" r="32" fill="#ff5fa2"/><ellipse cx="35" cy="38" rx="18" ry="14" fill="#fff"/><circle cx="35" cy="30" r="10" fill="#fff"/><ellipse cx="30" cy="30" rx="2" ry="3" fill="#ff5fa2"/><ellipse cx="40" cy="30" rx="2" ry="3" fill="#ff5fa2"/><path d="M32 36 Q35 39 38 36" stroke="#ff5fa2" stroke-width="2" fill="none"/></svg>',
    '<svg width="70" height="70" viewBox="0 0 70 70"><circle cx="35" cy="35" r="32" fill="#2176ff"/><ellipse cx="35" cy="38" rx="18" ry="14" fill="#fff"/><circle cx="35" cy="30" r="10" fill="#fff"/><ellipse cx="30" cy="30" rx="2" ry="3" fill="#2176ff"/><ellipse cx="40" cy="30" rx="2" ry="3" fill="#2176ff"/><path d="M32 36 Q35 34 38 36" stroke="#2176ff" stroke-width="2" fill="none"/></svg>',
    '<svg width="70" height="70" viewBox="0 0 70 70"><circle cx="35" cy="35" r="32" fill="#ffe3f6"/><ellipse cx="35" cy="38" rx="18" ry="14" fill="#fff"/><circle cx="35" cy="30" r="10" fill="#fff"/><ellipse cx="30" cy="30" rx="2" ry="3" fill="#ff5fa2"/><ellipse cx="40" cy="30" rx="2" ry="3" fill="#2176ff"/><path d="M32 36 Q35 38 38 36" stroke="#ff5fa2" stroke-width="2" fill="none"/></svg>'
  ];
  container.innerHTML = svgs[Math.floor(Math.random()*svgs.length)];
}
renderProfilePic();

// --- Statistics & Fun Charts ---
function renderStats() {
  // Total tasks done
  document.querySelector('#stats-tasks-done span').textContent = completedTasks.length;
  // Total time spent
  const totalTime = completedTasks.reduce((sum, t) => sum + (t.duration || 0), 0);
  document.querySelector('#stats-time-spent span').textContent = totalTime < 60 ? `${totalTime} min` : `${Math.floor(totalTime/60)}h ${totalTime%60}min`;
  // Outstanding reward time
  document.querySelector('#stats-reward-time span').textContent = rewardTime < 60 ? `${rewardTime} min` : `${Math.floor(rewardTime/60)}h ${rewardTime%60}min`;
  // Difficulty breakdown
  const diffCounts = { 'Simple':0, 'Mundane':0, 'Hard':0, 'Brain Teaser':0 };
  completedTasks.forEach(t => { if (diffCounts[t.difficulty] !== undefined) diffCounts[t.difficulty]++; });
  const total = completedTasks.length || 1;
  const perc = Object.values(diffCounts).map(c => Math.round(100*c/total));
  // Pie chart (CSS conic-gradient)
  const pie = document.getElementById('stats-difficulty-breakdown');
  pie.style.background = `conic-gradient(
    #2176ff 0% ${perc[0]}%,
    #ff5fa2 ${perc[0]}% ${perc[0]+perc[1]}%,
    #ffe3f6 ${perc[0]+perc[1]}% ${perc[0]+perc[1]+perc[2]}%,
    #f0f4ff ${perc[0]+perc[1]+perc[2]}% 100%
  )`;
  // Avg duration
  const avg = completedTasks.length ? Math.round(totalTime/completedTasks.length) : 0;
  document.querySelector('#stats-avg-duration span').textContent = avg + ' min';
  // Most frequent project
  const projCounts = {};
  completedTasks.forEach(t => { if (t.project) projCounts[t.project] = (projCounts[t.project]||0)+1; });
  let maxProj = '-'; let maxCount = 0;
  for (const [proj, count] of Object.entries(projCounts)) {
    if (count > maxCount) { maxProj = proj; maxCount = count; }
  }
  document.querySelector('#stats-frequent-project span').textContent = maxProj;
  // Zen Level
  let level = 'Beginner 🐣';
  if (completedTasks.length > 20) level = 'Master Meditator! ✨';
  else if (completedTasks.length > 10) level = 'Focused Fox 🦊';
  else if (completedTasks.length > 5) level = 'Getting Zen 🧘';
  document.querySelector('#stats-zen-level span').textContent = level;
}
renderStats();

// --- Initial Page State ---
sections.forEach(sec => sec.classList.remove('active'));
document.getElementById('home').classList.add('active');

// --- Dismiss Modal on outside click ---
document.getElementById('modal').addEventListener('click', e => {
  if (e.target === e.currentTarget) {
    e.currentTarget.style.display = 'none';
    document.body.style.overflow = '';
  }
});

// --- Add keyframes for surprise animations (if not in CSS) ---
const style = document.createElement('style');
style.textContent = `
@keyframes fadePop { 0%{opacity:0;transform:scale(0.7);} 60%{opacity:1;transform:scale(1.2);} 100%{opacity:0;transform:scale(1);} }
@keyframes popText { 0%{opacity:0;transform:scale(0.7);} 60%{opacity:1;transform:scale(1.1);} 100%{opacity:0;transform:scale(1);} }
`;
document.head.appendChild(style); 