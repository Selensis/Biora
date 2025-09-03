// Основные привычки (якоря)
const anchorsConfig = [
    {
        id: 'morning-light',
        title: 'Утренний свет',
        description: '10-15 минут на улице в течение часа после пробуждения',
        icon: '☀️',
        time: '07:00',
        completed: false
    },
    {
        id: 'first-meal',
        title: 'Первый прием пищи',
        description: 'Завтрак в течение часа после пробуждения',
        icon: '🍽️',
        time: '08:00',
        completed: false
    },
    {
        id: 'hydration',
        title: 'Утренняя гидратация',
        description: 'Стакан воды после пробуждения',
        icon: '💧',
        time: '07:10',
        completed: false
    },
    {
        id: 'daylight-exposure',
        title: 'Свет дня',
        description: 'Не менее 1 часа при естественном освещении',
        icon: '🔆',
        time: '12:00',
        completed: false
    },
    {
        id: 'movement',
        title: 'Дневная активность',
        description: '30 минут физической активности',
        icon: '🚶‍♂️',
        time: '15:00',
        completed: false
    },
    {
        id: 'digital-sunset',
        title: 'Цифровой закат',
        description: 'Отключение экранов за 1 час до сна',
        icon: '📵',
        time: '21:00',
        completed: false
    },
    {
        id: 'last-meal',
        title: 'Последний прием пищи',
        description: 'Ужин завершен за 3 часа до сна',
        icon: '🌙',
        time: '18:00',
        completed: false
    }
];

// Текущее состояние пользователя
let userState = {
    name: 'Друг',
    chronotype: 'dove',
    wakeUpTime: '07:00',
    bedtime: '23:00',
    streak: 0,
    lastActiveDate: null,
    syncScore: 0
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    renderAnchors();
    updateUI();
    setupEventListeners();
    checkDayStreak();
    scheduleNotifications();
});

// Загрузка данных пользователя из localStorage
function loadUserData() {
    const savedData = localStorage.getItem('circadianUserData');
    if (savedData) {
        userState = {...userState, ...JSON.parse(savedData)};
    }
    updateUserInfo();
}

// Сохранение данных пользователя
function saveUserData() {
    localStorage.setItem('circadianUserData', JSON.stringify(userState));
}

// Обновление информации о пользователе в UI
function updateUserInfo() {
    document.getElementById('user-name').textContent = userState.name;
    
    const chronotypeNames = {
        'lark': 'Жаворонок',
        'dove': 'Голубь',
        'owl': 'Сова'
    };
    document.getElementById('user-chronotype').textContent = chronotypeNames[userState.chronotype];
    
    document.getElementById('streak-days').textContent = userState.streak;
    updateSyncScore();
}

// Рендер карточек привычек
function renderAnchors() {
    const container = document.querySelector('.anchor-cards');
    container.innerHTML = '';

    anchorsConfig.forEach(anchor => {
        let habitTime = calculateHabitTime(anchor.id, userState.wakeUpTime, userState.bedtime);
        
        const card = document.createElement('div');
        card.className = `anchor-card ${getAnchorStatus(anchor.id, habitTime)}`;
        card.innerHTML = `
            <div class="anchor-icon">${anchor.icon}</div>
            <div class="anchor-content">
                <div class="anchor-title">${anchor.title}</div>
                <div class="anchor-time">${habitTime} • ${anchor.description}</div>
            </div>
            <div class="anchor-checkbox ${anchor.completed ? 'checked' : ''}" data-id="${anchor.id}">✓</div>
        `;
        container.appendChild(card);
    });

    // Добавляем обработчики для чекбоксов
    document.querySelectorAll('.anchor-checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', function() {
            const anchorId = this.getAttribute('data-id');
            toggleAnchorCompletion(anchorId);
        });
    });
}

// Вычисление времени для привычки
function calculateHabitTime(anchorId, wakeUpTime, bedtime) {
    const wakeUp = new Date(`2000-01-01T${wakeUpTime}:00`);
    const bedTime = new Date(`2000-01-01T${bedtime}:00`);
    
    switch(anchorId) {
        case 'morning-light':
            return wakeUp.toTimeString().substr(0, 5);
        case 'hydration':
            wakeUp.setMinutes(wakeUp.getMinutes() + 10);
            return wakeUp.toTimeString().substr(0, 5);
        case 'first-meal':
            wakeUp.setMinutes(wakeUp.getMinutes() + 60);
            return wakeUp.toTimeString().substr(0, 5);
        case 'daylight-exposure':
            wakeUp.setHours(12, 0);
            return wakeUp.toTimeString().substr(0, 5);
        case 'movement':
            wakeUp.setHours(15, 0);
            return wakeUp.toTimeString().substr(0, 5);
        case 'last-meal':
            bedTime.setHours(bedTime.getHours() - 3);
            return bedTime.toTimeString().substr(0, 5);
        case 'digital-sunset':
            bedTime.setHours(bedTime.getHours() - 1);
            return bedTime.toTimeString().substr(0, 5);
        default:
            return '08:00';
    }
}

// Определение статуса привычки
function getAnchorStatus(anchorId, habitTime) {
    const now = new Date();
    const habitDateTime = new Date(`2000-01-01T${habitTime}:00`);
    const timeDiff = now.getHours() * 60 + now.getMinutes() - 
                    (habitDateTime.getHours() * 60 + habitDateTime.getMinutes());
    
    const anchor = anchorsConfig.find(a => a.id === anchorId);
    
    if (anchor && anchor.completed) {
        return 'completed';
    } else if (timeDiff > 120) { // Если прошло более 2 часов после времени привычки
        return 'missed';
    } else {
        return 'pending';
    }
}

// Переключение выполнения привычки
function toggleAnchorCompletion(anchorId) {
    const anchor = anchorsConfig.find(a => a.id === anchorId);
    if (anchor) {
        anchor.completed = !anchor.completed;
        saveUserData();
        updateUI();
        
        // Показываем мотивационное сообщение
        showMotivationMessage(anchorId, anchor.completed);
    }
}

// Мотивационные сообщения
function showMotivationMessage(anchorId, completed) {
    const messages = {
        'morning-light': completed ? 
            'Отлично! Солнечный свет запустил ваши циркадные ритмы!' : 
            'Не забывайте про утренний свет для синхронизации ритмов',
        'hydration': completed ?
            'Вода запускает метаболизм и помогает проснуться!' :
            'Утренняя гидратация важна для детоксикации',
        'movement': completed ?
            'Активность улучшила вашу чувствительность к инсулину!' :
            'Движение помогает синхронизировать периферические часы',
        'digital-sunset': completed ?
            'Отлично! Мелатонин сможет выработаться без помех!' :
            'Синий свет вечером подавляет выработку мелатонина'
    };
    
    if (messages[anchorId]) {
        alert(messages[anchorId]);
    }
}

// Обновление UI
function updateUI() {
    const completedCount = anchorsConfig.filter(a => a.completed).length;
    document.getElementById('completed-anchors').textContent = completedCount;
    
    // Обновляем внешний вид чекбоксов
    document.querySelectorAll('.anchor-checkbox').forEach(checkbox => {
        const anchorId = checkbox.getAttribute('data-id');
        const anchor = anchorsConfig.find(a => a.id === anchorId);
        if (anchor && anchor.completed) {
            checkbox.classList.add('checked');
        } else {
            checkbox.classList.remove('checked');
        }
    });
    
    updateSyncScore();
}

// Обновление процента синхронизации
function updateSyncScore() {
    const totalAnchors = anchorsConfig.length;
    const completedAnchors = anchorsConfig.filter(a => a.completed).length;
    const score = totalAnchors > 0 ? Math.round((completedAnchors / totalAnchors) * 100) : 0;
    
    userState.syncScore = score;
    document.getElementById('sync-percent').textContent = `${score}%`;
    
    // Анимация кругового прогресса
    const progressCircle = document.querySelector('.score-ring-progress');
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (score / 100) * circumference;
    progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    progressCircle.style.strokeDashoffset = offset;
    
    // Меняем цвет в зависимости от процента
    if (score >= 80) {
        progressCircle.style.stroke = '#48bb78'; // зеленый
    } else if (score >= 50) {
        progressCircle.style.stroke = '#ed8936'; // оранжевый
    } else {
        progressCircle.style.stroke = '#e53e3e'; // красный
    }
    
    saveUserData();
}

// Проверка и обновление серии дней
function checkDayStreak() {
    const today = new Date().toDateString();
    const lastActive = userState.lastActiveDate;
    
    if (!lastActive) {
        userState.streak = 1;
    } else if (lastActive !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastActive === yesterday.toDateString()) {
            userState.streak++;
        } else {
            userState.streak = 1;
        }
    }
    
    userState.lastActiveDate = today;
    saveUserData();
    updateUserInfo();
}

// Настройка уведомлений
function scheduleNotifications() {
    if ('Notification' in window && Notification.permission === 'granted') {
        anchorsConfig.forEach(anchor => {
            const habitTime = calculateHabitTime(anchor.id, userState.wakeUpTime, userState.bedtime);
            const [hours, minutes] = habitTime.split(':').map(Number);
            
            const now = new Date();
            const notificationTime = new Date();
            notificationTime.setHours(hours, minutes, 0);
            
            if (notificationTime > now) {
                const timeout = notificationTime - now;
                setTimeout(() => {
                    new Notification('Circadian Tracker', {
                        body: `Время для: ${anchor.title} - ${anchor.description}`,
                        icon: '/assets/icons/icon-192x192.png'
                    });
                }, timeout);
            }
        });
    }
}

// Запрос разрешения на уведомления
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                scheduleNotifications();
            }
        });
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Модальное окно настроек
    const modal = document.getElementById('settings-modal');
    const settingsBtn = document.getElementById('settings-btn');
    const closeBtn = document.querySelector('.close');
    const userForm = document.getElementById('user-form');

    settingsBtn.addEventListener('click', () => {
        modal.style.display = 'block';
        // Заполняем форму текущими значениями
        document.getElementById('name').value = userState.name;
        document.getElementById('wake-up-time').value = userState.wakeUpTime;
        document.getElementById('bedtime').value = userState.bedtime;
        document.getElementById('chronotype').value = userState.chronotype;
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    userForm.addEventListener('submit', (event) => {
        event.preventDefault();
        
        userState.name = document.getElementById('name').value;
        userState.wakeUpTime = document.getElementById('wake-up-time').value;
        userState.bedtime = document.getElementById('bedtime').value;
        userState.chronotype = document.getElementById('chronotype').value;
        
        saveUserData();
        updateUserInfo();
        renderAnchors();
        scheduleNotifications();
        
        modal.style.display = 'none';
    });

    // Запрос разрешения на уведомления при первом использовании
    if (!localStorage.getItem('notificationRequested')) {
        setTimeout(() => {
            requestNotificationPermission();
            localStorage.setItem('notificationRequested', 'true');
        }, 3000);
    }
}

// Простая реализация Service Worker для PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(() => console.log('Service Worker зарегистрирован'))
            .catch(err => console.log('Ошибка регистрации Service Worker:', err));
    });
}

// Автоматическое обновление статуса привычек каждый час
setInterval(() => {
    renderAnchors();
}, 60 * 60 * 1000);
