// ==============================
// Цветовая палитра для графиков
// ==============================
const chartColors = {
    burgundy: '#800020',
    wine: '#722F37',
    mahogany: '#954535',
    cinnamon: '#7B3F00',
    cordovan: '#893F45',
    claret: '#7F1734',
    bordeaux: '#5D1916',
    rust: '#B7410E',
    maroon: '#800000'
};

// ==============================
// Хранилище данных
// ==============================
const storage = {
    get: function(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    },
    set: function(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },
    clear: function(key) {
        localStorage.removeItem(key);
    },
    getAll: function() {
        return {
            measurements: this.get('measurements'),
            workouts: this.get('workouts'),
            settings: this.get('settings'),
            version: '1.0.0'
        };
    },
    setAll: function(data) {
        if (data.measurements) this.set('measurements', data.measurements);
        if (data.workouts) this.set('workouts', data.workouts);
        if (data.settings) this.set('settings', data.settings);
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
let userHeight = 1.75;

// ==============================
// Вспомогательные функции
// ==============================
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function showNotification(message, type = 'success') {
    // Удаляем предыдущее уведомление
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    
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
        background: ${type === 'success' ? '#800020' : 
                     type === 'error' ? '#5D1916' : 
                     type === 'warning' ? '#B7410E' : '#722F37'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 400px;
        border: 1px solid ${type === 'success' ? '#5D1916' : 
                      type === 'error' ? '#4A0404' : 
                      type === 'warning' ? '#954535' : '#7F1734'};
    `;
    
    notification.innerHTML = `${icons[type] || icons.info} ${message}`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// ==============================
// Инициализация приложения
// ==============================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, инициализируем приложение...');
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
    const addDataBtn = document.getElementById('addDataBtn');
    if (addDataBtn) {
        addDataBtn.addEventListener('click', () => {
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('measureDate').value = today;
            measurementModal.style.display = 'block';
        });
    }
    
    // Кнопка добавления тренировки
    const addWorkoutBtn = document.getElementById('addWorkoutBtn');
    if (addWorkoutBtn) {
        addWorkoutBtn.addEventListener('click', () => {
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('workoutDate').value = today;
            workoutModal.style.display = 'block';
        });
    }
    
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
    const measurementForm = document.getElementById('measurementForm');
    if (measurementForm) {
        measurementForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addMeasurement();
        });
    }
    
    // Форма тренировок
    const workoutForm = document.getElementById('workoutForm');
    if (workoutForm) {
        workoutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addWorkout();
        });
    }
}

// ==============================
// Инициализация кнопок управления
// ==============================
function initControlButtons() {
    // Инициализация выбора упражнения
    const exerciseSelect = document.getElementById('exerciseSelect');
    if (exerciseSelect) {
        exerciseSelect.addEventListener('change', function() {
            currentExercise = this.value;
            updateWorkoutsChart();
            updateWorkoutsTable();
        });
    }
    
    // Инициализация выбора метрики
    const metricSelect = document.getElementById('metricSelect');
    if (metricSelect) {
        metricSelect.addEventListener('change', function() {
            currentMetric = this.value;
            updateWorkoutsChart();
        });
    }
    
    // Кнопки для измерений
    const generateMeasurementsBtn = document.getElementById('generateMeasurementsBtn');
    if (generateMeasurementsBtn) {
        generateMeasurementsBtn.addEventListener('click', generateMeasurementsData);
    }
    
    const clearMeasurementsBtn = document.getElementById('clearMeasurementsBtn');
    if (clearMeasurementsBtn) {
        clearMeasurementsBtn.addEventListener('click', clearMeasurements);
    }
    
    // Кнопки для тренировок
    const generateWorkoutsBtn = document.getElementById('generateWorkoutsBtn');
    if (generateWorkoutsBtn) {
        generateWorkoutsBtn.addEventListener('click', generateWorkoutsData);
    }
    
    const clearWorkoutsBtn = document.getElementById('clearWorkoutsBtn');
    if (clearWorkoutsBtn) {
        clearWorkoutsBtn.addEventListener('click', clearWorkouts);
    }
    
    // Кнопки настроек
    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', exportData);
    }
    
    const importDataBtn = document.getElementById('importDataBtn');
    if (importDataBtn) {
        importDataBtn.addEventListener('click', importData);
    }
    
    const resetAllBtn = document.getElementById('resetAllBtn');
    if (resetAllBtn) {
        resetAllBtn.addEventListener('click', resetAllData);
    }
}

// ==============================
// Инициализация настроек
// ==============================
function initSettings() {
    const settings = storage.get('settings');
    if (settings && settings.height) {
        userHeight = settings.height;
        const heightInput = document.getElementById('height');
        if (heightInput) {
            heightInput.value = userHeight;
        }
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
    const heightInput = document.getElementById('height');
    const height = heightInput ? parseFloat(heightInput.value) : userHeight;
    
    if (isNaN(height) || height < 1.4 || height > 2.2) {
        showNotification('Пожалуйста, введите корректный рост (от 1.4 до 2.2 м)', 'error');
        return;
    }
    
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
    
    if (isNaN(measurement.weight) || measurement.weight < 30 || measurement.weight > 200) {
        showNotification('Пожалуйста, введите корректный вес (от 30 до 200 кг)', 'error');
        return;
    }
    
    const measurements = storage.get('measurements');
    measurements.push(measurement);
    measurements.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    storage.set('measurements', measurements);
    
    document.getElementById('measurementModal').style.display = 'none';
    document.getElementById('measurementForm').reset();
    
    if (heightInput) {
        heightInput.value = userHeight;
    }
    
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
    const ctx = document.getElementById('measurementsChart');
    if (!ctx) return;
    
    const canvasContext = ctx.getContext('2d');
    
    if (measurementsChart) {
        measurementsChart.destroy();
    }
    
    if (measurements.length === 0) {
        measurementsChart = new Chart(canvasContext, {
            type: 'line',
            data: { labels: [], datasets: [] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
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
    
    measurementsChart = new Chart(canvasContext, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Вес (кг)',
                    data: weights,
                    borderColor: chartColors.burgundy,
                    backgroundColor: hexToRgba(chartColors.burgundy, 0.1),
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    borderWidth: 2
                },
                {
                    label: 'Грудь (см)',
                    data: chests,
                    borderColor: chartColors.wine,
                    backgroundColor: hexToRgba(chartColors.wine, 0.1),
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    borderWidth: 2
                },
                {
                    label: 'Талия (см)',
                    data: waists,
                    borderColor: chartColors.mahogany,
                    backgroundColor: hexToRgba(chartColors.mahogany, 0.1),
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    borderWidth: 2
                },
                {
                    label: 'Бедра (см)',
                    data: hips,
                    borderColor: chartColors.cinnamon,
                    backgroundColor: hexToRgba(chartColors.cinnamon, 0.1),
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    borderWidth: 2
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
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(74, 4, 4, 0.9)',
                    titleFont: { size: 14 },
                    bodyFont: { size: 13 },
                    padding: 12,
                    cornerRadius: 6
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
                        text: 'Значения (кг/см)',
                        font: {
                            size: 13,
                            weight: 'bold'
                        },
                        color: chartColors.burgundy
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
    const ctx = document.getElementById('bmiChart');
    if (!ctx) return;
    
    const canvasContext = ctx.getContext('2d');
    
    if (bmiChart) {
        bmiChart.destroy();
    }
    
    if (measurements.length === 0) {
        bmiChart = new Chart(canvasContext, {
            type: 'line',
            data: { labels: [], datasets: [] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
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
        const bmi = m.weight / (height * height);
        return parseFloat(bmi.toFixed(1));
    });
    
    bmiChart = new Chart(canvasContext, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'ИМТ',
                data: bmiValues,
                borderColor: chartColors.cordovan,
                backgroundColor: hexToRgba(chartColors.cordovan, 0.1),
                tension: 0.4,
                fill: true,
                pointRadius: 6,
                pointHoverRadius: 8,
                borderWidth: 2
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
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const bmi = context.raw;
                            let category = '';
                            if (bmi < 18.5) category = 'Недостаток';
                            else if (bmi < 25) category = 'Норма';
                            else if (bmi < 30) category = 'Избыток';
                            else category = 'Ожирение';
                            
                            return `ИМТ: ${bmi} (${category})`;
                        }
                    },
                    backgroundColor: 'rgba(74, 4, 4, 0.9)',
                    titleFont: { size: 14 },
                    bodyFont: { size: 13 },
                    padding: 12,
                    cornerRadius: 6
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
                        text: 'Индекс массы тела',
                        font: {
                            size: 13,
                            weight: 'bold'
                        },
                        color: chartColors.burgundy
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
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (measurements.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #666666;">
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
            <td><strong style="color: ${chartColors.burgundy};">${measurement.weight}</strong></td>
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
    
    if (isNaN(workout.weight) || workout.weight < 0 || workout.weight > 500) {
        showNotification('Пожалуйста, введите корректный вес (от 0 до 500 кг)', 'error');
        return;
    }
    
    if (isNaN(workout.reps) || workout.reps < 1 || workout.reps > 100) {
        showNotification('Пожалуйста, введите корректное количество повторов (от 1 до 100)', 'error');
        return;
    }
    
    if (isNaN(workout.sets) || workout.sets < 1 || workout.sets > 20) {
        showNotification('Пожалуйста, введите корректное количество подходов (от 1 до 20)', 'error');
        return;
    }
    
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
    const ctx = document.getElementById('workoutsChart');
    if (!ctx) return;
    
    const canvasContext = ctx.getContext('2d');
    const workouts = storage.get('workouts');
    const filteredWorkouts = workouts.filter(w => w.exercise === currentExercise);
    
    if (workoutsChart) {
        workoutsChart.destroy();
    }
    
    updateWorkoutLegend();
    
    if (filteredWorkouts.length === 0) {
        workoutsChart = new Chart(canvasContext, {
            type: 'line',
            data: { labels: [], datasets: [] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });
        return;
    }
    
    const dates = filteredWorkouts.map(w => formatDate(w.date));
    
    let data = [];
    let label = '';
    let color = chartColors.burgundy;
    
    switch(currentMetric) {
        case 'weight':
            data = filteredWorkouts.map(w => w.weight);
            label = 'Рабочий вес (кг)';
            color = chartColors.burgundy;
            break;
        case 'reps':
            data = filteredWorkouts.map(w => w.reps);
            label = 'Количество повторов';
            color = chartColors.wine;
            break;
        case 'volume':
            data = filteredWorkouts.map(w => w.weight * w.reps * w.sets);
            label = 'Объем нагрузки (кг)';
            color = chartColors.mahogany;
            break;
        case 'max':
            data = filteredWorkouts.map(w => w.weight * (1 + w.reps / 30));
            label = 'Примерный 1ПМ (кг)';
            color = chartColors.claret;
            break;
    }
    
    workoutsChart = new Chart(canvasContext, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: label,
                data: data,
                borderColor: color,
                backgroundColor: hexToRgba(color, 0.1),
                tension: 0.4,
                fill: true,
                pointBackgroundColor: color,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 10,
                borderWidth: 2
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
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
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
                                    const volume = (workout.weight * workout.reps * workout.sets).toFixed(0);
                                    tooltipText += `\nОбъем: ${volume} кг`;
                                }
                            }
                            return tooltipText;
                        }
                    },
                    backgroundColor: 'rgba(74, 4, 4, 0.9)',
                    titleFont: { size: 14 },
                    bodyFont: { size: 13 },
                    padding: 12,
                    cornerRadius: 6
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
                        text: getYAxisLabel(currentMetric),
                        font: {
                            size: 13,
                            weight: 'bold'
                        },
                        color: chartColors.burgundy
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
    if (!legend) return;
    
    const exerciseNames = {
        'squat': 'Приседания',
        'benchpress': 'Жим лежа',
        'deadlift': 'Становая тяга',
        'pullup': 'Подтягивания'
    };
    
    const metricLabels = {
        'weight': 'Рабочий вес',
        'reps': 'Повторы',
        'volume': 'Объем',
        'max': '1ПМ'
    };
    
    legend.innerHTML = `
        <div class="legend-item">
            <span class="legend-color" style="background-color: ${getMetricColor()}"></span>
            <span>${exerciseNames[currentExercise] || currentExercise}</span>
        </div>
        <div class="legend-item">
            <span>📊</span>
            <span>${metricLabels[currentMetric] || currentMetric}</span>
        </div>
    `;
}

function getMetricColor() {
    switch(currentMetric) {
        case 'weight': return chartColors.burgundy;
        case 'reps': return chartColors.wine;
        case 'volume': return chartColors.mahogany;
        case 'max': return chartColors.claret;
        default: return chartColors.burgundy;
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
    if (!tbody) return;
    
    const workouts = storage.get('workouts');
    const filteredWorkouts = workouts.filter(w => w.exercise === currentExercise);
    
    tbody.innerHTML = '';
    
    if (filteredWorkouts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #666666;">
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
            <td><strong style="color: ${chartColors.burgundy};">${exerciseNames[workout.exercise] || workout.exercise}</strong></td>
            <td>${workout.weight}</td>
            <td>${workout.reps}</td>
            <td>${workout.sets}</td>
            <td><strong style="color: ${chartColors.mahogany};">${volume}</strong></td>
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
    
    for (let i = 0; i < 20; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i * 4);
        
        weight = 78 - (i * 0.3) + (Math.random() * 0.6 - 0.3);
        chest = 102 - (i * 0.2) + (Math.random() * 0.4 - 0.2);
        waist = 88 - (i * 0.4) + (Math.random() * 0.5 - 0.25);
        hips = 106 - (i * 0.25) + (Math.random() * 0.4 - 0.2);
        
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
        
        for (let week = 0; week < 12; week++) {
            const sessionsPerWeek = exercise.id === 'pullup' ? 3 : 2;
            
            for (let session = 0; session < sessionsPerWeek; session++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + (week * 7) + (session * 3));
                
                let sessionWeight = currentWeight;
                if (Math.random() > 0.7 && exercise.id !== 'pullup') {
                    sessionWeight += Math.random() * 3 - 1.5;
                }
                
                if (week % 3 === 0 && week > 0) {
                    currentWeight += exercise.id === 'pullup' ? 0 : 2.5;
                    currentReps += Math.random() > 0.5 ? 1 : 0;
                }
                
                const sets = 3 + (week > 6 ? 1 : 0);
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
                        const heightInput = document.getElementById('height');
                        if (heightInput) {
                            heightInput.value = userHeight;
                        }
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
// Глобальный доступ к функциям
// ==============================
window.deleteMeasurement = deleteMeasurement;
window.deleteWorkout = deleteWorkout;
