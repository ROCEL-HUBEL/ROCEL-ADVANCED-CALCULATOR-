document.addEventListener('DOMContentLoaded', () => {
    const inputLine = document.getElementById('input-line');
    const resultLine = document.getElementById('result-line');
    const keypad = document.getElementById('main-keypad');
    const modeSelector = document.getElementById('mode-selector');
    const modePanels = document.querySelectorAll('.mode-panel');

    let currentExpression = '';
    let lastResult = '0';
    let memoryValue = 0;
    let shiftActive = false;

    // --- Helper Functions ---
    const updateDisplay = () => {
        inputLine.textContent = currentExpression === '' ? '0' : currentExpression;
        resultLine.textContent = `= ${lastResult}`;
    };

    const clearAll = () => {
        currentExpression = '';
        lastResult = '0';
        updateDisplay();
    };

    const deleteLast = () => {
        currentExpression = currentExpression.slice(0, -1);
        if (currentExpression === '') {
            lastResult = '0'; // Reset result if expression is empty
        }
        updateDisplay();
    };

    const calculateResult = () => {
        try {
            if (currentExpression.trim() === '') {
                lastResult = '0';
                return;
            }
            // Replace Ans with its value
            let expressionToEvaluate = currentExpression.replace(/Ans/g, `(${lastResult})`);

            // Handle power operator ^ by converting to ** for math.evaluate
            expressionToEvaluate = expressionToEvaluate.replace(/\^/g, '**');

            const result = math.evaluate(expressionToEvaluate);

            let formattedResult = result.toString();

            // Attempt to simplify if the result is a Fraction or a complex number might be formatted
            if (typeof result === 'object' && result.type === 'Fraction') {
                formattedResult = result.toFraction();
            } else if (typeof result === 'object' && result.type === 'Complex') {
                // Math.js automatically formats complex numbers as "a + bi"
                formattedResult = result.toString();
            }
            // For Surds, math.js might return a number if evaluated,
            // or you'd need specific symbolic simplification (more advanced).
            // For now, rely on math.evaluate to give a numerical result.

            lastResult = formattedResult;
            resultLine.textContent = `= ${lastResult}`;
            currentExpression = lastResult; // Allow chaining calculations
        } catch (error) {
            resultLine.textContent = `= Error`;
            currentExpression = '';
            console.error("Calculation error:", error);
        }
    };

    // --- Keypad Event Listener ---
    keypad.addEventListener('click', (e) => {
        const button = e.target;
        if (!button.classList.contains('btn')) return;

        const value = button.textContent;
        const action = button.dataset.action;
        const op = button.dataset.op;

        if (action) {
            switch (action) {
                case 'clear':
                    clearAll();
                    break;
                case 'delete':
                    deleteLast();
                    break;
                case 'calculate':
                    calculateResult();
                    break;
                case 'ans':
                    currentExpression += 'Ans';
                    break;
                case 'power':
                    currentExpression += '^';
                    break;
                case 'sqrt':
                    currentExpression += 'sqrt(';
                    break;
                case 'decimal':
                    if (currentExpression === '' || /[+\-*/^]$/.test(currentExpression)) {
                        currentExpression += '0.'; // Prevent starting with just '.'
                    } else if (!currentExpression.split(/[\+\-\*\/^()]/).pop().includes('.')) {
                        currentExpression += '.';
                    }
                    break;
                case 'paren-open':
                    currentExpression += '(';
                    break;
                case 'paren-close':
                    currentExpression += ')';
                    break;
                case 'sin':
                    currentExpression += 'sin(';
                    break;
                case 'cos':
                    currentExpression += 'cos(';
                    break;
                case 'tan':
                    currentExpression += 'tan(';
                    break;
                case 'log':
                    currentExpression += 'log10('; // Common log (base 10)
                    break;
                case 'ln':
                    currentExpression += 'log('; // Natural log (base e)
                    break;
                case 'factorial':
                    currentExpression += '!'; // For math.js, this works directly
                    break;
                case 'pi':
                    currentExpression += 'pi'; // math.js recognizes 'pi'
                    break;
                case 'e':
                    currentExpression += 'e'; // math.js recognizes 'e'
                    break;
                case 'shift':
                    shiftActive = !shiftActive;
                    // You'd typically change button texts here, e.g., sin to asin
                    button.classList.toggle('active', shiftActive);
                    break;
                case 'm-plus':
                    try { memoryValue += math.evaluate(currentExpression); } catch (e) { console.error("Memory error:", e); }
                    currentExpression = '';
                    lastResult = memoryValue.toString();
                    resultLine.textContent = `= M+ ${lastResult}`;
                    break;
                case 'm-minus':
                    try { memoryValue -= math.evaluate(currentExpression); } catch (e) { console.error("Memory error:", e); }
                    currentExpression = '';
                    lastResult = memoryValue.toString();
                    resultLine.textContent = `= M- ${lastResult}`;
                    break;
                case 'mr': // Memory Recall
                    currentExpression += memoryValue.toString();
                    break;
                case 'mc': // Memory Clear
                    memoryValue = 0;
                    currentExpression = '';
                    lastResult = '0';
                    resultLine.textContent = `= M Cleared`;
                    break;
                default:
                    currentExpression += value;
            }
        } else if (op) {
            currentExpression += op;
        } else if (value) {
            currentExpression += value;
        }
        updateDisplay();
    });

    // --- Mode Switching Logic ---
    modeSelector.addEventListener('change', (e) => {
        const selectedMode = e.target.value;

        // Hide all mode panels first
        modePanels.forEach(panel => panel.classList.add('hidden'));

        // Show the selected mode's panel
        const targetPanelId = `${selectedMode}-panel`;
        const targetPanel = document.getElementById(targetPanelId);
        if (targetPanel) {
            targetPanel.classList.remove('hidden');
        }

        // For "scientific" mode, ensure keypad is fully visible (though it's always there in this design)
        // For other modes, we might need to adjust keypad visibility or size if panels take up more space.
    });

    // --- Mode-Specific Functionality ---

    // Equations Mode
    document.getElementById('solve-linear')?.addEventListener('click', () => {
        const a1 = parseFloat(document.getElementById('a1').value);
        const b1 = parseFloat(document.getElementById('b1').value);
        const c1 = parseFloat(document.getElementById('c1').value);
        const a2 = parseFloat(document.getElementById('a2').value);
        const b2 = parseFloat(document.getElementById('b2').value);
        const c2 = parseFloat(document.getElementById('c2').value);
        const solutionDiv = document.getElementById('linear-solution');

        if (isNaN(a1) || isNaN(b1) || isNaN(c1) || isNaN(a2) || isNaN(b2) || isNaN(c2)) {
            solutionDiv.textContent = 'Please enter all coefficients.';
            return;
        }

        try {
            // Using math.js for matrix-based linear equation solving
            const A = math.matrix([[a1, b1], [a2, b2]]);
            const B = math.matrix([c1, c2]);
            const X = math.lusolve(A, B); // LU decomposition solver

            solutionDiv.textContent = `x = ${X.get([0]).toFixed(4)}, y = ${X.get([1]).toFixed(4)}`;
        } catch (e) {
            solutionDiv.textContent = 'No unique solution or error: ' + e.message;
        }
    });

    document.getElementById('solve-general-equation')?.addEventListener('click', () => {
        const equationString = document.getElementById('general-equation-input').value;
        const solutionDiv = document.getElementById('general-equation-solution');
        try {
            // This is for numerical solving (finding roots where expression = 0)
            // math.js's solve is for linear systems or symbolic (if it can)
            // For general numerical root finding (f(x)=0), you'd usually use an iterative method
            // or a specialized library. math.js doesn't have a direct `solve(equationString, variable)` for this.
            // Conceptual approach, this will likely require more complex parsing or a different library.
            // A common approach would be to define a function and find its zero.
            // Example using math.js's parse for conceptual function evaluation:
            // const f = math.parse(equationString.replace(/=0$/, '')); // remove '=0' if present
            // const findRoot = (func, guess) => { /* Implement Newton-Raphson or bisection */ };
            // solutionDiv.textContent = `Solution (conceptual): x ≈ ${findRoot(f, 0.1)}`;

            solutionDiv.textContent = 'Numerical solver for general equations is conceptual. Please input simpler equations or use the scientific mode for direct calculation.';

        } catch (e) {
            solutionDiv.textContent = 'Error solving equation: ' + e.message;
        }
    });

    // Functions Mode
    let definedFunction = null;
    document.getElementById('define-function')?.addEventListener('click', () => {
        const funcString = document.getElementById('function-input').value;
        try {
            // Parse the function string for later evaluation
            definedFunction = math.parse(funcString);
            alert(`Function f(x) = ${funcString} defined!`);
        } catch (e) {
            alert('Error defining function: ' + e.message);
            definedFunction = null;
        }
    });

    document.getElementById('evaluate-function')?.addEventListener('click', () => {
        const xValue = parseFloat(document.getElementById('x-value').value);
        const resultDiv = document.getElementById('function-result');

        if (definedFunction === null) {
            resultDiv.textContent = 'Please define a function first.';
            return;
        }
        if (isNaN(xValue)) {
            resultDiv.textContent = 'Please enter a numerical value for x.';
            return;
        }

        try {
            // Evaluate the parsed function with the given scope
            const scope = { x: xValue };
            const result = definedFunction.evaluate(scope);
            resultDiv.textContent = `f(${xValue}) = ${result.toString()}`;
        } catch (e) {
            resultDiv.textContent = 'Error evaluating function: ' + e.message;
        }
    });

    document.getElementById('derive-function')?.addEventListener('click', () => {
        const funcString = document.getElementById('function-input').value;
        const resultDiv = document.getElementById('derivative-result');
        if (!funcString) {
            resultDiv.textContent = 'Please define a function first.';
            return;
        }
        try {
            // math.js can do symbolic differentiation
            const derivative = math.derivative(funcString, 'x');
            resultDiv.textContent = `Derivative: ${derivative.toString()}`;
        } catch (e) {
            resultDiv.textContent = 'Error deriving function: ' + e.message;
        }
    });

    // Statistics Mode
    document.getElementById('analyze-data')?.addEventListener('click', () => {
        const dataInput = document.getElementById('data-input').value;
        const statsResultsDiv = document.getElementById('stats-results');
        const numbers = dataInput.split(/,|\n/).map(s => parseFloat(s.trim())).filter(n => !isNaN(n));

        if (numbers.length === 0) {
            statsResultsDiv.textContent = 'No valid numbers entered.';
            return;
        }

        try {
            const mean = math.mean(numbers);
            const median = math.median(numbers);
            const stdev = math.std(numbers); // Sample standard deviation
            const variance = math.variance(numbers); // Sample variance
            const min = math.min(numbers);
            const max = math.max(numbers);
            const sum = math.sum(numbers);

            statsResultsDiv.innerHTML = `
                <p>Count: ${numbers.length}</p>
                <p>Mean: ${mean.toFixed(4)}</p>
                <p>Median: ${median.toFixed(4)}</p>
                <p>Std Dev: ${stdev.toFixed(4)}</p>
                <p>Variance: ${variance.toFixed(4)}</p>
                <p>Min: ${min}</p>
                <p>Max: ${max}</p>
                <p>Sum: ${sum}</p>
            `;
        } catch (e) {
            statsResultsDiv.textContent = 'Error analyzing data: ' + e.message;
        }
    });


    // Matrices Mode
    let matrixA = null;
    let matrixB = null;

    function getMatrixFromInputs(prefix, rows = 2, cols = 2) {
        const matrixData = [];
        for (let i = 1; i <= rows; i++) {
            const row = [];
            for (let j = 1; j <= cols; j++) {
                const value = parseFloat(document.getElementById(`${prefix}${i}${j}`).value);
                if (isNaN(value)) throw new Error('Invalid matrix input. Please fill all cells with numbers.');
                row.push(value);
            }
            matrixData.push(row);
        }
        return math.matrix(matrixData); // Create math.js matrix
    }

    document.getElementById('set-matrix-a')?.addEventListener('click', () => {
        try { matrixA = getMatrixFromInputs('ma'); alert('Matrix A set!'); } catch (e) { alert(e.message); }
    });
    document.getElementById('set-matrix-b')?.addEventListener('click', () => {
        try { matrixB = getMatrixFromInputs('mb'); alert('Matrix B set!'); } catch (e) { alert(e.message); }
    });

    document.getElementById('matrix-add')?.addEventListener('click', () => {
        if (!matrixA || !matrixB) { alert('Define both matrices first.'); return; }
        try {
            const result = math.add(matrixA, matrixB);
            document.getElementById('matrix-result').textContent = `A + B = ${result.toString()}`;
        } catch (e) { document.getElementById('matrix-result').textContent = 'Error: ' + e.message; }
    });

    document.getElementById('matrix-multiply')?.addEventListener('click', () => {
        if (!matrixA || !matrixB) { alert('Define both matrices first.'); return; }
        try {
            const result = math.multiply(matrixA, matrixB);
            document.getElementById('matrix-result').textContent = `A * B = ${result.toString()}`;
        } catch (e) { document.getElementById('matrix-result').textContent = 'Error: ' + e.message; }
    });

    document.getElementById('matrix-inverse')?.addEventListener('click', () => {
        if (!matrixA) { alert('Define Matrix A first.'); return; }
        try {
            const result = math.inv(matrixA);
            document.getElementById('matrix-result').textContent = `Inverse A = ${result.toString()}`;
        } catch (e) { document.getElementById('matrix-result').textContent = 'Error: ' + e.message; }
    });

    document.getElementById('matrix-determinant')?.addEventListener('click', () => {
        if (!matrixA) { alert('Define Matrix A first.'); return; }
        try {
            const result = math.det(matrixA);
            document.getElementById('matrix-result').textContent = `Determinant A = ${result.toString()}`;
        } catch (e) { document.getElementById('matrix-result').textContent = 'Error: ' + e.message; }
    });

    // Unit Converter Mode
    const unitCategories = {
        length: ['meter', 'kilometer', 'centimeter', 'millimeter', 'micrometer', 'nanometer', 'mile', 'yard', 'foot', 'inch', 'nautical mile'],
        mass: ['kilogram', 'gram', 'milligram', 'microgram', 'tonne', 'pound', 'ounce', 'stone'],
        temperature: ['celsius', 'fahrenheit', 'kelvin'],
        volume: ['cubic meter', 'liter', 'milliliter', 'gallon', 'quart', 'pint', 'fluid ounce', 'cubic inch'],
        time: ['second', 'minute', 'hour', 'day', 'week', 'year'],
        area: ['square meter', 'square kilometer', 'square mile', 'acre', 'hectare'],
        energy: ['joule', 'kilojoule', 'calorie', 'kilocalorie', 'electronvolt', 'btu'],
        // Add more categories and units as needed, ensuring math.js supports them
    };

    const fromUnitCategory = document.getElementById('from-unit-category');
    const fromUnitSelect = document.getElementById('from-unit-select');
    const toUnitSelect = document.getElementById('to-unit-select');

    function populateUnitSelects(category) {
        fromUnitSelect.innerHTML = '';
        toUnitSelect.innerHTML = '';
        if (category && unitCategories[category]) {
            unitCategories[category].forEach(unit => {
                const option1 = document.createElement('option');
                option1.value = unit;
                option1.textContent = unit.charAt(0).toUpperCase() + unit.slice(1); // Capitalize
                fromUnitSelect.appendChild(option1);

                const option2 = document.createElement('option');
                option2.value = unit;
                option2.textContent = unit.charAt(0).toUpperCase() + unit.slice(1);
                toUnitSelect.appendChild(option2);
            });
        }
    }

    fromUnitCategory?.addEventListener('change', (e) => {
        populateUnitSelects(e.target.value);
    });

    document.getElementById('convert-unit')?.addEventListener('click', () => {
        const value = parseFloat(document.getElementById('unit-value').value);
        const fromUnit = fromUnitSelect.value;
        const toUnit = toUnitSelect.value;

        if (isNaN(value) || !fromUnit || !toUnit) {
            document.getElementById('unit-conversion-result').textContent = 'Please enter value and select units.';
            return;
        }

        try {
            const result = math.unit(value, fromUnit).to(toUnit);
            document.getElementById('unit-conversion-result').textContent = `${value} ${fromUnit} = ${result.toString()}`;
        } catch (e) {
            document.getElementById('unit-conversion-result').textContent = 'Error: ' + e.message;
        }
    });

    // Premium Features Mode

    // Currency Converter (Mock data for preview, real implementation needs API and potentially backend)
    // In a real application, you'd fetch this from a reliable currency API.
    async function fetchCurrencies() {
        // Mock data to simulate API response for preview
        const mockCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'GHS', 'NGN', 'ZAR', 'KES'];
        const fromCurrencySelect = document.getElementById('from-currency');
        const toCurrencySelect = document.getElementById('to-currency');

        mockCurrencies.forEach(currency => {
            const option1 = document.createElement('option');
            option1.value = currency;
            option1.textContent = currency;
            fromCurrencySelect.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = currency;
            option2.textContent = currency;
            toCurrencySelect.appendChild(option2);
        });
        // Select USD and GHS as default for demonstration
        fromCurrencySelect.value = 'USD';
        toCurrencySelect.value = 'GHS';
    }
    fetchCurrencies(); // Call on load

    document.getElementById('convert-currency')?.addEventListener('click', async () => {
        const amount = parseFloat(document.getElementById('currency-amount').value);
        const from = document.getElementById('from-currency').value;
        const to = document.getElementById('to-currency').value;
        const currencyResultDiv = document.getElementById('currency-result');

        if (isNaN(amount) || !from || !to) {
            currencyResultDiv.textContent = 'Please enter amount and select currencies.';
            return;
        }

        currencyResultDiv.textContent = 'Converting...';

        try {
            // Mock exchange rates (as of July 2025 - illustrative, not real-time)
            const mockRates = {
                'USD': { 'EUR': 0.92, 'GBP': 0.79, 'JPY': 158.0, 'GHS': 15.0, 'NGN': 1500.0, 'ZAR': 18.5, 'KES': 130.0 },
                'EUR': { 'USD': 1.08, 'GBP': 0.86, 'JPY': 171.0, 'GHS': 16.3, 'NGN': 1630.0, 'ZAR': 20.1, 'KES': 141.0 },
                'GBP': { 'USD': 1.27, 'EUR': 1.16, 'JPY': 200.0, 'GHS': 19.0, 'NGN': 1900.0, 'ZAR': 23.5, 'KES': 165.0 },
                'JPY': { 'USD': 0.0063, 'EUR': 0.0058, 'GBP': 0.005, 'GHS': 0.095, 'NGN': 9.5, 'ZAR': 0.117, 'KES': 0.82 },
                'GHS': { 'USD': 0.067, 'EUR': 0.061, 'GBP': 0.053, 'JPY': 10.5, 'NGN': 100.0, 'ZAR': 1.23, 'KES': 8.6 },
                'NGN': { 'USD': 0.00067, 'EUR': 0.00061, 'GBP': 0.00053, 'JPY': 0.105, 'GHS': 0.01, 'ZAR': 0.0123, 'KES': 0.086 },
                'ZAR': { 'USD': 0.054, 'EUR': 0.05, 'GBP': 0.043, 'JPY': 8.5, 'GHS': 0.81, 'NGN': 8.1, 'KES': 7.0 },
                'KES': { 'USD': 0.0077, 'EUR': 0.0071, 'GBP': 0.0061, 'JPY': 1.22, 'GHS': 0.116, 'NGN': 0.116, 'ZAR': 0.14 }
            };

            let convertedAmount;
            if (from === to) {
                convertedAmount = amount; // Same currency
            } else if (mockRates[from] && mockRates[from][to]) {
                convertedAmount = amount * mockRates[from][to];
            } else if (mockRates[to] && mockRates[to][from]) {
                convertedAmount = amount / mockRates[to][from]; // Inverse conversion
            } else {
                throw new Error('Conversion rate not available for selected currencies.');
            }

            currencyResultDiv.textContent = `${amount} ${from} = ${convertedAmount.toFixed(2)} ${to}`;
        } catch (e) {
            currencyResultDiv.textContent = 'Error fetching currency data. ' + e.message;
            console.error("Currency conversion error:", e);
        }
    });

    // Snap & Solve AI (Conceptual - requires advanced backend AI/OCR)
    document.getElementById('upload-snap-solve')?.addEventListener('click', async () => {
        const fileInput = document.getElementById('snap-solve-input');
        const file = fileInput.files[0];
        const snapSolveResultDiv = document.getElementById('snap-solve-result');

        if (!file) {
            snapSolveResultDiv.textContent = 'Please select an image file.';
            return;
        }

        snapSolveResultDiv.textContent = 'Processing image... (This feature is conceptual and requires advanced AI backend services)';

        // Simulate a delay for AI processing
        setTimeout(() => {
            snapSolveResultDiv.textContent = 'Snap & Solve is a premium feature under development. It would use AI to recognize and solve problems from images. Please check back later!';
        }, 3000);
    });

    // Initialize to Scientific mode on load
    modeSelector.value = 'scientific';
    // Ensure the scientific keypad is the default visible interaction.
    // Other panels are hidden by default via CSS 'hidden' class.
    // Call updateDisplay initially to show '0'
    updateDisplay();

    // Populate initial unit selects
    populateUnitSelects(fromUnitCategory.value);
});
