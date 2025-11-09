/* script.js
   Calculator with theme presets and persistent backgrounds.
   Updated: removed separate glass toggle; glass is controlled by themeSelect only.
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

/* Click handlers: add temporary 'clicked' class for visual press feedback */
buttons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    btn.classList.add('clicked');
    setTimeout(() => btn.classList.remove('clicked'), 120);
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
   Theme logic (glass controlled by themeSelect only)
   ========================= */
const THEME_KEY = 'calculator_theme';
const themeSelect = document.getElementById('themeSelect');

function applySavedSettings() {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
  setTheme(savedTheme);
  if (themeSelect) themeSelect.value = savedTheme;
}

function setTheme(name) {
  // apply data-theme attribute
  document.documentElement.setAttribute('data-theme', name);
  // update glass class based on theme
  if (name === 'glass') {
    document.body.classList.add('transparent-buttons');
  } else {
    document.body.classList.remove('transparent-buttons');
  }
  localStorage.setItem(THEME_KEY, name);
}

if (themeSelect) {
  themeSelect.addEventListener('change', (e) => {
    setTheme(e.target.value);
    updateDisplay();
  });
}

/* Expose helpers for console/debugging */
window.setTheme = setTheme;

/* Apply on load */
applySavedSettings();

/* =========================
   Background Image Switcher
   ========================= */
const BG_KEY = "calculator_background";
const bgSelect = document.getElementById("bgSelect");
const defaultBg = "background/1.jpg";

function setBackground(img) {
  if (!img || img === "none") {
    document.body.style.backgroundImage = '';
  } else {
    document.body.style.backgroundImage = `url('${img}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';
  }
  localStorage.setItem(BG_KEY, img);
}

function loadBackground() {
  let savedBG = localStorage.getItem(BG_KEY);
  if (!savedBG) {
    savedBG = defaultBg;
    localStorage.setItem(BG_KEY, defaultBg);
  }
  setBackground(savedBG);
  if (bgSelect) bgSelect.value = savedBG;
}

if (bgSelect) {
  bgSelect.addEventListener("change", (e) => {
    setBackground(e.target.value);
  });
}

loadBackground();
