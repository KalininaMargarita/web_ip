// ==============================
// Хранилище данных
// ==============================
const storage = {
    get: (key) => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    },
    set: (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    },
    clear: (key) => {
        localStorage.removeItem(key);
    },
    getAll: () => {
        return {
            measurements: storage.get('measurements'),
            workouts: storage.get('workouts'),
            settings: storage.get('settings'),
            version: '1.0.0'
        };
    },
    setAll: (data) => {
        if (data.measurements) storage.set('measurements', data.measurements);
        if (data.workouts) storage.set('workouts', data.workouts);
        if (data.settings) storage.set('settings', data.settings);
    }
};

// ==============================
// Глобальные переменные
// ==============================
let measurementsChart = null;
let bmiChart = null;
let workoutsChart = null;
let currentExercise = 'squat';
let currentMetric = 'weight';
let userHeight = 1.75; // Рост по умолчанию

// ==============================
// Инициализация приложения
// ==============================
document.addEventListener('DOMContentLoaded', function() {
    initTabs();
    initModals();
    initControlButtons();
    initSettings();
    checkFirstLaunch();
    loadMeasurements();
    loadWorkouts();
});

// ==============================
// Инициализация вкладок
// ==============================
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Обновляем активные кнопки
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Показываем активный контент
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
        });
    });
}

// ==============================
// Инициализация модальных окон
// ==============================
function initModals() {
    const measurementModal = document.getElementById('measurementModal');
    const workoutModal = document.getElementById('workoutModal');
    const closeButtons = document.querySelectorAll('.close');
    
    // Кнопка добавления измерений
    document.getElementById('addDataBtn').addEventListener('click', () => {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('measureDate').value = today;
        measurementModal.style.display = 'block';
    });
    
    // Кнопка добавления тренировки
    document.getElementById('addWorkoutBtn').addEventListener('click', () => {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('workoutDate').value = today;
        workoutModal.style.display = 'block';
    });
    
    // Закрытие модальных окон
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            measurementModal.style.display = 'none';
            workoutModal.style.display = 'none';
        });
    });
    
    // Закрытие по клику вне окна
    window.addEventListener('click', (event) => {
        if (event.target === measurementModal) {
            measurementModal.style.display = 'none';
        }
        if (event.target === workoutModal) {
            workoutModal.style.display = 'none';
        }
    });
    
    // Форма измерений
    document.getElementById('measurementForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addMeasurement();
    });
    
    // Форма тренировок
    document.getElementById('workoutForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addWorkout();
    });
}

// ==============================
// Инициализация кнопок управления
// ==============================
function initControlButtons() {
    // Инициализация выбора упражнения и метрики
    document.getElementById('exerciseSelect').addEventListener('change', function() {
        currentExercise = this.value;
        updateWorkoutsChart();
        updateWorkoutsTable();
    });
    
    document.getElementById('metricSelect').addEventListener('change', function() {
        currentMetric = this.value;
        updateWorkoutsChart();
    });
    
    // Кнопки для измерений
    document.getElementById('generateMeasurementsBtn').addEventListener('click', generateMeasurementsData);
    document.getElementById('clearMeasurementsBtn').addEventListener('click', clearMeasurements);
    
    // Кнопки для тренировок
    document.getElementById('generateWorkoutsBtn').addEventListener('click', generateWorkoutsData);
    document.getElementById('clearWorkoutsBtn').addEventListener('click', clearWorkouts);
    
    // Кнопки настроек
    document.getElementById('exportDataBtn').addEventListener('click', exportData);
    document.getElementById('importDataBtn').addEventListener('click', importData);
    document.getElementById('resetAllBtn').addEventListener('click', resetAllData);
}

// ==============================
// Инициализация настроек
// ==============================
function initSettings() {
    const settings = storage.get('settings');
    if (settings.height) {
        userHeight = settings.height;
        document.getElementById('height').value = userHeight;
    }
}

// ==============================
// Проверка первого запуска
// ==============================
function checkFirstLaunch() {
    const hasMeasurements = localStorage.getItem('measurements');
    const hasWorkouts = localStorage.getItem('workouts');
    
    if (!hasMeasurements || !hasWorkouts) {
        setTimeout(() => {
            if (confirm('Добро пожаловать в Фитнес-трекер!\n\nХотите сгенерировать демонстрационные данные для ознакомления?')) {
                generateMeasurementsData();
                generateWorkoutsData();
                showNotification('Демо-данные успешно сгенерированы!', 'success');
            }
        }, 1000);
    }
}

// ==============================
// Работа с измерениями
// ==============================
function loadMeasurements() {
    const measurements = storage.get('measurements');
    updateMeasurementsChart(measurements);
    updateBMITable(measurements);
    updateMeasurementsTable(measurements);
}

function addMeasurement() {
    // Сохраняем рост пользователя
    const height = parseFloat(document.getElementById('height').value);
    userHeight = height;
    storage.set('settings', { height: height });
    
    const measurement = {
        date: document.getElementById('measureDate').value,
        weight: parseFloat(document.getElementById('weight').value),
        chest: parseFloat(document.getElementById('chest').value) || null,
        waist: parseFloat(document.getElementById('waist').value) || null,
        hips: parseFloat(document.getElementById('hips').value) || null,
        height: height
    };
    
    const measurements = storage.get('measurements');
    measurements.push(measurement);
    measurements.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    storage.set('measurements', measurements);
    
    document.getElementById('measurementModal').style.display = 'none';
    document.getElementById('measurementForm').reset();
    document.getElementById('height').value = userHeight;
    
    showNotification('Измерения успешно сохранены!', 'success');
    loadMeasurements();
}

function deleteMeasurement(index) {
    if (confirm('Вы уверены, что хотите удалить это измерение?')) {
        const measurements = storage.get('measurements');
        measurements.splice(index, 1);
        storage.set('measurements', measurements);
        showNotification('Измерение удалено', 'info');
        loadMeasurements();
    }
}

function updateMeasurementsChart(measurements) {
    const ctx = document.getElementById('measurementsChart').getContext('2d');
    
    if (measurementsChart) {
        measurementsChart.destroy();
    }
    
    if (measurements.length === 0) {
        measurementsChart = new Chart(ctx, {
            type: 'line',
            data: { labels: [], datasets: [] },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                }
            }
        });
        return;
    }
    
    const dates = measurements.map(m => formatDate(m.date));
    const weights = measurements.map(m => m.weight);
    const chests = measurements.map(m => m.chest).filter(v => v !== null);
    const waists = measurements.map(m => m.waist).filter(v => v !== null);
    const hips = measurements.map(m => m.hips).filter(v => v !== null);
    
    measurementsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Вес (кг)',
                    data: weights,
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,
                    pointHoverRadius: 8
                },
                {
                    label: 'Грудь (см)',
                    data: chests,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,
                    pointHoverRadius: 8
                },
                {
                    label: 'Талия (см)',
                    data: waists,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,
                    pointHoverRadius: 8
                },
                {
                    label: 'Бедра (см)',
                    data: hips,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { size: 14 },
                    bodyFont: { size: 13 },
                    padding: 12
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    },
                    title: {
                        display: true,
                        text: 'Значения (кг/см)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    }
                }
            }
        }
    });
}

function updateBMITable(measurements) {
    const ctx = document.getElementById('bmiChart').getContext('2d');
    
    if (bmiChart) {
        bmiChart.destroy();
    }
    
    if (measurements.length === 0) {
        bmiChart = new Chart(ctx, {
            type: 'line',
            data: { labels: [], datasets: [] },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                }
            }
        });
        return;
    }
    
    const dates = measurements.map(m => formatDate(m.date));
    const bmiValues = measurements.map(m => {
        const height = m.height || userHeight;
        return (m.weight / (height * height)).toFixed(1);
    });
    
    bmiChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'ИМТ',
                data: bmiValues,
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const bmi = parseFloat(context.raw);
                            let category = '';
                            if (bmi < 18.5) category = 'Недостаток';
                            else if (bmi < 25) category = 'Норма';
                            else if (bmi < 30) category = 'Избыток';
                            else category = 'Ожирение';
                            
                            return `ИМТ: ${bmi} (${category})`;
                        }
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { size: 14 },
                    bodyFont: { size: 13 },
                    padding: 12
                },
                annotation: {
                    annotations: {
                        underweight: {
                            type: 'box',
                            yMin: 0,
                            yMax: 18.5,
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderColor: 'rgba(59, 130, 246, 0.3)',
                            borderWidth: 1
                        },
                        normal: {
                            type: 'box',
                            yMin: 18.5,
                            yMax: 25,
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            borderColor: 'rgba(34, 197, 94, 0.3)',
                            borderWidth: 1
                        },
                        overweight: {
                            type: 'box',
                            yMin: 25,
                            yMax: 30,
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            borderColor: 'rgba(245, 158, 11, 0.3)',
                            borderWidth: 1
                        },
                        obese: {
                            type: 'box',
                            yMin: 30,
                            yMax: 40,
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderColor: 'rgba(239, 68, 68, 0.3)',
                            borderWidth: 1
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 15,
                    max: 35,
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    },
                    title: {
                        display: true,
                        text: 'Индекс массы тела'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    }
                }
            }
        }
    });
}

function updateMeasurementsTable(measurements) {
    const tbody = document.getElementById('measurementsTableBody');
    tbody.innerHTML = '';
    
    if (measurements.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #6b7280;">
                    📊 Нет данных измерений. Добавьте первое измерение!
                </td>
            </tr>
        `;
        return;
    }
    
    measurements.forEach((measurement, index) => {
        const height = measurement.height || userHeight;
        const bmi = (measurement.weight / (height * height)).toFixed(1);
        
        let bmiClass = '';
        if (bmi < 18.5) bmiClass = 'underweight';
        else if (bmi < 25) bmiClass = 'normal';
        else if (bmi < 30) bmiClass = 'overweight';
        else bmiClass = 'obese';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(measurement.date)}</td>
            <td><strong>${measurement.weight}</strong></td>
            <td>${measurement.chest || '-'}</td>
            <td>${measurement.waist || '-'}</td>
            <td>${measurement.hips || '-'}</td>
            <td>
                <span class="bmi-zone ${bmiClass}">${bmi}</span>
            </td>
            <td class="table-actions">
                <button onclick="deleteMeasurement(${index})" class="danger">
                    <span>🗑️</span>
                    Удалить
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ==============================
// Работа с тренировками
// ==============================
function loadWorkouts() {
    updateWorkoutsChart();
    updateWorkoutsTable();
}

function addWorkout() {
    const workout = {
        date: document.getElementById('workoutDate').value,
        exercise: document.getElementById('workoutExercise').value,
        weight: parseFloat(document.getElementById('workoutWeight').value),
        reps: parseInt(document.getElementById('workoutReps').value),
        sets: parseInt(document.getElementById('workoutSets').value)
    };
    
    const workouts = storage.get('workouts');
    workouts.push(workout);
    workouts.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    storage.set('workouts', workouts);
    
    document.getElementById('workoutModal').style.display = 'none';
    document.getElementById('workoutForm').reset();
    
    showNotification('Тренировка успешно сохранена!', 'success');
    loadWorkouts();
}

function deleteWorkout(index) {
    if (confirm('Вы уверены, что хотите удалить эту запись о тренировке?')) {
        const workouts = storage.get('workouts');
        workouts.splice(index, 1);
        storage.set('workouts', workouts);
        showNotification('Тренировка удалена', 'info');
        loadWorkouts();
    }
}

function updateWorkoutsChart() {
    const ctx = document.getElementById('workoutsChart').getContext('2d');
    const workouts = storage.get('workouts');
    const filteredWorkouts = workouts.filter(w => w.exercise === currentExercise);
    
    if (workoutsChart) {
        workoutsChart.destroy();
    }
    
    // Обновляем легенду
    updateWorkoutLegend();
    
    if (filteredWorkouts.length === 0) {
        workoutsChart = new Chart(ctx, {
            type: 'line',
            data: { labels: [], datasets: [] },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                }
            }
        });
        return;
    }
    
    const dates = filteredWorkouts.map(w => formatDate(w.date));
    
    // Данные в зависимости от выбранной метрики
    let data = [];
    let label = '';
    let color = '#4f46e5';
    
    switch(currentMetric) {
        case 'weight':
            data = filteredWorkouts.map(w => w.weight);
            label = 'Рабочий вес (кг)';
            color = '#4f46e5';
            break;
        case 'reps':
            data = filteredWorkouts.map(w => w.reps);
            label = 'Количество повторов';
            color = '#10b981';
            break;
        case 'volume':
            data = filteredWorkouts.map(w => w.weight * w.reps * w.sets);
            label = 'Объем нагрузки (кг)';
            color = '#f59e0b';
            break;
        case 'max':
            // Расчет 1ПМ по формуле Эйпли
            data = filteredWorkouts.map(w => w.weight * (1 + w.reps / 30));
            label = 'Примерный 1ПМ (кг)';
            color = '#ef4444';
            break;
    }
    
    workoutsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: label,
                data: data,
                borderColor: color,
                backgroundColor: color + '20',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: color,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const workout = filteredWorkouts[context.dataIndex];
                            let tooltipText = `${context.dataset.label}: ${context.raw.toFixed(1)}`;
                            
                            if (currentMetric !== 'reps') {
                                tooltipText += `\nПовторы: ${workout.reps}`;
                                tooltipText += `\nПодходы: ${workout.sets}`;
                                if (currentMetric !== 'volume') {
                                    tooltipText += `\nОбъем: ${(workout.weight * workout.reps * workout.sets).toFixed(0)} кг`;
                                }
                            }
                            return tooltipText;
                        }
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { size: 14 },
                    bodyFont: { size: 13 },
                    padding: 12
                }
            },
            scales: {
                y: {
                    beginAtZero: currentMetric !== 'weight',
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    },
                    title: {
                        display: true,
                        text: getYAxisLabel(currentMetric)
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    }
                }
            }
        }
    });
}

function updateWorkoutLegend() {
    const legend = document.getElementById('workoutLegend');
    const exerciseNames = {
        'squat': 'Приседания',
        'benchpress': 'Жим лежа',
        'deadlift': 'Становая тяга',
        'pullup': 'Подтягивания'
    };
    
    legend.innerHTML = `
        <div class="legend-item">
            <span class="legend-color" style="background-color: ${getMetricColor()}"></span>
            <span>${exerciseNames[currentExercise]}</span>
        </div>
        <div class="legend-item">
            <span>📊</span>
            <span>${getMetricLabel()}</span>
        </div>
    `;
}

function getMetricColor() {
    switch(currentMetric) {
        case 'weight': return '#4f46e5';
        case 'reps': return '#10b981';
        case 'volume': return '#f59e0b';
        case 'max': return '#ef4444';
        default: return '#4f46e5';
    }
}

function getMetricLabel() {
    switch(currentMetric) {
        case 'weight': return 'Рабочий вес';
        case 'reps': return 'Повторы';
        case 'volume': return 'Объем';
        case 'max': return '1ПМ';
        default: return '';
    }
}

function getYAxisLabel(metric) {
    switch(metric) {
        case 'weight': return 'Вес (кг)';
        case 'reps': return 'Количество повторов';
        case 'volume': return 'Объем нагрузки (кг)';
        case 'max': return 'Вес (кг)';
        default: return '';
    }
}

function updateWorkoutsTable() {
    const tbody = document.getElementById('workoutsTableBody');
    const workouts = storage.get('workouts');
    const filteredWorkouts = workouts.filter(w => w.exercise === currentExercise);
    
    tbody.innerHTML = '';
    
    if (filteredWorkouts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #6b7280;">
                    🏋️ Нет данных тренировок. Добавьте первую тренировку!
                </td>
            </tr>
        `;
        return;
    }
    
    const exerciseNames = {
        'squat': 'Приседания',
        'benchpress': 'Жим лежа',
        'deadlift': 'Становая тяга',
        'pullup': 'Подтягивания'
    };
    
    filteredWorkouts.forEach((workout, index) => {
        const volume = (workout.weight * workout.reps * workout.sets).toFixed(0);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(workout.date)}</td>
            <td><strong>${exerciseNames[workout.exercise]}</strong></td>
            <td>${workout.weight}</td>
            <td>${workout.reps}</td>
            <td>${workout.sets}</td>
            <td><strong>${volume}</strong></td>
            <td class="table-actions">
                <button onclick="deleteWorkout(${index})" class="danger">
                    <span>🗑️</span>
                    Удалить
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ==============================
// Генерация демо-данных
// ==============================
function generateMeasurementsData() {
    const measurements = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    
    let weight = 78;
    let chest = 102;
    let waist = 88;
    let hips = 106;
    
    for (let i = 0; i < 30; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i * 3);
        
        // Реалистичная прогрессия
        weight = 78 - (i * 0.25) + (Math.random() * 0.5 - 0.25);
        chest = 102 - (i * 0.15) + (Math.random() * 0.3 - 0.15);
        waist = 88 - (i * 0.3) + (Math.random() * 0.4 - 0.2);
        hips = 106 - (i * 0.2) + (Math.random() * 0.3 - 0.15);
        
        measurements.push({
            date: date.toISOString().split('T')[0],
            weight: parseFloat(weight.toFixed(1)),
            chest: parseFloat(chest.toFixed(1)),
            waist: parseFloat(waist.toFixed(1)),
            hips: parseFloat(hips.toFixed(1)),
            height: userHeight
        });
    }
    
    storage.set('measurements', measurements);
    showNotification('Демо-данные измерений сгенерированы!', 'success');
    loadMeasurements();
}

function generateWorkoutsData() {
    const workouts = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 120);
    
    const exercises = [
        { id: 'squat', name: 'Приседания', baseWeight: 60 },
        { id: 'benchpress', name: 'Жим лежа', baseWeight: 40 },
        { id: 'deadlift', name: 'Становая тяга', baseWeight: 70 },
        { id: 'pullup', name: 'Подтягивания', baseWeight: 0 }
    ];
    
    exercises.forEach(exercise => {
        let currentWeight = exercise.baseWeight;
        let currentReps = exercise.id === 'pullup' ? 5 : 8;
        
        for (let week = 0; week < 16; week++) {
            const sessionsPerWeek = exercise.id === 'pullup' ? 3 : 2;
            
            for (let session = 0; session < sessionsPerWeek; session++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + (week * 7) + (session * 3));
                
                let sessionWeight = currentWeight;
                if (Math.random() > 0.7 && exercise.id !== 'pullup') {
                    sessionWeight += Math.random() * 5 - 2.5;
                }
                
                if (week % 4 === 0 && week > 0) {
                    currentWeight += exercise.id === 'pullup' ? 0 : 5;
                    currentReps += Math.random() > 0.5 ? 1 : 0;
                }
                
                const sets = 3 + (week > 8 ? 1 : 0);
                const reps = Math.max(1, currentReps + (session === 0 ? 0 : -1));
                
                workouts.push({
                    date: date.toISOString().split('T')[0],
                    exercise: exercise.id,
                    weight: exercise.id === 'pullup' ? 0 : parseFloat(sessionWeight.toFixed(1)),
                    reps: Math.max(1, reps),
                    sets: sets
                });
            }
        }
    });
    
    workouts.sort((a, b) => new Date(a.date) - new Date(b.date));
    storage.set('workouts', workouts);
    showNotification('Демо-данные тренировок сгенерированы!', 'success');
    loadWorkouts();
}

// ==============================
// Очистка данных
// ==============================
function clearMeasurements() {
    if (confirm('Вы уверены, что хотите удалить ВСЕ записи измерений? Это действие нельзя отменить.')) {
        storage.clear('measurements');
        showNotification('Все записи измерений удалены', 'info');
        loadMeasurements();
    }
}

function clearWorkouts() {
    if (confirm('Вы уверены, что хотите удалить ВСЕ записи тренировок? Это действие нельзя отменить.')) {
        storage.clear('workouts');
        showNotification('Все записи тренировок удалены', 'info');
        loadWorkouts();
    }
}

function resetAllData() {
    if (confirm('ВНИМАНИЕ! Это удалит ВСЕ данные приложения.\n\nИзмерения, тренировки и настройки будут безвозвратно удалены.\n\nПродолжить?')) {
        storage.clear('measurements');
        storage.clear('workouts');
        storage.clear('settings');
        showNotification('Все данные сброшены', 'info');
        loadMeasurements();
        loadWorkouts();
    }
}

// ==============================
// Экспорт и импорт данных
// ==============================
function exportData() {
    const data = storage.getAll();
    data.exportDate = new Date().toISOString();
    data.appName = 'Fitness Tracker';
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `fitness-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('Данные успешно экспортированы!', 'success');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                if (!data.measurements || !data.workouts) {
                    throw new Error('Некорректный формат файла');
                }
                
                if (confirm('Заменить текущие данные импортированными?\n\nСтарые данные будут удалены.')) {
                    storage.setAll(data);
                    if (data.settings && data.settings.height) {
                        userHeight = data.settings.height;
                        document.getElementById('height').value = userHeight;
                    }
                    
                    showNotification('Данные успешно импортированы!', 'success');
                    loadMeasurements();
                    loadWorkouts();
                }
            } catch (error) {
                alert('Ошибка при чтении файла: ' + error.message);
                showNotification('Ошибка импорта данных', 'error');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

// ==============================
// Вспомогательные функции
// ==============================
function showNotification(message, type = 'success') {
    // Удаляем предыдущее уведомление
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#10b981' : 
                     type === 'error' ? '#ef4444' : 
                     type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 400px;
    `;
    
    notification.innerHTML = `${icons[type] || icons.info} ${message}`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// ==============================
// Глобальный доступ к функциям
// ==============================
window.deleteMeasurement = deleteMeasurement;
window.deleteWorkout = deleteWorkout;