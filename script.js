// Quiz Questions Database
const quizDatabase = {
    coding: [
        { question: "Which language runs in a web browser?", options: ["Java", "C", "Python", "JavaScript"], correct: 3, explanation: "JavaScript is the primary language for web interactivity. Other languages like Java or Python usually run on the server or as desktop apps." },
        { question: "What does CSS stand for?", options: ["Central Style Sheets", "Cascading Style Sheets", "Cascading Simple Sheets", "Cars SUVs Sailboats"], correct: 1, explanation: "Cascading Style Sheets (CSS) describes how HTML elements are to be displayed on screen." },
        { question: "What does HTML stand for?", options: ["Hypertext Markup Language", "Hypertext Markdown Language", "Hyperloop Machine Language", "None of the above"], correct: 0, explanation: "HTML is the standard markup language for documents designed to be displayed in a web browser." },
        { question: "Which variable keyword is block-scoped?", options: ["var", "let", "global", "static"], correct: 1, explanation: "'let' and 'const' are block-scoped, while 'var' is function-scoped." },
        { question: "What is the result of 2 + '2' in JavaScript?", options: ["4", "22", "Error", "NaN"], correct: 1, explanation: "JavaScript performs coercion, converting the number 2 to a string and concatenating them." }
    ],
    science: [
        { question: "What is the chemical symbol for Gold?", options: ["Gd", "Ag", "Au", "Fe"], correct: 2, explanation: "Au comes from the Latin word for gold, 'Aurum'." },
        { question: "Which planet is known as the Red Planet?", options: ["Mars", "Venus", "Jupiter", "Saturn"], correct: 0, explanation: "Mars appears red due to iron oxide (rust) on its surface." },
        { question: "What is the hardest natural substance on Earth?", options: ["Gold", "Iron", "Diamond", "Platinum"], correct: 2, explanation: "Diamond is the hardest natural material, consisting of pure carbon in a crystal structure." }
    ],
    history: [
        { question: "Who was the first President of the United States?", options: ["Abraham Lincoln", "Thomas Jefferson", "George Washington", "John Adams"], correct: 2, explanation: "George Washington served as the first president from 1789 to 1797." },
        { question: "In which year did World War II end?", options: ["1943", "1944", "1945", "1946"], correct: 2, explanation: "The war ended in 1945 with the surrender of Germany in May and Japan in September." }
    ],
    math: [
        { question: "What is the square root of 144?", options: ["10", "11", "12", "14"], correct: 2, explanation: "12 times 12 is equal to 144." },
        { question: "What is the value of Pi (to two decimal places)?", options: ["3.12", "3.14", "3.16", "3.18"], correct: 1, explanation: "Pi is approximately 3.14159..." }
    ]
};

// DOM Elements
const startScreen = document.getElementById('start-screen');
const setupScreen = document.getElementById('setup-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');

const startBtn = document.getElementById('start-btn');
const startQuizBtn = document.getElementById('start-quiz-btn');
const nextBtn = document.getElementById('next-btn');
const restartBtn = document.getElementById('restart-btn');

const fiftyFiftyBtn = document.getElementById('fifty-fifty-btn');
const skipBtn = document.getElementById('skip-btn');

const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const explanationContainer = document.getElementById('explanation-container');
const explanationText = document.getElementById('explanation-text');
const progressBar = document.getElementById('progress-bar');
const questionCountText = document.getElementById('question-count');
const scoreDisplayText = document.getElementById('score-display');
const finalScoreText = document.getElementById('final-score');
const resultMessage = document.getElementById('result-message');
const timeLeftText = document.getElementById('time-left');

// State
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let selectedCategory = 'coding';
let selectedDifficulty = 'medium';
let isAnswered = false;
let lifelines = { fiftyFifty: true, skip: true };

// Multipliers
const difficultyMultipliers = { easy: 1, medium: 2, hard: 3 };

// API Categories Mapping
const categoryAPI = {
    coding: 18,
    science: 17,
    history: 23,
    math: 19
};

const loadingOverlay = document.getElementById('loading-overlay');

// Timer & Audio Settings
const TIMER_DURATION = { easy: 20, medium: 15, hard: 10 };
let timerInterval;
let timeLeft;

// Audio Context for beeps
let audioCtx;
function playSound(frequency, type = 'sine', duration = 0.1) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

const sounds = {
    correct: () => { playSound(880, 'sine', 0.2); playSound(1108.73, 'sine', 0.3); },
    wrong: () => { playSound(220, 'square', 0.3); },
    tick: () => { playSound(440, 'sine', 0.05); },
    complete: () => {
        [523, 659, 783, 1046].forEach((f, i) => {
            setTimeout(() => playSound(f, 'sine', 0.4), i * 150);
        });
    }
};

// DOM Elements (Continued)
const leaderboardScreen = document.getElementById('leaderboard-screen');
const showLeaderboardBtn = document.getElementById('show-leaderboard-btn');
const backHomeBtn = document.getElementById('back-home-btn');
const clearScoresBtn = document.getElementById('clear-scores-btn');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const leaderboardList = document.getElementById('leaderboard-list');

// Initialize
function init() {
    startBtn.addEventListener('click', () => {
        if (!audioCtx) playSound(0, 'sine', 0.01);
        showScreen(setupScreen);
    });
    startQuizBtn.addEventListener('click', startQuiz);
    nextBtn.addEventListener('click', handleNextQuestion);
    restartBtn.addEventListener('click', restartQuiz);

    fiftyFiftyBtn.addEventListener('click', useFiftyFifty);
    skipBtn.addEventListener('click', useSkip);

    showLeaderboardBtn.addEventListener('click', () => showLeaderboard());
    backHomeBtn.addEventListener('click', () => showScreen(startScreen));
    clearScoresBtn.addEventListener('click', clearLeaderboard);
    themeToggle.addEventListener('click', toggleTheme);

    // Initial Theme Load
    if (localStorage.getItem('quiz-theme') === 'light') {
        document.body.classList.add('light-mode');
        updateThemeIcon(true);
    }

    // Category & Difficulty Selection
    document.querySelectorAll('#category-selection .select-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#category-selection .select-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedCategory = btn.dataset.category;
        });
    });

    document.querySelectorAll('#difficulty-selection .select-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#difficulty-selection .select-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedDifficulty = btn.dataset.difficulty;
        });
    });
}

function showScreen(screen) {
    [startScreen, setupScreen, quizScreen, resultScreen, leaderboardScreen].forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
}

async function startQuiz() {
    loadingOverlay.classList.remove('hidden');
    const apiQuestions = await fetchQuestions(selectedCategory, selectedDifficulty);
    loadingOverlay.classList.add('hidden');

    if (apiQuestions && apiQuestions.length > 0) {
        currentQuestions = apiQuestions;
    } else {
        // Fallback to local database if API fails
        console.warn('API fetch failed, falling back to local database');
        currentQuestions = [...quizDatabase[selectedCategory]].sort(() => 0.5 - Math.random());
    }

    currentQuestionIndex = 0;
    score = 0;
    lifelines = { fiftyFifty: true, skip: true };
    updateLifelineButtons();
    showScreen(quizScreen);
    loadQuestion();
}

async function fetchQuestions(category, difficulty) {
    const categoryId = categoryAPI[category];
    const url = `https://opentdb.com/api.php?amount=10&category=${categoryId}&difficulty=${difficulty}&type=multiple`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.response_code === 0) {
            return data.results.map(q => {
                const incorrect = q.incorrect_answers.map(a => decodeHTML(a));
                const correct = decodeHTML(q.correct_answer);
                const options = [...incorrect, correct].sort(() => 0.5 - Math.random());
                const correctIndex = options.indexOf(correct);

                return {
                    question: decodeHTML(q.question),
                    options: options,
                    correct: correctIndex,
                    explanation: `The correct answer is ${correct}.`
                };
            });
        }
    } catch (error) {
        console.error('Error fetching questions:', error);
    }
    return null;
}

function decodeHTML(html) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
}

function loadQuestion() {
    clearInterval(timerInterval);
    const q = currentQuestions[currentQuestionIndex];
    isAnswered = false;
    nextBtn.disabled = true;
    explanationContainer.classList.add('hidden');

    questionText.textContent = q.question;
    questionCountText.textContent = `Question ${currentQuestionIndex + 1} of ${currentQuestions.length}`;
    scoreDisplayText.textContent = `Score: ${score}`;

    const progress = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;
    progressBar.style.width = `${progress}%`;

    optionsContainer.innerHTML = '';
    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.classList.add('option-btn');
        btn.textContent = opt;
        btn.addEventListener('click', () => selectOption(idx, btn));
        optionsContainer.appendChild(btn);
    });

    fiftyFiftyBtn.disabled = !lifelines.fiftyFifty;
    skipBtn.disabled = !lifelines.skip;

    startTimer();
}

function startTimer() {
    timeLeft = TIMER_DURATION[selectedDifficulty];
    updateTimerUI();

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerUI();

        if (timeLeft <= 3) sounds.tick();

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleTimeOut();
        }
    }, 1000);
}

function updateTimerUI() {
    timeLeftText.textContent = timeLeft;
    const progressCircle = document.getElementById('timer-progress');
    const container = document.getElementById('timer-container');

    const maxTime = TIMER_DURATION[selectedDifficulty];
    const offset = 113 - (timeLeft / maxTime) * 113;
    progressCircle.style.strokeDashoffset = offset;

    if (timeLeft <= 5) {
        container.classList.add('timer-warning');
    } else {
        container.classList.remove('timer-warning');
    }
}

function handleTimeOut() {
    if (isAnswered) return;
    const q = currentQuestions[currentQuestionIndex];
    const allOptions = optionsContainer.querySelectorAll('.option-btn');

    isAnswered = true;
    allOptions[q.correct].classList.add('correct');
    sounds.wrong();

    explanationText.textContent = `Time's up! ${q.explanation}`;
    explanationContainer.classList.remove('hidden');

    nextBtn.disabled = false;
    nextBtn.textContent = (currentQuestionIndex === currentQuestions.length - 1) ? "Finish Quiz" : "Next Question";

    fiftyFiftyBtn.disabled = true;
    skipBtn.disabled = true;
}

function selectOption(index, button) {
    if (isAnswered || timeLeft <= 0) return;
    clearInterval(timerInterval);
    isAnswered = true;

    const q = currentQuestions[currentQuestionIndex];
    const allOptions = optionsContainer.querySelectorAll('.option-btn');


    if (index === q.correct) {
        const points = 10 * difficultyMultipliers[selectedDifficulty];
        score += points;
        button.classList.add('correct');
        sounds.correct();
    } else {
        button.classList.add('wrong');
        allOptions[q.correct].classList.add('correct');
        sounds.wrong();
    }

    explanationText.textContent = q.explanation;
    explanationContainer.classList.remove('hidden');

    scoreDisplayText.textContent = `Score: ${score}`;
    nextBtn.disabled = false;
    nextBtn.textContent = (currentQuestionIndex === currentQuestions.length - 1) ? "Finish Quiz" : "Next Question";

    fiftyFiftyBtn.disabled = true;
    skipBtn.disabled = true;
}

function handleNextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < currentQuestions.length) {
        loadQuestion();
    } else {
        showResults();
    }
}

function useFiftyFifty() {
    if (!lifelines.fiftyFifty || isAnswered) return;

    const q = currentQuestions[currentQuestionIndex];
    const allOptions = optionsContainer.querySelectorAll('.option-btn');
    const incorrectIndices = q.options.map((_, i) => i).filter(i => i !== q.correct);

    const toHide = incorrectIndices.sort(() => 0.5 - Math.random()).slice(0, 2);
    toHide.forEach(idx => {
        allOptions[idx].style.opacity = '0';
        allOptions[idx].style.pointerEvents = 'none';
    });

    lifelines.fiftyFifty = false;
    updateLifelineButtons();
}

function useSkip() {
    if (!lifelines.skip || isAnswered) return;
    clearInterval(timerInterval);
    lifelines.skip = false;
    handleNextQuestion();
    updateLifelineButtons();
}

function updateLifelineButtons() {
    fiftyFiftyBtn.disabled = !lifelines.fiftyFifty;
    skipBtn.disabled = !lifelines.skip;
}

function showResults() {
    clearInterval(timerInterval);
    showScreen(resultScreen);
    finalScoreText.textContent = `${score}`;
    resultMessage.textContent = `Completed ${selectedCategory} on ${selectedDifficulty} mode!`;

    saveScore(score, selectedCategory, selectedDifficulty);

    sounds.complete();
    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#ec4899', '#10b981']
    });
}

// Leaderboard Logic
function saveScore(score, category, difficulty) {
    const history = JSON.parse(localStorage.getItem('quiz-scores') || '[]');
    const newEntry = {
        score,
        category,
        difficulty,
        date: new Date().toLocaleDateString()
    };
    history.push(newEntry);
    history.sort((a, b) => b.score - a.score);
    localStorage.setItem('quiz-scores', JSON.stringify(history.slice(0, 10)));
}

function showLeaderboard() {
    showScreen(leaderboardScreen);
    renderLeaderboard();
}

function renderLeaderboard() {
    const history = JSON.parse(localStorage.getItem('quiz-scores') || '[]');
    leaderboardList.innerHTML = history.length ? '' : '<p style="text-align:center; opacity:0.5;">No scores yet!</p>';

    history.forEach((entry, index) => {
        const item = document.createElement('div');
        item.classList.add('leaderboard-item');
        item.innerHTML = `
            <div class="user-info">
                <span class="rank-tag">${index + 1}</span>
                <span>${entry.category.charAt(0).toUpperCase() + entry.category.slice(1)}</span>
            </div>
            <div class="entry-details">
                <div class="entry-score">${entry.score} pts</div>
                <div class="entry-meta">${entry.difficulty} • ${entry.date}</div>
            </div>
        `;
        leaderboardList.appendChild(item);
    });
}

function clearLeaderboard() {
    if (confirm('Clear all high scores?')) {
        localStorage.removeItem('quiz-scores');
        renderLeaderboard();
    }
}

// Theme Logic
function toggleTheme() {
    const isLight = document.body.classList.toggle('light-mode');
    localStorage.setItem('quiz-theme', isLight ? 'light' : 'dark');
    updateThemeIcon(isLight);
}

function updateThemeIcon(isLight) {
    themeIcon.innerHTML = isLight
        ? '<path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"/><path d="M3 12h1m8-9v1m8 8h1m-9 8v1m-6.4-15.4l.7.7m12.1-.7l-.7.7m0 11.4l.7.7m-12.1-.7l-.7.7"/>'
        : '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>';
}

function restartQuiz() {
    showScreen(startScreen);
}

init();
