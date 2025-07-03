document.addEventListener('DOMContentLoaded', () => {
    const inputLine = document.getElementById('input-line');
    const resultLine = document.getElementById('result-line');
    const keypad = document.getElementById('main-keypad');
    const modeSelector = document.getElementById('mode-selector');
    const modePanels = document.querySelectorAll('.mode-panel');

    let currentExpression = '';
    let lastResult = '0';
    let memoryValue = 0;
    let shiftActive = false; // For 2nd functions

    // --- Core Calculator Logic (Scientific Mode) ---
    keypad.addEventListener('click', (e) => {
        const button = e.target;
        if (!button.classList.contains('btn')) return;

        const value = button.textContent;
        const action = button.dataset.action;
        const operator = button.dataset.op;

        if (operator) {
            currentExpression += operator;
        } else if (action) {
            handleAction(action);
        } else if (button.classList.contains('num')) {
            currentExpression += value;
        } else if (button.classList.contains('func')) {
            handleFunction(value);
        }

        inputLine.textContent = currentExpression;
        // For simplicity, auto-calculate or only calculate on '='
        if (operator === '=' || action === 'calculate') {
             calculateResult();
        } else {
             // For dynamic updates, might need a more sophisticated parser
             // calculateIntermediateResult();
        }
    });

    function handleAction(action) {
        switch (action) {
            case 'clear':
                currentExpression = '';
                resultLine.textContent = '= 0';
                lastResult = '0';
                break;
            case 'delete':
                currentExpression = currentExpression.slice(0, -1);
                break;
            case 'calculate':
                calculateResult();
                break;
            case 'ans':
                currentExpression += `(${lastResult})`; // Use previous result
                break;
            case 'paren-open':
                currentExpression += '(';
                break;
            case 'paren-close':
                currentExpression += ')';
                break;
            case 'decimal':
                // Basic check to prevent multiple decimals in a number
                const lastNumMatch = currentExpression.match(/(\d+\.?\d*|\d*)$/);
                if (lastNumMatch && !lastNumMatch[0].includes('.')) {
                    currentExpression += '.';
                } else if (!lastNumMatch) { // Start a new number with decimal
                     currentExpression += '0.';
                }
                break;
            case 'shift':
                shiftActive = !shiftActive;
                // Add visual feedback for shift button
                button.classList.toggle('active', shiftActive);
                // Dynamically change text of some buttons (e.g., sin -> asin)
                // This would be more complex and require mapping
                break;
            // Memory functions
            case 'm-plus':
                try { memoryValue += parseFloat(lastResult); } catch (e) { console.error(e); }
                break;
            case 'm-minus':
                try { memoryValue -= parseFloat(lastResult); } catch (e) { console.error(e); }
                break;
            case 'mr':
                currentExpression += memoryValue.toString();
                break;
            case 'mc':
                memoryValue = 0;
                break;
            case 'sqrt':
                currentExpression += 'sqrt('; // Expect user to close paren
                break;
            case 'power':
                currentExpression += '^';
                break;
            case 'pi':
                currentExpression += Math.PI.toString();
                break;
            // ... more actions
        }
    }

    function handleFunction(funcName) {
        let actualFunc = funcName.toLowerCase();
        if (shiftActive) {
            // Map shifted functions (e.g., sin -> asin)
            switch (actualFunc) {
                case 'sin': actualFunc = 'asin'; break;
                case 'cos': actualFunc = 'acos'; break;
                case 'tan': actualFunc = 'atan'; break;
                case 'log': actualFunc = '10^'; break; // Placeholder for 10^x
                case 'ln': actualFunc = 'e^'; break; // Placeholder for e^x
                // ... other shifted functions
            }
        }

        switch (actualFunc) {
            case 'sin':
            case 'cos':
            case 'tan':
            case 'log':
            case 'ln':
            case 'asin':
            case 'acos':
            case 'atan':
            case 'factorial':
                currentExpression += `${actualFunc}(`; // Add function call and open paren
                break;
            // ... more functions
            case 'x!': // Specific case for factorial button
                currentExpression += '!'; // Add after number
                break;
        }
        shiftActive = false; // Reset shift after use
        document.querySelector('.shift-btn').classList.remove('active');
    }

    function calculateResult() {
        try {
            // IMPORTANT: eval() is DANGEROUS for user input.
            // A robust calculator needs a SAFE expression parser (e.g., math.js).
            // This is just for demonstration.
            let expressionToEval = currentExpression.replace(/π/g, 'Math.PI')
                                                  .replace(/e\^/g, 'Math.exp')
                                                  .replace(/\^/g, '**'); // JS power operator

            // Basic function replacements (requires more sophisticated parsing for nested calls)
            expressionToEval = expressionToEval.replace(/sqrt\(([^)]+)\)/g, 'Math.sqrt($1)');
            expressionToEval = expressionToEval.replace(/sin\(([^)]+)\)/g, 'Math.sin($1)');
            expressionToEval = expressionToEval.replace(/cos\(([^)]+)\)/g, 'Math.cos($1)');
            expressionToEval = expressionToEval.replace(/tan\(([^)]+)\)/g, 'Math.tan($1)');
            expressionToEval = expressionToEval.replace(/log\(([^)]+)\)/g, 'Math.log10($1)'); // Base 10 log
            expressionToEval = expressionToEval.replace(/ln\(([^)]+)\)/g, 'Math.log($1)');   // Natural log

            // Factorial (simple implementation for positive integers)
            expressionToEval = expressionToEval.replace(/(\d+)!/g, (match, num) => {
                let n = parseInt(num);
                if (n < 0) throw new Error("Factorial of negative number!");
                if (n === 0) return 1;
                let res = 1;
                for (let i = 2; i <= n; i++) res *= i;
                return res;
            });


            let result = eval(expressionToEval); // DANGER ZONE!
            if (isNaN(result) || !isFinite(result)) {
                throw new Error("Invalid calculation");
            }

            // Surd simplification (conceptual - extremely complex without a CAS library)
            // if (Math.abs(result - Math.round(result)) < 1e-9) { // Check if it's an integer
            //     // Example: sqrt(8) -> 2 * Math.sqrt(2)
            //     // This requires prime factorization and radical simplification logic
            //     // E.g., simplifySqrt(8) -> "2√2"
            //     result = simplifySurd(result); // Placeholder for advanced surd simplification
            // }


            lastResult = result.toString();
            resultLine.textContent = `= ${lastResult}`;
            currentExpression = lastResult; // Set current expression to the result for chaining
        } catch (error) {
            resultLine.textContent = `= Error`;
            currentExpression = ''; // Clear expression on error
            console.error("Calculation error:", error);
        }
    }

    // --- Mode Switching Logic ---
    modeSelector.addEventListener('change', (e) => {
        const selectedMode = e.target.value;

        // Hide all mode panels
        modePanels.forEach(panel => panel.classList.add('hidden'));

        // Show the selected mode panel
        const targetPanelId = `${selectedMode}-panel`;
        const targetPanel = document.getElementById(targetPanelId);
        if (targetPanel) {
            targetPanel.classList.remove('hidden');
        }

        // Adjust keypad visibility if needed (e.g., hide some buttons for non-scientific modes)
        // For this design, keypad is always visible, but mode panels appear above it.
    });

    // --- Mode-Specific Functionality (Placeholders) ---

    // Equations Mode
    document.getElementById('solve-linear')?.addEventListener('click', () => {
        const a1 = parseFloat(document.getElementById('a1').value);
        const b1 = parseFloat(document.getElementById('b1').value);
        const c1 = parseFloat(document.getElementById('c1').value);
        const a2 = parseFloat(document.getElementById('a2').value);
        const b2 = parseFloat(document.getElementById('b2').value);
        const c2 = parseFloat(document.getElementById('c2').value);

        // Basic 2x2 linear solver (Cramer's rule or substitution)
        const det = a1 * b2 - a2 * b1;
        if (det === 0) {
            document.getElementById('linear-solution').textContent = "No unique solution (parallel or same lines)";
        } else {
            const x = (c1 * b2 - c2 * b1) / det;
            const y = (a1 * c2 - a2 * c1) / det;
            document.getElementById('linear-solution').textContent = `x = ${x.toFixed(4)}, y = ${y.toFixed(4)}`;
        }
    });

    // Functions Mode
    let definedFunction = null;
    document.getElementById('define-function')?.addEventListener('click', () => {
        const funcString = document.getElementById('function-input').value;
        try {
            // Again, use a safe parser for eval, e.g., definedFunction = new Function('x', `return ${funcString};`);
            // This is just a conceptual placeholder
            definedFunction = (x) => eval(funcString.replace(/x/g, `(${x})`)); // UNSAFE!
            alert('Function defined!');
        } catch (e) {
            alert('Error defining function: ' + e.message);
            definedFunction = null;
        }
    });

    document.getElementById('evaluate-function')?.addEventListener('click', () => {
        if (!definedFunction) {
            document.getElementById('function-result').textContent = 'Please define a function first.';
            return;
        }
        const xVal = parseFloat(document.getElementById('x-value').value);
        if (isNaN(xVal)) {
            document.getElementById('function-result').textContent = 'Please enter a valid x value.';
            return;
        }
        try {
            const result = definedFunction(xVal);
            document.getElementById('function-result').textContent = `f(${xVal}) = ${result.toFixed(4)}`;
        } catch (e) {
            document.getElementById('function-result').textContent = 'Error evaluating function: ' + e.message;
        }
    });

    // Statistics Mode
    document.getElementById('analyze-data')?.addEventListener('click', () => {
        const dataInput = document.getElementById('data-input').value;
        const data = dataInput.split(/,|\n/).map(s => parseFloat(s.trim())).filter(n => !isNaN(n));

        if (data.length === 0) {
            document.getElementById('stats-results').textContent = 'No valid data entered.';
            return;
        }

        data.sort((a, b) => a - b); // For median

        const n = data.length;
        const sum = data.reduce((acc, val) => acc + val, 0);
        const mean = sum / n;

        // Median
        let median;
        if (n % 2 === 0) {
            median = (data[n / 2 - 1] + data[n / 2]) / 2;
        } else {
            median = data[Math.floor(n / 2)];
        }

        // Mode (simple)
        const counts = {};
        data.forEach(d => { counts[d] = (counts[d] || 0) + 1; });
        let mode = [];
        let maxCount = 0;
        for (const num in counts) {
            if (counts[num] > maxCount) {
                maxCount = counts[num];
                mode = [parseFloat(num)];
            } else if (counts[num] === maxCount && maxCount > 1) {
                mode.push(parseFloat(num));
            }
        }
        const modeStr = mode.length === 0 ? 'No mode' : (mode.length === Object.keys(counts).length ? 'No unique mode' : mode.join(', '));


        // Standard Deviation (sample)
        const sumSqDiff = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
        const variance = n > 1 ? sumSqDiff / (n - 1) : 0;
        const stdDev = Math.sqrt(variance);

        document.getElementById('stats-results').innerHTML = `
            <p>Count (n): ${n}</p>
            <p>Mean: ${mean.toFixed(4)}</p>
            <p>Median: ${median.toFixed(4)}</p>
            <p>Mode: ${modeStr}</p>
            <p>Standard Deviation (sample): ${stdDev.toFixed(4)}</p>
            <p>Variance (sample): ${variance.toFixed(4)}</p>
            <p>Min: ${data[0]}</p>
            <p>Max: ${data[data.length - 1]}</p>
        `;
    });

    // Initialize to Scientific mode
    modeSelector.value = 'scientific';
    document.getElementById('scientific-panel')?.classList.remove('hidden'); // Assuming scientific panel doesn't exist, just the main keypad

});