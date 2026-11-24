const display = document.querySelector("#display");
const calc = document.querySelector("#calc");

let current = "0";
let stored = null;
let operator = null;
let overwrite = false;

const MAX_DIGITS = 12;

function formatResult(value) {
  if (!Number.isFinite(value)) return "错误";
  const rounded = Math.round(value * 1e10) / 1e10;
  const text = String(rounded);
  if (text.replace("-", "").replace(".", "").length > MAX_DIGITS) {
    return rounded.toExponential(6).replace(/\.?0+e/, "e");
  }
  return text;
}

function render() {
  display.textContent = current;
  calc.querySelectorAll("[data-op]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.op === operator && overwrite);
  });
}

function inputDigit(digit) {
  if (current === "错误") clearAll();
  if (overwrite) {
    current = digit;
    overwrite = false;
  } else if (current === "0") {
    current = digit;
  } else if (current === "-0") {
    current = "-" + digit;
  } else if (current.replace("-", "").replace(".", "").length >= MAX_DIGITS) {
    return;
  } else {
    current += digit;
  }
  render();
}

function inputDecimal() {
  if (current === "错误") clearAll();
  if (overwrite) {
    current = "0.";
    overwrite = false;
  } else if (!current.includes(".")) {
    current += ".";
  }
  render();
}

function setOperator(next) {
  if (current === "错误") return;
  if (operator && !overwrite) {
    evaluate();
    if (current === "错误") return;
  }
  stored = current;
  operator = next;
  overwrite = true;
  render();
}

function evaluate() {
  if (operator === null || stored === null || current === "错误") return;
  const left = Number(stored);
  const right = Number(current);
  let value;
  if (operator === "+") value = left + right;
  else if (operator === "-") value = left - right;
  else if (operator === "*") value = left * right;
  else if (operator === "/") value = right === 0 ? Infinity : left / right;

  current = formatResult(value);
  stored = null;
  operator = null;
  overwrite = true;
  render();
}

function clearAll() {
  current = "0";
  stored = null;
  operator = null;
  overwrite = false;
  render();
}

function toggleSign() {
  if (current === "错误" || current === "0") return;
  current = current.startsWith("-") ? current.slice(1) : "-" + current;
  render();
}

function percent() {
  if (current === "错误") return;
  current = formatResult(Number(current) / 100);
  overwrite = true;
  render();
}

calc.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.digit) inputDigit(button.dataset.digit);
  else if (button.dataset.op) setOperator(button.dataset.op);
  else if (button.dataset.action === "decimal") inputDecimal();
  else if (button.dataset.action === "equals") evaluate();
  else if (button.dataset.action === "clear") clearAll();
  else if (button.dataset.action === "sign") toggleSign();
  else if (button.dataset.action === "percent") percent();
});

document.addEventListener("keydown", (event) => {
  if (event.key >= "0" && event.key <= "9") inputDigit(event.key);
  else if (event.key === ".") inputDecimal();
  else if (event.key === "+" || event.key === "-" || event.key === "*" || event.key === "/") {
    setOperator(event.key);
  } else if (event.key === "Enter" || event.key === "=") {
    event.preventDefault();
    evaluate();
  } else if (event.key === "Escape") clearAll();
  else if (event.key === "%") percent();
});
