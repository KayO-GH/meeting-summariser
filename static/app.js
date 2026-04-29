let isRecording = false;
let finalTranscript = '';
let recognition = null;
let currentEmail = '';

// ── Account ───────────────────────────────────────────────────────────────────

async function loadAccount() {
  const email = document.getElementById('emailInput').value.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    showNotice('emailNotice', 'Enter a valid email address.', 'error');
    return;
  }
  currentEmail = email;
  hide('emailNotice');
  const res = await fetch('/credits?email=' + encodeURIComponent(email));
  const data = await res.json();
  updateCredits(data.credits);
  document.getElementById('appSection').classList.remove('hidden');
  document.getElementById('accountPill').classList.remove('hidden');
  document.getElementById('accountEmail').textContent = email;
}

function updateCredits(credits) {
  const badge = document.getElementById('creditBadge');
  badge.textContent = credits + ' credit' + (credits !== 1 ? 's' : '');
  badge.className = credits > 0 ? 'credit-badge' : 'credit-badge empty';

  const summariseBtn = document.getElementById('summariseBtn');
  const topupCard = document.getElementById('topupCard');

  if (credits <= 0) {
    topupCard.classList.remove('hidden');
  } else {
    topupCard.classList.add('hidden');
  }
  refreshSummariseBtn();
}

// ── Recording ─────────────────────────────────────────────────────────────────

function initRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
    return null;
  }
  const r = new SpeechRecognition();
  r.continuous = true;
  r.interimResults = true;
  r.lang = 'en-US';

  r.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const text = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += text + ' ';
      } else {
        interim += text;
      }
    }
    renderTranscript(interim);
    refreshSummariseBtn();
  };

  r.onerror = (event) => {
    setStatus('idle');
    showNotice('transcriptNotice', 'Microphone error: ' + event.error, 'error');
  };

  r.onend = () => {
    if (isRecording) r.start();
  };

  return r;
}

function renderTranscript(interim) {
  const box = document.getElementById('transcriptBox');
  box.innerHTML =
    '<span class="final">' + finalTranscript + '</span>' +
    '<span class="interim">' + interim + '</span>';
}

function toggleRecording() {
  if (isRecording) stopRecording();
  else startRecording();
}

function startRecording() {
  recognition = initRecognition();
  if (!recognition) return;
  finalTranscript = '';
  document.getElementById('transcriptBox').innerHTML = '<span class="placeholder">Listening...</span>';
  recognition.start();
  isRecording = true;
  setStatus('recording');
  const btn = document.getElementById('recordBtn');
  btn.innerHTML = '<span class="mic-icon">⏹</span> Stop recording';
  btn.classList.add('recording');
  document.getElementById('clearBtn').disabled = false;
  document.getElementById('summaryCard').classList.add('hidden');
  document.getElementById('summariseBtn').disabled = true;
  hide('transcriptNotice');
}

function stopRecording() {
  if (recognition) recognition.stop();
  isRecording = false;
  setStatus('idle');
  const btn = document.getElementById('recordBtn');
  btn.innerHTML = '<span class="mic-icon">🎙</span> Start recording';
  btn.classList.remove('recording');
  refreshSummariseBtn();
}

function clearAll() {
  stopRecording();
  finalTranscript = '';
  document.getElementById('transcriptBox').innerHTML = '<span class="placeholder">Your transcript will appear here as you speak...</span>';
  document.getElementById('summariseBtn').disabled = true;
  document.getElementById('clearBtn').disabled = true;
  document.getElementById('summaryCard').classList.add('hidden');
  hide('transcriptNotice');
  setStatus('idle');
  document.getElementById('statusPill').classList.add('hidden');
}

// ── Summarise ─────────────────────────────────────────────────────────────────

async function requestSummary() {
  const transcript = finalTranscript.trim();
  if (!transcript) {
    showNotice('transcriptNotice', 'Nothing to summarise yet. Record some audio first.', 'error');
    return;
  }
  const btn = document.getElementById('summariseBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Summarising...';
  hide('transcriptNotice');

  const res = await fetch('/summarise', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: currentEmail, transcript }),
  });
  const data = await res.json();
  btn.innerHTML = '✦ Summarise';

  if (!res.ok) {
    if (res.status === 402) {
      updateCredits(0);
    } else {
      btn.disabled = false;
      showNotice('transcriptNotice', data.detail || 'Something went wrong.', 'error');
    }
    return;
  }

  const summaryCard = document.getElementById('summaryCard');
  document.getElementById('summaryBox').innerHTML = renderMarkdown(data.summary);
  summaryCard.classList.remove('hidden');
  summaryCard.scrollIntoView({ behavior: 'smooth' });

  const credRes = await fetch('/credits?email=' + encodeURIComponent(currentEmail));
  const credData = await credRes.json();
  updateCredits(credData.credits);
}

// ── Payment ───────────────────────────────────────────────────────────────────

async function initPayment() {
  const btn = document.getElementById('payBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Creating link...';
  const res = await fetch('/payment/initialize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: currentEmail }),
  });
  const data = await res.json();
  btn.innerHTML = 'Generate payment link';
  btn.disabled = false;
  if (!res.ok) { showNotice('topupNotice', data.detail || 'Could not create link.', 'error'); return; }
  document.getElementById('payAnchor').href = data.authorization_url;
  document.getElementById('refInput').value = data.reference;
  document.getElementById('payLink').classList.remove('hidden');
}

async function verifyPayment() {
  const ref = document.getElementById('refInput').value.trim();
  if (!ref) { showNotice('topupNotice', 'Reference not yet generated.', 'error'); return; }
  const res = await fetch('/payment/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: currentEmail, reference: ref }),
  });
  const data = await res.json();
  if (data.success) {
    showNotice('topupNotice', data.message, 'success');
    document.getElementById('refInput').value = '';
    document.getElementById('payLink').classList.add('hidden');
    updateCredits(data.credits);
  } else {
    showNotice('topupNotice', data.message, 'error');
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function refreshSummariseBtn() {
  const hasCredits = !document.getElementById('creditBadge').classList.contains('empty');
  const hasTranscript = !!finalTranscript.trim();
  document.getElementById('summariseBtn').disabled = !hasTranscript || !hasCredits;
}

function renderMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/^(?!<)(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '');
}

function setStatus(state) {
  const pill = document.getElementById('statusPill');
  const dot = document.getElementById('statusDot');
  const label = document.getElementById('statusLabel');
  if (state === 'recording') {
    pill.classList.remove('hidden');
    dot.className = 'status-dot recording';
    label.textContent = 'Recording';
  } else {
    dot.className = 'status-dot';
    label.textContent = 'Idle';
  }
}

function showNotice(id, msg, type) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.className = 'notice ' + (type || '');
  el.classList.remove('hidden');
}

function hide(id) {
  document.getElementById(id).classList.add('hidden');
}