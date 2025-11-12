// DOM Elements
const emiForm = document.getElementById('emiForm');
const emiResults = document.getElementById('emiResults');
const monthsToggle = document.getElementById('monthsToggle');
const yearsToggle = document.getElementById('yearsToggle');
const emiType = document.getElementById('emiType');

// Result Elements
const monthlyEMI = document.getElementById('monthlyEMI');
const totalInterest = document.getElementById('totalInterest');
const totalPayment = document.getElementById('totalPayment');

// Calculator Widget Elements
const calculatorIcon = document.getElementById('calculatorIcon');
const calculatorOverlay = document.getElementById('calculatorOverlay');
const closeCalculator = document.getElementById('closeCalculator');
const calcDisplay = document.getElementById('calcDisplay');
const calcButtons = document.querySelectorAll('.calc-btn');

// Variables for standard calculator
let currentInput = '';
let operator = '';
let previousInput = '';
let shouldResetScreen = false;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // EMI Calculator Form Submission
    emiForm.addEventListener('submit', calculateEMI);
    
    // Tenure Toggle
    monthsToggle.addEventListener('click', () => toggleTenure('months'));
    yearsToggle.addEventListener('click', () => toggleTenure('years'));
    
    // Calculator Widget
    calculatorIcon.addEventListener('click', openCalculator);
    closeCalculator.addEventListener('click', closeCalculatorWidget);
    
    // Standard Calculator Buttons
    calcButtons.forEach(button => {
        button.addEventListener('click', () => handleCalcButtonClick(button.dataset.value));
    });
});

// Toggle Tenure between Years and Months
function toggleTenure(type) {
    if (type === 'years') {
        yearsToggle.classList.add('active');
        monthsToggle.classList.remove('active');
    } else {
        monthsToggle.classList.add('active');
        yearsToggle.classList.remove('active');
    }
}

// Calculate EMI based on type
function calculateEMI(e) {
    e.preventDefault();
    
    // Get input values
    const loanAmount = parseFloat(document.getElementById('loanAmount').value);
    const annualInterestRate = parseFloat(document.getElementById('interestRate').value);
    const loanTenure = parseFloat(document.getElementById('loanTenure').value);
    const type = emiType.value;
    
    // Validate inputs
    if (!loanAmount || !annualInterestRate || !loanTenure) {
        alert('Please fill in all fields');
        return;
    }
    
    // Convert tenure to months
    const tenureInMonths = monthsToggle.classList.contains('active') ? loanTenure : loanTenure * 12;
    
    let emi, totalInterestPaid, totalPaymentAmount;
    
    // Calculate based on EMI type
    switch(type) {
        case 'flat':
            // Flat Interest EMI: EMI = (P + (P * R * N)) / N
            totalInterestPaid = loanAmount * (annualInterestRate / 100) * (tenureInMonths / 12);
            totalPaymentAmount = loanAmount + totalInterestPaid;
            emi = totalPaymentAmount / tenureInMonths;
            break;
            
        case 'reducing':
            // Reducing Balance EMI: EMI = P * R * Math.pow(1 + R, N) / (Math.pow(1 + R, N) - 1)
            const monthlyInterestRate = (annualInterestRate / 12) / 100;
            emi = loanAmount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, tenureInMonths) / 
                  (Math.pow(1 + monthlyInterestRate, tenureInMonths) - 1);
            totalPaymentAmount = emi * tenureInMonths;
            totalInterestPaid = totalPaymentAmount - loanAmount;
            break;
            
        case 'zero':
            // Zero Interest EMI: EMI = P / N
            emi = loanAmount / tenureInMonths;
            totalInterestPaid = 0;
            totalPaymentAmount = loanAmount;
            break;
            
        case 'stepup':
            // Step-Up EMI: Start lower; increase EMI by 5% every 6 months
            // For simplicity, we'll calculate an average EMI
            emi = calculateStepUpEMI(loanAmount, annualInterestRate, tenureInMonths, 5, 6);
            totalPaymentAmount = emi * tenureInMonths;
            totalInterestPaid = totalPaymentAmount - loanAmount;
            break;
            
        case 'stepdown':
            // Step-Down EMI: Start higher; decrease EMI by 5% every 6 months
            // For simplicity, we'll calculate an average EMI
            emi = calculateStepDownEMI(loanAmount, annualInterestRate, tenureInMonths, 5, 6);
            totalPaymentAmount = emi * tenureInMonths;
            totalInterestPaid = totalPaymentAmount - loanAmount;
            break;
            
        case 'balloon':
            // Balloon EMI: Regular EMI + final balloon payment (20% of principal at end)
            const balloonPayment = loanAmount * 0.2;
            const reducedPrincipal = loanAmount - balloonPayment;
            const monthlyRate = (annualInterestRate / 12) / 100;
            emi = reducedPrincipal * monthlyRate * Math.pow(1 + monthlyRate, tenureInMonths) / 
                  (Math.pow(1 + monthlyRate, tenureInMonths) - 1);
            totalPaymentAmount = (emi * tenureInMonths) + balloonPayment;
            totalInterestPaid = totalPaymentAmount - loanAmount;
            break;
    }
    
    // Display results with animation
    displayResults(emi, totalInterestPaid, totalPaymentAmount);
    
    // Create pie chart
    createPieChart(loanAmount, totalInterestPaid);
    
    // Show results section
    emiResults.style.display = 'block';
    
    // Scroll to results
    emiResults.scrollIntoView({ behavior: 'smooth' });
}

// Calculate Step-Up EMI
function calculateStepUpEMI(principal, annualRate, tenure, stepPercent, stepInterval) {
    // Simplified calculation - average EMI with increasing payments
    const monthlyRate = (annualRate / 12) / 100;
    const baseEMI = principal * monthlyRate * Math.pow(1 + monthlyRate, tenure) / 
                   (Math.pow(1 + monthlyRate, tenure) - 1);
    
    // Adjust for step-up (approximate)
    const adjustmentFactor = 1 + (stepPercent / 200); // Rough approximation
    return baseEMI * adjustmentFactor;
}

// Calculate Step-Down EMI
function calculateStepDownEMI(principal, annualRate, tenure, stepPercent, stepInterval) {
    // Simplified calculation - average EMI with decreasing payments
    const monthlyRate = (annualRate / 12) / 100;
    const baseEMI = principal * monthlyRate * Math.pow(1 + monthlyRate, tenure) / 
                   (Math.pow(1 + monthlyRate, tenure) - 1);
    
    // Adjust for step-down (approximate)
    const adjustmentFactor = 1 - (stepPercent / 200); // Rough approximation
    return baseEMI * adjustmentFactor;
}

// Display Results with Animation
function displayResults(emi, interest, total) {
    // Set initial values to 0 for counting animation
    monthlyEMI.textContent = '₹ 0';
    totalInterest.textContent = '₹ 0';
    totalPayment.textContent = '₹ 0';
    
    // Animate the results
    animateValue(monthlyEMI, 0, emi, 1500);
    animateValue(totalInterest, 0, interest, 1500);
    animateValue(totalPayment, 0, total, 1500);
}

// Animate Numbers
function animateValue(element, start, end, duration) {
    const startTime = performance.now();
    
    const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Use easing function for smoother animation
        const easeOutQuad = 1 - Math.pow(1 - progress, 2);
        const currentValue = start + (end - start) * easeOutQuad;
        
        // Format the number with commas
        element.textContent = `₹ ${Math.abs(currentValue).toLocaleString('en-IN', {
            maximumFractionDigits: 0
        })}`;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };
    
    requestAnimationFrame(animate);
}

// Create Pie Chart
function createPieChart(principal, interest) {
    const canvas = document.getElementById('pieChart');
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate angles
    const total = principal + interest;
    const principalAngle = (principal / total) * 2 * Math.PI;
    const interestAngle = (interest / total) * 2 * Math.PI;
    
    // Draw principal portion (teal)
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, 0, principalAngle);
    ctx.closePath();
    ctx.fillStyle = '#008080';
    ctx.fill();
    
    // Draw interest portion (lighter teal)
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, principalAngle, principalAngle + interestAngle);
    ctx.closePath();
    ctx.fillStyle = '#00a0a0';
    ctx.fill();
    
    // Draw labels
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    
    // Principal label
    const principalLabelAngle = principalAngle / 2;
    const principalLabelX = centerX + (radius * 0.7 * Math.cos(principalLabelAngle));
    const principalLabelY = centerY + (radius * 0.7 * Math.sin(principalLabelAngle)) + 5;
    ctx.fillText('Principal', principalLabelX, principalLabelY);
    
    // Interest label
    const interestLabelAngle = principalAngle + (interestAngle / 2);
    const interestLabelX = centerX + (radius * 0.7 * Math.cos(interestLabelAngle));
    const interestLabelY = centerY + (radius * 0.7 * Math.sin(interestLabelAngle)) + 5;
    ctx.fillText('Interest', interestLabelX, interestLabelY);
}

// Calculator Widget Functions
function openCalculator() {
    calculatorOverlay.classList.add('active');
}

function closeCalculatorWidget() {
    calculatorOverlay.classList.remove('active');
}

// Standard Calculator Functions
function handleCalcButtonClick(value) {
    if (value === 'AC') {
        // All Clear
        calcDisplay.value = '';
        currentInput = '';
        operator = '';
        previousInput = '';
        return;
    }
    
    if (value === 'DEL') {
        // Delete last character
        calcDisplay.value = calcDisplay.value.slice(0, -1);
        currentInput = calcDisplay.value;
        return;
    }
    
    if (value === '√') {
        // Square root
        if (currentInput === '') return;
        const result = Math.sqrt(parseFloat(currentInput));
        calcDisplay.value = result;
        currentInput = result.toString();
        return;
    }
    
    if (['+', '-', '*', '/', '%', '(', ')'].includes(value)) {
        // Handle operators and parentheses
        if (currentInput === '' && value !== '(') return;
        
        calcDisplay.value += value;
        currentInput = '';
        return;
    }
    
    if (value === '=') {
        // Calculate result
        if (currentInput === '') return;
        try {
            // Using Function constructor for safe evaluation
            const result = Function('"use strict"; return (' + calcDisplay.value + ')')();
            calcDisplay.value = result;
            currentInput = result.toString();
        } catch (e) {
            calcDisplay.value = 'Error';
            currentInput = '';
        }
        return;
    }
    
    // Handle numbers and decimal point
    if (value === '.') {
        if (currentInput.includes('.')) return; // Prevent multiple decimals
        if (currentInput === '') currentInput = '0'; // Add leading zero
    }
    
    // Add digit or decimal to current input
    currentInput += value;
    calcDisplay.value += value;
}