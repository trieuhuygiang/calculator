/* script.js
   Calculator with theme presets, glass mode, and 5 persistent backgrounds.
*/

/* =========================
   Calculator logic
   ========================= */
const displayEl = document.getElementById('display');
const buttons = Array.from(document.querySelectorAll('.btn'));

let currentInput = '0';
let accumulator = null;
let pendingOp = null;
let lastPressedEquals = false;
const MAX_DIGITS = 15;

function updateDisplay() {
  if (currentInput === 'ERROR') {
    displayEl.textContent = 'Error';
    return;
  }
  let text = currentInput;
  if (text.length > MAX_DIGITS) {
    const n = Number(text);
    if (!Number.isFinite(n)) {
      text = 'Error';
      currentInput = 'ERROR';
    } else {
      text = n.toPrecision(MAX_DIGITS);
      text = parseFloat(text).toString();
    }
  }
  displayEl.textContent = text;
}

function inputDigit(d) {
  if (currentInput === 'ERROR') return;
  if (lastPressedEquals) {
    currentInput = '0';
    lastPressedEquals = false;
    accumulator = null;
    pendingOp = null;
  }
  if (d === '.') {
    if (currentInput.includes('.')) return;
    currentInput += '.';
    return;
  }
  if (currentInput === '0') currentInput = d;
  else {
    if (currentInput.replace('.', '').length >= MAX_DIGITS) return;
    currentInput += d;
  }
}

function clearAll() {
  currentInput = '0';
  accumulator = null;
  pendingOp = null;
  lastPressedEquals = false;
}

function toggleNegate() {
  if (currentInput === 'ERROR') return;
  if (currentInput === '0') return;
  if (currentInput.startsWith('-')) currentInput = currentInput.slice(1);
  else currentInput = '-' + currentInput;
}

function percent() {
  if (currentInput === 'ERROR') return;
  let n = Number(currentInput);
  if (!Number.isFinite(n)) { currentInput = 'ERROR'; return; }
  n = n / 100;
  currentInput = String(n);
}

function compute(a, b, op) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return NaN;
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/':
      if (b === 0) return null;
      return a / b;
    default: return b;
  }
}

function pressOperator(opSymbol) {
  if (currentInput === 'ERROR') return;
  const opMap = { '×': '*', '÷': '/', '+': '+', '−': '-' };
  const op = opMap[opSymbol] || opSymbol;

  const inputVal = Number(currentInput);
  if (accumulator === null) {
    accumulator = inputVal;
  } else if (!lastPressedEquals || pendingOp) {
    const result = compute(accumulator, inputVal, pendingOp || op);
    if (result === null) {
      currentInput = 'ERROR';
      accumulator = null;
      pendingOp = null;
      updateDisplay();
      return;
    }
    accumulator = result;
  }

  pendingOp = op;
  currentInput = '0';
  lastPressedEquals = false;
}

function pressEquals() {
  if (currentInput === 'ERROR') return;
  if (pendingOp === null) {
    lastPressedEquals = true;
    return;
  }
  const inputVal = Number(currentInput);
  const result = compute(accumulator === null ? 0 : accumulator, inputVal, pendingOp);
  if (result === null || !Number.isFinite(result)) {
    currentInput = 'ERROR';
    accumulator = null;
    pendingOp = null;
    updateDisplay();
    return;
  }
  currentInput = String(roundForDisplay(result));
  accumulator = null;
  pendingOp = null;
  lastPressedEquals = true;
}

function roundForDisplay(n) {
  if (!Number.isFinite(n)) return n;
  const abs = Math.abs(n);
  if (abs > 1e12 || (abs !== 0 && abs < 1e-12)) {
    return Number(n.toExponential(12));
  }
  const s = Number(n.toPrecision(12));
  return s;
}

function handleButtonPress(target) {
  if (!target) return;
  const action = target.dataset.action;
  const val = target.dataset.value;
  if (val !== undefined) {
    inputDigit(val);
    updateDisplay();
    return;
  }
  switch (action) {
    case 'clear':
      clearAll();
      updateDisplay();
      break;
    case 'negate':
      toggleNegate();
      updateDisplay();
      break;
    case 'percent':
      percent();
      updateDisplay();
      break;
    case 'operator':
      pressOperator(target.dataset.op);
      updateDisplay();
      break;
    case 'equals':
      pressEquals();
      updateDisplay();
      break;
    default:
      break;
  }
}

/* Click handlers */
buttons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    handleButtonPress(e.currentTarget);
  });
});

/* Keyboard support */
window.addEventListener('keydown', (e) => {
  if ((e.key >= '0' && e.key <= '9') || e.key === '.') {
    e.preventDefault();
    inputDigit(e.key);
    updateDisplay();
    return;
  }
  switch (e.key) {
    case '+':
      pressOperator('+'); updateDisplay(); break;
    case '-':
      pressOperator('−'); updateDisplay(); break;
    case '*':
    case 'x':
    case 'X':
      pressOperator('×'); updateDisplay(); break;
    case '/':
      pressOperator('÷'); updateDisplay(); break;
    case 'Enter':
    case '=':
      e.preventDefault();
      pressEquals(); updateDisplay();
      break;
    case 'Backspace':
      if (lastPressedEquals) clearAll();
      else {
        if (currentInput.length <= 1) currentInput = '0';
        else currentInput = currentInput.slice(0, -1);
      }
      updateDisplay();
      break;
    case 'Escape':
      clearAll(); updateDisplay(); break;
    case '%':
      percent(); updateDisplay(); break;
    default:
      break;
  }
});

updateDisplay();

/* =========================
   Theme & glass toggle logic
   ========================= */
const THEME_KEY = 'calculator_theme';
const GLASS_KEY = 'calculator_glass_mode';
const themeSelect = document.getElementById('themeSelect');
const glassToggleBtn = document.getElementById('glassToggle');

function applySavedSettings() {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
  setTheme(savedTheme);
  if (themeSelect) themeSelect.value = savedTheme;

  const savedGlass = localStorage.getItem(GLASS_KEY);
  const glassOn = savedGlass === 'true';
  if (glassOn) document.body.classList.add('transparent-buttons');
  else document.body.classList.remove('transparent-buttons');
  if (glassToggleBtn) {
    glassToggleBtn.setAttribute('aria-pressed', String(glassOn));
    glassToggleBtn.textContent = glassOn ? 'Glass: ON' : 'Toggle Glass';
  }
}

function setTheme(name) {
  document.documentElement.setAttribute('data-theme', name);
  localStorage.setItem(THEME_KEY, name);
}

function toggleTransparentButtons(enable) {
  const body = document.body;
  let newState;
  if (typeof enable === 'undefined') {
    body.classList.toggle('transparent-buttons');
    newState = body.classList.contains('transparent-buttons');
  } else {
    if (enable) body.classList.add('transparent-buttons');
    else body.classList.remove('transparent-buttons');
    newState = enable;
  }
  localStorage.setItem(GLASS_KEY, String(newState));
  if (glassToggleBtn) {
    glassToggleBtn.setAttribute('aria-pressed', String(newState));
    glassToggleBtn.textContent = newState ? 'Glass: ON' : 'Toggle Glass';
  }
  return newState;
}

if (themeSelect) {
  themeSelect.addEventListener('change', (e) => {
    setTheme(e.target.value);
    if (e.target.value === 'glass') toggleTransparentButtons(true);
  });
}
if (glassToggleBtn) {
  glassToggleBtn.addEventListener('click', () => {
    toggleTransparentButtons();
  });
}

/* Expose helpers for console/debugging */
window.setTheme = setTheme;
window.toggleTransparentButtons = toggleTransparentButtons;

/* Apply on load */
applySavedSettings();

/* =========================
   Background Image Switcher
   ========================= */
const BG_KEY = "calculator_background";
const bgSelect = document.getElementById("bgSelect");

/* default images — filenames relative to this HTML file.
   Replace these names if your images use different filenames.
*/
const defaultBg = "bg1.jpg";

function setBackground(img) {
  // set CSS background-image on body (will transition)
  document.body.style.backgroundImage = `url('${img}')`;
  localStorage.setItem(BG_KEY, img);
}

function loadBackground() {
  const savedBG = localStorage.getItem(BG_KEY) || defaultBg;
  setBackground(savedBG);
  if (bgSelect) bgSelect.value = savedBG;
}

if (bgSelect) {
  bgSelect.addEventListener("change", (e) => {
    setBackground(e.target.value);
  });
}

/* Initialize background on startup */
loadBackground();
