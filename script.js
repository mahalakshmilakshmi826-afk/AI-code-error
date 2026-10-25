
const codeInput = document.getElementById("code");
const languageSelect = document.getElementById("language");
const results = document.getElementById("results");

const examples = {
  python: `def greet(name)
    print("Hello", name)

greet("Student")`,

  javascript: `function greet(name) {
  console.log("Hello " + name)
}

console.log(greet("Student");`,

  java: `public class Main {
    public static void main(String[] args) {
        int number = "hello";
        System.out.println(number);
    }
}`,

  c: `#include <stdio.h>

int main() {
    int number = 10
    printf("%d", number);
    return 0;
}`,

  cpp: `#include <iostream>
using namespace std;

int main() {
    int number = "hello";
    cout << number << endl;
    return 0;
}`
};

function makeFinding(title, description, fix, type = "error") {
  return { title, description, fix, type };
}

function analyzeCode() {
  const code = codeInput.value;
  const language = languageSelect.value;
  const findings = [];

  if (!code.trim()) {
    showResults([], "Please enter some code before analyzing.");
    return;
  }

  if (language === "python") {
    const lines = code.split("\n");

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (
        /^(def|if|elif|else|for|while|class|try|except|finally|with)\b/.test(trimmed) &&
        !trimmed.endsWith(":")
      ) {
        findings.push(makeFinding(
          "Possible missing colon",
          `Line ${index + 1}: Python block statements normally end with a colon (:).`,
          `Review line ${index + 1} and add a colon if needed.`
        ));
      }
    });

    if (
      /^\s*def\s+\w+\s*\([^)]*\)\s*:/m.test(code) &&
      !/^\s{1,}\S/m.test(code)
    ) {
      findings.push(makeFinding(
        "Check indentation",
        "Python requires an indented body inside a function.",
        "Example:\ndef greet():\n    print('Hello')",
        "warning"
      ));
    }
  }

  if (language === "javascript") {
    const opens = (code.match(/\(/g) || []).length;
    const closes = (code.match(/\)/g) || []).length;

    if (opens !== closes) {
      findings.push(makeFinding(
        "Unbalanced parentheses",
        "Opening and closing parentheses do not match.",
        "Check that every opening ( has a matching )."
      ));
    }

    if (/^\s*const\s+\w+\s*=\s*;?\s*$/m.test(code)) {
      findings.push(makeFinding(
        "Missing variable value",
        "A const declaration must have an initial value.",
        "Example: const score = 10;"
      ));
    }
  }

  if (language === "java") {
    if (/\bint\s+\w+\s*=\s*["']/.test(code)) {
      findings.push(makeFinding(
        "Incompatible data types",
        "An int variable cannot store a text string.",
        "Example: int number = 10;"
      ));
    }

    if (/System\.out\.println\s*\([^;]*\)\s*(?=\n|$)/m.test(code)) {
      findings.push(makeFinding(
        "Possible missing semicolon",
        "Java statements normally end with a semicolon (;).",
        'Example: System.out.println("Hello");',
        "warning"
      ));
    }
  }

  if (language === "c" || language === "cpp") {
    if (/\bint\s+\w+\s*=\s*["']/.test(code)) {
      findings.push(makeFinding(
        "Incompatible data types",
        "An int variable cannot store a text string.",
        "Example: int number = 10;"
      ));
    }

    if (/^\s*int\s+\w+\s*=\s*[^;\n]+$/m.test(code)) {
      findings.push(makeFinding(
        "Possible missing semicolon",
        "A variable declaration may be missing a semicolon.",
        "Example: int number = 10;"
      ));
    }

    if (language === "c" &&
        /printf\s*\(/.test(code) &&
        !/#include\s*<stdio\.h>/.test(code)) {
      findings.push(makeFinding(
        "Check header file",
        "C programs using printf normally include stdio.h.",
        "Add #include <stdio.h> at the top of your file.",
        "warning"
      ));
    }

    if (language === "cpp" &&
        /cout\s*<</.test(code) &&
        !/#include\s*<iostream>/.test(code)) {
      findings.push(makeFinding(
        "Check header file",
        "C++ programs using cout normally include iostream.",
        "Add #include <iostream> at the top of your file.",
        "warning"
      ));
    }
  }

  const openingBraces = (code.match(/\{/g) || []).length;
  const closingBraces = (code.match(/\}/g) || []).length;

  if (openingBraces !== closingBraces) {
    findings.push(makeFinding(
      "Unbalanced braces",
      "Opening and closing curly braces do not match.",
      "Check that each { has a matching }."
    ));
  }

  showResults(findings, "Analysis complete");
}

function showResults(findings, statusText) {
  const heading = `
    <div class="result-heading">
      <h2>Analysis Results</h2>
      <span class="status">${escapeHTML(statusText)}</span>
    </div>
  `;

  if (statusText.startsWith("Please enter")) {
    results.innerHTML = heading +
      `<div class="empty">${escapeHTML(statusText)}</div>`;
    return;
  }

  if (findings.length === 0) {
    results.innerHTML = heading + `
      <div class="result-card success">
        <h3>✓ No known patterns detected</h3>
        <p>
          This prototype did not detect its selected error patterns.
          Your program may still contain errors.
        </p>
      </div>
    `;
    return;
  }

  const cards = findings.map(item => `
    <div class="result-card ${item.type}">
      <h3>${item.type === "warning" ? "⚠️" : "🔎"}
        ${escapeHTML(item.title)}
      </h3>
      <p><strong>Explanation:</strong>
        ${escapeHTML(item.description)}
      </p>
      <p><strong>Suggested fix:</strong></p>
      <pre>${escapeHTML(item.fix)}</pre>
    </div>
  `).join("");

  results.innerHTML = heading + cards;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

document.getElementById("analyzeBtn").addEventListener("click", analyzeCode);

document.getElementById("exampleBtn").addEventListener("click", () => {
  codeInput.value = examples[languageSelect.value];
  analyzeCode();
});

document.getElementById("clearBtn").addEventListener("click", () => {
  codeInput.value = "";

  results.innerHTML = `
    <div class="result-heading">
      <h2>Analysis Results</h2>
      <span class="status">Waiting for code</span>
    </div>
    <div class="empty">Enter some code and click Analyze Code.</div>
  `;

  codeInput.focus();
});

document.getElementById("copyBtn").addEventListener("click", async () => {
  if (!codeInput.value) {
    alert("Please enter some code first.");
    return;
  }

  try {
    await navigator.clipboard.writeText(codeInput.value);
    alert("Code copied successfully!");
  } catch {
    codeInput.select();
    const copied = document.execCommand("copy");
    alert(copied ? "Code copied successfully!" : "Copy failed. Please copy manually.");
  }
});
