const resultDisplay = document.querySelector("#result");
const expressionDisplay = document.querySelector("#expression");
const messageDisplay = document.querySelector("#message");

let current = "0";
let storedValue = null;
let pendingOperator = null;
let replaceCurrent = false;

const operatorLabels = { "+": "+", "-": "−", "*": "×", "/": "÷" };

function render() {
  resultDisplay.textContent = current;
}

function clearMessage() {
  messageDisplay.textContent = "";
}

function enterDigit(digit) {
  clearMessage();
  if (replaceCurrent || current === "0") {
    current = digit;
    replaceCurrent = false;
  } else if (current.replace("-", "").length < 14) {
    current += digit;
  }
  render();
}

function enterDecimal() {
  clearMessage();
  if (replaceCurrent) {
    current = "0";
    replaceCurrent = false;
  }
  if (!current.includes(".")) current += ".";
  render();
}

function clearAll() {
  current = "0";
  storedValue = null;
  pendingOperator = null;
  replaceCurrent = false;
  expressionDisplay.textContent = "Positivity's calculator";
  clearMessage();
  render();
}

async function selectOperator(operator) {
  if (pendingOperator && !replaceCurrent) {
    await calculate();
  }
  storedValue = Number(current);
  pendingOperator = operator;
  replaceCurrent = true;
  expressionDisplay.textContent = `${current} ${operatorLabels[operator]}`;
  clearMessage();
}

async function calculate() {
  if (pendingOperator === null || storedValue === null) return;

  const left = storedValue;
  const right = Number(current);
  const operator = pendingOperator;
  expressionDisplay.textContent = `${left} ${operatorLabels[operator]} ${right} =`;
  pendingOperator = null;
  storedValue = null;
  replaceCurrent = true;

  try {
    const response = await fetch("/api/calc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ left, operator, right }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Calculation failed.");
    }
    current = String(data.result);
    render();
    clearMessage();
  } catch (error) {
    messageDisplay.textContent = error.message || "Unable to reach the calculator API.";
  }
}

function applyAction(action) {
  clearMessage();
  if (action === "clear") clearAll();
  if (action === "decimal") enterDecimal();
  if (action === "equals") calculate();
  if (action === "sign" && current !== "0") {
    current = current.startsWith("-") ? current.slice(1) : `-${current}`;
    render();
  }
  if (action === "percent") {
    current = String(Number(current) / 100);
    render();
  }
  if (action === "backspace") {
    current = current.length > 1 ? current.slice(0, -1) : "0";
    if (current === "-") current = "0";
    render();
  }
}

document.querySelector(".keypad").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.digit !== undefined) enterDigit(button.dataset.digit);
  if (button.dataset.operator) selectOperator(button.dataset.operator);
  if (button.dataset.action) applyAction(button.dataset.action);
});

document.addEventListener("keydown", (event) => {
  if (/^\d$/.test(event.key)) enterDigit(event.key);
  else if (event.key === ".") enterDecimal();
  else if (["+", "-", "*", "/"].includes(event.key)) selectOperator(event.key);
  else if (event.key === "Enter" || event.key === "=") calculate();
  else if (event.key === "Escape") clearAll();
  else if (event.key === "Backspace") applyAction("backspace");
  else return;
  event.preventDefault();
});

render();
