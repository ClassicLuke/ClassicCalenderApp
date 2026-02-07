        let currentDate = new Date();
        let currentView = 'day';
        let editingItem = null;

        const colors = [
            '#ef4444', '#f97316', '#f59e0b', '#84cc16',
            '#10b981', '#06b6d4', '#3b82f6', '#6366f1',
            '#8b5cf6', '#ec4899', '#64748b', '#000000'
        ];

        const defaultEventTypes = ['Class', 'Work', 'Lab', 'Meeting', 'Practice'];
        const defaultTaskTypes = ['Homework', 'Study', 'Pay Bills', 'Take Pills', 'Errand'];
        const defaultReminderTypes = ['Reminder', 'Call', 'Email', 'Check-in'];

        let events = [];
        let tasks = [];
        let reminders = [];
        let reminderTimers = [];
        let notificationsEnabled = false;
        let userName = 'Your';
        let passcodeEnabled = false;
        let passcodeHash = '';
        let passcodeSalt = '';
        let legacyPasscodeValue = '';
        let passcodeLength = 4;
        let darkModeEnabled = false;
        let nowLineTimer = null;
        let lastAutoScrollHour = null;
        let passcodeEntry = '';
        let scrollShadowTarget = null;
        let scrollShadowHandler = null;
        let daySwipeTarget = null;
        let daySwipeHandlers = null;
        let rangeSwipeBindings = [];
        let dragPayload = null;
        let currentFilter = 'all';
        let hideCompleted = false;
        let searchQuery = '';
        const userLocale = navigator.language || 'en-US';
        const modalIds = ['addModal', 'settingsModal', 'lockModal'];
        let activeModalId = null;
        let lastFocusedElement = null;

        function createItemId() {
            if (window.crypto && typeof window.crypto.randomUUID === 'function') {
                return window.crypto.randomUUID();
            }
            return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
        }

        // Escape dynamic text before injecting into template strings.
        function escapeHtml(value) {
            if (window.PlannerCore && typeof window.PlannerCore.escapeHtml === 'function') {
                return window.PlannerCore.escapeHtml(value);
            }
            return String(value || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        // Load saved data and migrate legacy formats.
        function loadData() {
            const saved = localStorage.getItem('plannerData');
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    if (data.events || data.tasks || data.reminders) {
                        events = Array.isArray(data.events) ? data.events : [];
                        tasks = Array.isArray(data.tasks) ? data.tasks : [];
                        reminders = Array.isArray(data.reminders) ? data.reminders : [];
                    } else {
                        const classes = Array.isArray(data.classes) ? data.classes : [];
                        const homework = Array.isArray(data.homework) ? data.homework : [];
                        const appointments = Array.isArray(data.appointments) ? data.appointments : [];
                        const routines = Array.isArray(data.routines) ? data.routines : [];

                        events = [
                            ...classes.map(cls => ({
                                id: cls.id,
                                category: 'event',
                                title: cls.title,
                                type: 'Class',
                                time: cls.time || '',
                                color: cls.color || colors[11],
                                recurringDays: cls.recurringDays || [],
                                repeatCycle: 'weekly',
                                description: '',
                                reminderTime: ''
                            })),
                            ...appointments.map(apt => ({
                                id: apt.id,
                                category: 'event',
                                title: apt.title,
                                type: 'Appointment',
                                date: apt.date,
                                time: apt.time || '',
                                color: colors[11],
                                description: apt.description || '',
                                reminderTime: apt.reminderTime || '',
                                completed: apt.completed || false
                            })),
                            ...routines.map(rt => ({
                                id: rt.id,
                                category: 'event',
                                title: rt.title,
                                type: 'Routine',
                                time: rt.time || '',
                                color: rt.color || colors[11],
                                recurringDays: rt.recurringDays || [],
                                repeatCycle: 'weekly',
                                description: rt.description || '',
                                reminderTime: rt.reminderTime || '',
                                completedDates: rt.completedDates || []
                            }))
                        ];

                        tasks = homework.map(hw => ({
                            id: hw.id,
                            category: 'task',
                            title: hw.title,
                            type: 'Homework',
                            date: hw.date,
                            dueTime: hw.dueTime || '',
                            description: hw.description || '',
                            reminderTime: hw.reminderTime || '',
                            completed: hw.completed || false
                        }));
                    }
                } catch (error) {
                    const backupKey = `plannerDataCorruptBackup_${Date.now()}`;
                    localStorage.setItem(backupKey, saved);
                    localStorage.removeItem('plannerData');
                    events = [];
                    tasks = [];
                    reminders = [];
                }
            }
            notificationsEnabled = localStorage.getItem('plannerNotifications') === 'on';
            userName = localStorage.getItem('plannerUserName') || 'Your';
            
            passcodeEnabled = localStorage.getItem('plannerPasscodeEnabled') === 'on';
            passcodeHash = localStorage.getItem('plannerPasscodeHash') || '';
            passcodeSalt = localStorage.getItem('plannerPasscodeSalt') || '';
            legacyPasscodeValue = localStorage.getItem('plannerPasscode') || '';
            passcodeLength = parseInt(localStorage.getItem('plannerPasscodeLength') || '4', 10);
            if (!Number.isFinite(passcodeLength) || passcodeLength < 4 || passcodeLength > 8) {
                passcodeLength = 4;
            }
            darkModeEnabled = localStorage.getItem('plannerDarkMode') === 'on';
            currentFilter = localStorage.getItem('plannerFilter') || 'all';
            hideCompleted = localStorage.getItem('plannerHideCompleted') === 'on';
        }

        // Save data to localStorage.
        function saveData() {
            localStorage.setItem('plannerData', JSON.stringify({
                events,
                tasks,
                reminders
            }));
        }

        async function initializeApp() {
            loadData();
            await migrateLegacyPasscode();
            applyUserSettings();
            handleInitialLock();
            updateCurrentDate();
            renderView();
            initializeColorPicker();
            initializeTimePickers();
            refreshTypeSuggestions();
            updateNotificationButton();
            applyFilterUI();
            scheduleReminders();
            setupModalDismissal();
            setupGlobalShortcuts();
            registerServiceWorker();
            initializeModalAccessibility();
        }

        initializeApp().catch(error => {
            console.error('Initialization failed:', error);
        });

        // Switch between day, week, and all views.
        function switchView(view, button) {
            currentView = view;
            document.querySelectorAll('.view-toggle button').forEach(btn => {
                btn.classList.remove('active');
            });
            if (button) button.classList.add('active');

            document.getElementById('dailyView').style.display = view === 'day' ? 'block' : 'none';
            document.getElementById('weekView').classList.toggle('active', view === 'week');
            document.getElementById('monthView').classList.toggle('active', view === 'month');
            renderView();
        }

        function setFilter(filter, button) {
            currentFilter = filter;
            localStorage.setItem('plannerFilter', filter);
            document.querySelectorAll('.chip-button[data-filter]').forEach(btn => {
                btn.classList.toggle('active', btn === button);
            });
            renderView();
        }

        function toggleHideCompleted(button) {
            hideCompleted = !hideCompleted;
            localStorage.setItem('plannerHideCompleted', hideCompleted ? 'on' : 'off');
            if (button) button.classList.toggle('active', hideCompleted);
            renderView();
        }

        function updateSearch(value) {
            searchQuery = value;
            renderView();
        }

        // Open the settings modal and preload values.
        function openSettingsModal() {
            document.getElementById('userNameInput').value = userName === 'Your' ? '' : userName;
            document.getElementById('darkModeToggle').checked = darkModeEnabled;
            document.getElementById('passcodeToggle').value = passcodeEnabled ? 'on' : 'off';
            document.getElementById('passcodeInput').value = '';
            document.getElementById('passcodeGroup').style.display = passcodeEnabled ? 'block' : 'none';
            setModalState('settingsModal', true);
        }

        // Close the settings modal.
        function closeSettingsModal() {
            setModalState('settingsModal', false);
        }

        function isValidPasscode(passcode) {
            return /^\d{4,8}$/.test(passcode);
        }

        function toBase64(bytes) {
            const chars = Array.from(bytes, b => String.fromCharCode(b)).join('');
            return btoa(chars);
        }

        function fromBase64(base64) {
            try {
                const chars = atob(base64);
                return Uint8Array.from(chars, ch => ch.charCodeAt(0));
            } catch {
                return null;
            }
        }

        async function hashPasscode(passcode, saltBase64) {
            const encoder = new TextEncoder();
            const saltBytes = fromBase64(saltBase64);
            if (!saltBytes || saltBytes.length === 0) {
                throw new Error('Invalid salt.');
            }
            const passBytes = encoder.encode(passcode);
            const payload = new Uint8Array(saltBytes.length + passBytes.length);
            payload.set(saltBytes, 0);
            payload.set(passBytes, saltBytes.length);
            const digest = await crypto.subtle.digest('SHA-256', payload);
            return toBase64(new Uint8Array(digest));
        }

        function generateSalt() {
            const bytes = new Uint8Array(16);
            crypto.getRandomValues(bytes);
            return toBase64(bytes);
        }

        async function setPasscode(passcode) {
            passcodeSalt = generateSalt();
            passcodeHash = await hashPasscode(passcode, passcodeSalt);
            passcodeLength = passcode.length;
            localStorage.setItem('plannerPasscodeHash', passcodeHash);
            localStorage.setItem('plannerPasscodeSalt', passcodeSalt);
            localStorage.setItem('plannerPasscodeLength', String(passcodeLength));
            localStorage.removeItem('plannerPasscode');
            legacyPasscodeValue = '';
        }

        async function verifyPasscode(passcode) {
            if (!passcodeHash || !passcodeSalt) return false;
            try {
                const nextHash = await hashPasscode(passcode, passcodeSalt);
                return nextHash === passcodeHash;
            } catch {
                return false;
            }
        }

        function clearStoredPasscode() {
            passcodeHash = '';
            passcodeSalt = '';
            legacyPasscodeValue = '';
            passcodeLength = 4;
            localStorage.removeItem('plannerPasscodeHash');
            localStorage.removeItem('plannerPasscodeSalt');
            localStorage.removeItem('plannerPasscodeLength');
            localStorage.removeItem('plannerPasscode');
        }

        async function migrateLegacyPasscode() {
            if (passcodeHash || !legacyPasscodeValue) return;
            if (!window.crypto || !window.crypto.subtle) {
                clearStoredPasscode();
                passcodeEnabled = false;
                localStorage.setItem('plannerPasscodeEnabled', 'off');
                return;
            }
            if (!isValidPasscode(legacyPasscodeValue)) {
                clearStoredPasscode();
                passcodeEnabled = false;
                localStorage.setItem('plannerPasscodeEnabled', 'off');
                return;
            }
            await setPasscode(legacyPasscodeValue);
        }

        // Save user name and preferences.
        async function saveSettings() {
            const nameInput = document.getElementById('userNameInput').value.trim();
            userName = nameInput || 'Your';
            darkModeEnabled = document.getElementById('darkModeToggle').checked;
            const wantsPasscode = document.getElementById('passcodeToggle').value === 'on';
            const passcodeInput = document.getElementById('passcodeInput').value.trim();

            if (wantsPasscode) {
                if (!window.crypto || !window.crypto.subtle) {
                    alert('Passcode lock requires Web Crypto support in this browser.');
                    return;
                }
                if (passcodeInput && !isValidPasscode(passcodeInput)) {
                    alert('Passcode must be 4-8 digits.');
                    return;
                }
                if (!passcodeHash && !passcodeInput) {
                    alert('Set a new passcode before turning lock on.');
                    return;
                }
                if (passcodeInput) {
                    await setPasscode(passcodeInput);
                }
            } else {
                clearStoredPasscode();
            }

            passcodeEnabled = wantsPasscode;
            localStorage.setItem('plannerPasscodeEnabled', passcodeEnabled ? 'on' : 'off');
            localStorage.setItem('plannerUserName', userName);
            localStorage.setItem('plannerDarkMode', darkModeEnabled ? 'on' : 'off');
            applyUserSettings();
            closeSettingsModal();
            handleInitialLock();
        }

        // Apply user name to the UI.
        function applyUserSettings() {
            document.getElementById('userNameDisplay').textContent = formatPlannerName(userName);
            document.body.setAttribute('data-mode', darkModeEnabled ? 'dark' : 'light');
        }

        function applyFilterUI() {
            document.querySelectorAll('.chip-button[data-filter]').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.filter === currentFilter);
            });
            const hideBtn = document.getElementById('hideCompletedToggle');
            if (hideBtn) hideBtn.classList.toggle('active', hideCompleted);
            const searchInput = document.getElementById('searchInput');
            if (searchInput && searchQuery) searchInput.value = searchQuery;
        }

        // Format the header name with a possessive.
        function formatPlannerName(name) {
            if (!name || name.toLowerCase() === 'your') return 'Your';
            const trimmed = name.trim();
            if (!trimmed) return 'Your';
            const lastChar = trimmed.charAt(trimmed.length - 1).toLowerCase();
            if (lastChar === 's') return `${trimmed}'`;
            return `${trimmed}'s`;
        }

        // Show or hide passcode setup field when toggled.
        function updatePasscodeVisibility() {
            const enabled = document.getElementById('passcodeToggle').value === 'on';
            document.getElementById('passcodeGroup').style.display = enabled ? 'block' : 'none';
        }

        // Lock the app on load if passcode is enabled.
        function handleInitialLock() {
            if (!passcodeEnabled || !passcodeHash) return;
            openLockModal();
        }

        // Open the lock modal.
        function openLockModal() {
            passcodeEntry = '';
            updatePasscodeDots();
            setModalState('lockModal', true);
        }

        // Close the lock modal.
        function closeLockModal() {
            setModalState('lockModal', false);
        }

        // Unlock the app if the passcode matches.
        async function unlockApp() {
            const isMatch = passcodeEntry ? await verifyPasscode(passcodeEntry) : false;
            if (isMatch) {
                closeLockModal();
            } else {
                alert('Incorrect passcode.');
                passcodeEntry = '';
                updatePasscodeDots();
            }
        }

        // Add a digit to the passcode entry.
        function pressPasscodeKey(digit) {
            const maxLength = Math.max(4, Math.min(passcodeLength || 4, 8));
            if (passcodeEntry.length >= maxLength) return;
            passcodeEntry += digit;
            updatePasscodeDots();
            if (passcodeEntry.length === maxLength) {
                unlockApp();
            }
        }

        // Clear the passcode entry.
        function clearPasscodeEntry() {
            passcodeEntry = '';
            updatePasscodeDots();
        }

        // Remove the last passcode digit.
        function backspacePasscode() {
            passcodeEntry = passcodeEntry.slice(0, -1);
            updatePasscodeDots();
        }

        // Update the visual dot display for passcode entry.
        function updatePasscodeDots() {
            const dots = document.querySelectorAll('#passcodeDots .passcode-dot');
            const activeDots = Math.max(4, Math.min(passcodeLength || 4, 8));
            dots.forEach((dot, index) => {
                dot.style.display = index < activeDots ? 'block' : 'none';
                dot.classList.toggle('filled', index < passcodeEntry.length);
            });
        }
        // Move the current date backward or forward by a number of days.
        function changeDate(days) {
            currentDate.setDate(currentDate.getDate() + days);
            updateCurrentDate();
            renderView();
        }

        // Jump the calendar back to today.
        function goToday() {
            currentDate = new Date();
            updateCurrentDate();
            renderView();
        }

        // Update the header date display.
        function updateCurrentDate() {
            const options = { weekday: 'long', month: 'long', day: 'numeric' };
            document.getElementById('currentDate').textContent = currentDate.toLocaleDateString(userLocale, options);
        }

        // Render the active view.
        function renderView() {
            if (currentView === 'day') {
                renderDailyView();
            } else if (currentView === 'week') {
                renderWeekView();
            } else {
                renderMonthView();
            }
            if (currentView !== 'day' && nowLineTimer) {
                clearInterval(nowLineTimer);
                nowLineTimer = null;
                lastAutoScrollHour = null;
            }
            setupScrollShadows();
            setupDaySwipe();
            setupRangeSwipe();
        }

        function itemMatchesSearch(item) {
            if (!searchQuery) return true;
            const term = searchQuery.trim().toLowerCase();
            if (!term) return true;
            const fields = [item.title, item.type, item.description];
            return fields.some(field => field && field.toLowerCase().includes(term));
        }

        function applyFilters(items, dateStr) {
            return items.filter(item => {
                if (currentFilter !== 'all' && item.category !== currentFilter) return false;
                if (hideCompleted && isCompleted(item, dateStr)) return false;
                if (!itemMatchesSearch(item)) return false;
                return true;
            });
        }

        function minuteToTimelinePx(minute, slotHeight, slotGap) {
            const safeMinute = Math.max(0, Math.min(24 * 60, minute));
            const totalHeight = (24 * slotHeight) + (23 * slotGap);
            if (safeMinute >= 24 * 60) return totalHeight;
            const hour = Math.floor(safeMinute / 60);
            const minutePart = safeMinute % 60;
            return (hour * (slotHeight + slotGap)) + ((minutePart / 60) * slotHeight);
        }

        function getEventSpanDays(item) {
            const start = parseDateOnly(item.startDate || item.date || '');
            const end = parseDateOnly(item.endDate || item.startDate || item.date || '');
            if (!start || !end) return 0;
            return Math.max(0, dateDiffInDays(end, start));
        }

        function addDaysToDateStr(dateStr, days) {
            const date = parseDateOnly(dateStr);
            if (!date) return dateStr;
            date.setDate(date.getDate() + days);
            return formatDate(date);
        }

        function getEventDurationMinutes(item) {
            const start = parseTimeToMinutes(item.time || '');
            const end = parseTimeToMinutes(item.endTime || '');
            if (start === null || end === null) return 60;
            let duration = end - start;
            if (duration <= 0) duration += 24 * 60;
            return duration;
        }

        function getEventRangeForDay(item, dateStr) {
            const startDateStr = item.startDate || item.date || dateStr;
            const endDateStr = item.endDate || startDateStr;
            const startMinutes = parseTimeToMinutes(item.time || '');
            const endMinutes = parseTimeToMinutes(item.endTime || '');

            if (dateStr < startDateStr || dateStr > endDateStr) return null;

            if (startDateStr === endDateStr) {
                if (startMinutes === null && endMinutes === null) return { start: 0, end: 24 * 60, allDay: true };
                if (startMinutes !== null && endMinutes !== null) {
                    const end = Math.max(endMinutes, startMinutes + 15);
                    return { start: startMinutes, end: Math.min(end, 24 * 60), allDay: false };
                }
                if (startMinutes !== null) {
                    return { start: startMinutes, end: Math.min(24 * 60, startMinutes + 60), allDay: false };
                }
                return { start: 0, end: Math.max(15, endMinutes ?? (24 * 60)), allDay: false };
            }

            if (dateStr === startDateStr) {
                return { start: startMinutes ?? 0, end: 24 * 60, allDay: startMinutes === null };
            }
            if (dateStr === endDateStr) {
                return { start: 0, end: Math.max(15, endMinutes ?? (24 * 60)), allDay: endMinutes === null };
            }
            return { start: 0, end: 24 * 60, allDay: true };
        }

        function getTimelineRangeForItem(item, dateStr) {
            if (item.category === 'event') return getEventRangeForDay(item, dateStr);
            if (item.category === 'reminder') {
                const start = parseTimeToMinutes(item.time || '');
                if (start === null) return null;
                return { start, end: Math.min(24 * 60, start + 20), allDay: false };
            }
            return null;
        }

        function assignOverlapLayout(entries) {
            const sorted = [...entries].sort((a, b) => (a.start - b.start) || (a.end - b.end));
            let group = [];
            let groupEnd = -1;
            const applyGroup = () => {
                if (group.length === 0) return;
                const active = [];
                let maxCols = 1;
                group.forEach(entry => {
                    for (let i = active.length - 1; i >= 0; i--) {
                        if (active[i].end <= entry.start) active.splice(i, 1);
                    }
                    const used = new Set(active.map(a => a.col));
                    let col = 0;
                    while (used.has(col)) col += 1;
                    entry.col = col;
                    active.push(entry);
                    maxCols = Math.max(maxCols, col + 1);
                });
                group.forEach(entry => {
                    entry.colCount = maxCols;
                });
                group = [];
                groupEnd = -1;
            };

            sorted.forEach(entry => {
                if (group.length === 0) {
                    group = [entry];
                    groupEnd = entry.end;
                    return;
                }
                if (entry.start < groupEnd) {
                    group.push(entry);
                    groupEnd = Math.max(groupEnd, entry.end);
                    return;
                }
                applyGroup();
                group = [entry];
                groupEnd = entry.end;
            });
            applyGroup();
            return sorted;
        }

        function buildTimelineEntries(items, dateStr, slotHeight, slotGap) {
            const entries = [];
            items.forEach(item => {
                const range = getTimelineRangeForItem(item, dateStr);
                if (!range) return;
                const start = Math.max(0, Math.min(24 * 60, range.start));
                const end = Math.max(start + 15, Math.min(24 * 60, range.end));
                entries.push({ item, start, end });
            });
            assignOverlapLayout(entries);
            entries.forEach(entry => {
                const top = minuteToTimelinePx(entry.start, slotHeight, slotGap);
                const bottom = minuteToTimelinePx(entry.end, slotHeight, slotGap);
                entry.top = top;
                entry.height = Math.max(26, bottom - top);
            });
            return entries;
        }

        function canDragItem(item) {
            const repeatMode = item.repeatCycle || (item.recurringDays && item.recurringDays.length > 0 ? 'weekly' : '');
            return !repeatMode;
        }

        function clearDragOverStates() {
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        }

        function enableDragForItem(element, item, dateStr) {
            if (!canDragItem(item)) return;
            element.setAttribute('draggable', 'true');
            element.addEventListener('dragstart', (event) => {
                dragPayload = { id: item.id, type: item.category, sourceDate: dateStr };
                element.classList.add('dragging');
                if (event.dataTransfer) {
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', `${item.category}:${item.id}`);
                }
            });
            element.addEventListener('dragend', () => {
                element.classList.remove('dragging');
                dragPayload = null;
                clearDragOverStates();
            });
        }

        function moveItemToDate(type, id, targetDate, targetTime) {
            let item = null;
            if (type === 'event') item = events.find(ev => ev.id === id);
            if (type === 'task') item = tasks.find(tsk => tsk.id === id);
            if (type === 'reminder') item = reminders.find(rm => rm.id === id);
            if (!item) return;

            if (type === 'event') {
                const spanDays = getEventSpanDays(item);
                item.date = targetDate;
                item.startDate = targetDate;
                item.endDate = addDaysToDateStr(targetDate, spanDays);
                if (targetTime) {
                    const duration = getEventDurationMinutes(item);
                    item.time = targetTime;
                    if (item.endTime) {
                        item.endTime = shiftTime(targetTime, duration);
                    }
                }
            } else if (type === 'task') {
                item.date = targetDate;
                if (targetTime) item.dueTime = targetTime;
            } else if (type === 'reminder') {
                item.date = targetDate;
                if (targetTime) item.time = targetTime;
            }

            saveData();
            renderView();
            scheduleReminders();
        }

        function attachDropTarget(element, dateStr, resolveTime) {
            element.addEventListener('dragover', (event) => {
                if (!dragPayload) return;
                event.preventDefault();
                element.classList.add('drag-over');
                if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
            });
            element.addEventListener('dragleave', () => {
                element.classList.remove('drag-over');
            });
            element.addEventListener('drop', (event) => {
                if (!dragPayload) return;
                event.preventDefault();
                element.classList.remove('drag-over');
                const time = typeof resolveTime === 'function' ? resolveTime(event) : '';
                moveItemToDate(dragPayload.type, dragPayload.id, dateStr, time);
                dragPayload = null;
                clearDragOverStates();
            });
        }

        // Render the daily view with hourly slots and a tasks panel.
        function renderDailyView() {
            const container = document.getElementById('dailyView');
            container.innerHTML = '';

            const dateStr = formatDate(currentDate);
            const dayEvents = getItemsForDay(events, dateStr, true, true);
            const dayTasks = getItemsForDay(tasks, dateStr, true, true);
            const dayReminders = getItemsForDay(reminders, dateStr, true, true);
            const filteredEvents = applyFilters(dayEvents, dateStr);
            const filteredTasks = applyFilters(dayTasks, dateStr);
            const filteredReminders = applyFilters(dayReminders, dateStr);
            const slotHeight = 56;
            const slotGap = 8;

            const layout = document.createElement('div');
            layout.className = 'day-layout';

            const totalScheduled = dayEvents.length + dayReminders.length;
            const filteredScheduled = filteredEvents.length + filteredReminders.length;
            if (filteredScheduled === 0) {
                const empty = document.createElement('div');
                empty.className = 'day-empty';
                empty.textContent = totalScheduled === 0 ? 'No events or reminders for this day.' : 'No scheduled items match your filters.';
                layout.appendChild(empty);
            }

            const insightRow = document.createElement('div');
            insightRow.className = 'day-insights';

            const nextCard = document.createElement('div');
            nextCard.className = 'insight-card';
            const nextItem = getNextItemForDay([...filteredEvents, ...filteredReminders, ...filteredTasks], dateStr);
            const nextTimeLabel = nextItem ? getItemTimeLabelForDate(nextItem, dateStr) : '';
            const nextLabel = nextItem ? `${nextItem.title}${nextTimeLabel ? ' · ' + nextTimeLabel : ''}` : 'You are clear.';
            const nextTypeLabel = nextItem ? (nextItem.type || nextItem.category) : 'No upcoming items found.';
            nextCard.innerHTML = `
                <div class="insight-label">Next up</div>
                <div class="insight-value">${escapeHtml(nextLabel)}</div>
                <div class="insight-subtle">${escapeHtml(nextTypeLabel)}</div>
            `;
            insightRow.appendChild(nextCard);

            const taskCard = document.createElement('div');
            taskCard.className = 'insight-card';
            const completedTasks = dayTasks.filter(task => isCompleted(task, dateStr)).length;
            taskCard.innerHTML = `
                <div class="insight-label">Task progress</div>
                <div class="insight-value">${completedTasks} of ${dayTasks.length || 0}</div>
                <div class="insight-subtle">${dayTasks.length ? `${dayTasks.length - completedTasks} remaining today` : 'Add a task to get started.'}</div>
            `;
            insightRow.appendChild(taskCard);

            layout.appendChild(insightRow);

            const timeScroll = document.createElement('div');
            timeScroll.className = 'time-scroll';

            const grid = document.createElement('div');
            grid.className = 'time-grid';

            for (let hour = 0; hour < 24; hour++) {
                const slot = document.createElement('div');
                slot.className = 'time-slot';

                const label = document.createElement('div');
                label.className = 'time-label';
                label.textContent = formatHourLabel(hour);

                const slotEvents = document.createElement('div');
                slotEvents.className = 'slot-events slot-interactive';

                slot.appendChild(label);
                slot.appendChild(slotEvents);
                grid.appendChild(slot);

                slotEvents.addEventListener('click', (event) => {
                    if (event.target && event.target.closest('.swipe-card')) return;
                    const rect = slotEvents.getBoundingClientRect();
                    const offset = event.clientY - rect.top;
                    const ratio = Math.min(Math.max(offset / rect.height, 0), 1);
                    const minute = Math.min(55, Math.round((ratio * 60) / 5) * 5);
                    openAddModalWithTime(hour, minute);
                });

                attachDropTarget(slotEvents, dateStr, (event) => {
                    const rect = slotEvents.getBoundingClientRect();
                    const offset = event.clientY - rect.top;
                    const ratio = Math.min(Math.max(offset / rect.height, 0), 1);
                    const minute = Math.min(55, Math.round((ratio * 60) / 5) * 5);
                    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                });
            }

            const overlay = document.createElement('div');
            overlay.className = 'schedule-overlay';
            overlay.style.height = `${minuteToTimelinePx(24 * 60, slotHeight, slotGap)}px`;
            const timelineEntries = buildTimelineEntries([...filteredEvents, ...filteredReminders], dateStr, slotHeight, slotGap);
            timelineEntries.forEach(entry => {
                const card = buildCard(entry.item, 'event-card', dateStr);
                const width = 100 / entry.colCount;
                card.style.top = `${entry.top}px`;
                card.style.height = `${entry.height}px`;
                card.style.left = `calc(${entry.col * width}% + 2px)`;
                card.style.width = `calc(${width}% - 4px)`;
                enableDragForItem(card, entry.item, dateStr);
                overlay.appendChild(card);
            });

            grid.appendChild(overlay);
            timeScroll.appendChild(grid);
            layout.appendChild(timeScroll);

            const tasksPanel = document.createElement('div');
            tasksPanel.className = 'day-tasks-panel';
            const panelDate = currentDate.toLocaleDateString(userLocale, { month: 'short', day: 'numeric' });
            const panelTitle = isToday(currentDate) ? "Today's Tasks" : `Tasks · ${panelDate}`;
            tasksPanel.innerHTML = `<div class="panel-title">${panelTitle}</div>`;

            const taskList = document.createElement('div');
            taskList.className = 'task-list';

            if (filteredTasks.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'helper-text';
                empty.textContent = dayTasks.length === 0 ? 'No tasks for today.' : 'No tasks match your filters.';
                tasksPanel.appendChild(empty);
            } else {
                filteredTasks.forEach(task => {
                    const row = document.createElement('div');
                    const completed = isCompleted(task, dateStr);
                    row.className = `task-row ${completed ? 'completed' : ''}`;
                    row.dataset.type = 'task';
                    row.dataset.id = task.id;
                    row.dataset.date = dateStr;
                    const checkbox = document.createElement('input');
                    checkbox.className = 'task-checkbox';
                    checkbox.type = 'checkbox';
                    checkbox.checked = completed;
                    const taskText = document.createElement('div');
                    taskText.textContent = `${task.title}${task.dueTime ? ' · ' + formatTime(task.dueTime) : ''}`;
                    row.appendChild(checkbox);
                    row.appendChild(taskText);
                    checkbox.addEventListener('change', () => toggleComplete('task', task.id, dateStr, row));
                    row.addEventListener('click', (event) => {
                        if (event.target && event.target.matches('input')) return;
                        toggleComplete('task', task.id, dateStr, row);
                    });
                    taskList.appendChild(row);
                });
                tasksPanel.appendChild(taskList);
            }

            const rowCount = Math.max(filteredTasks.length, 1);
            const baseHeight = 72;
            const rowHeight = 44;
            const desiredHeight = baseHeight + (rowCount * rowHeight);
            const minHeight = 120;
            const maxHeight = Math.round(window.innerHeight * 0.28);
            const finalHeight = Math.min(Math.max(desiredHeight, minHeight), maxHeight);
            tasksPanel.style.maxHeight = `${finalHeight}px`;

            layout.appendChild(tasksPanel);
            container.appendChild(layout);

            startNowLineTimer();
            updateNowLine();
            requestAnimationFrame(() => {
                requestAnimationFrame(() => scrollToCurrentTime(true));
            });
        }

        // Scroll the day view to keep the last two hours visible.
        function scrollToCurrentTime(force) {
            if (!isToday(currentDate)) return;
            const timeScroll = document.querySelector('.time-scroll');
            if (!timeScroll) return;
            const line = document.querySelector('.now-line');
            const now = new Date();
            const hour = now.getHours();
            if (!line) return;
            const lineTop = line.getBoundingClientRect().top + timeScroll.scrollTop - timeScroll.getBoundingClientRect().top;
            const target = Math.max(0, lineTop - (timeScroll.clientHeight * 0.20));
            if (force || hour !== lastAutoScrollHour) {
                timeScroll.scrollTo({ top: target, behavior: 'smooth' });
                lastAutoScrollHour = hour;
            }
        }

        // Start or restart the timer that keeps the now-line up to date.
        function startNowLineTimer() {
            if (nowLineTimer) {
                clearInterval(nowLineTimer);
            }
            nowLineTimer = setInterval(() => {
                updateNowLine();
                autoScrollIfHourChanged();
            }, 60000);
        }

        // Update the position of the current time line in day view.
        function updateNowLine() {
            const grid = document.querySelector('.time-grid');
            if (!grid) return;

            let line = document.querySelector('.now-line');
            if (!isToday(currentDate)) {
                if (line) line.style.display = 'none';
                return;
            }

            if (!line) {
                line = document.createElement('div');
                line.className = 'now-line';
                grid.appendChild(line);
            }

            line.style.display = 'block';

            const now = new Date();
            const hour = now.getHours();
            const minutes = now.getMinutes();
            const slots = grid.querySelectorAll('.time-slot');
            const slot = slots[hour];
            if (!slot) return;

            const nextSlot = slots[hour + 1] || slot;
            const hourHeight = nextSlot.offsetTop - slot.offsetTop || slot.offsetHeight;
            const top = slot.offsetTop + (minutes / 60) * hourHeight;
            line.style.top = `${top}px`;
        }

        // Auto-scroll when the hour changes while on today's view.
        function autoScrollIfHourChanged() {
            if (!isToday(currentDate)) return;
            const now = new Date();
            const hour = now.getHours();
            if (lastAutoScrollHour === null) {
                lastAutoScrollHour = hour;
                return;
            }
            if (hour !== lastAutoScrollHour) {
                scrollToCurrentTime(true);
            }
        }

        // Check if a date is today.
        function isToday(date) {
            const now = new Date();
            return date.getFullYear() === now.getFullYear() &&
                date.getMonth() === now.getMonth() &&
                date.getDate() === now.getDate();
        }

        // Render the week view.
        function renderWeekView() {
            const container = document.getElementById('weekView');
            container.innerHTML = '<div class="week-grid"></div>';
            const grid = container.querySelector('.week-grid');

            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

            for (let i = 0; i < 7; i++) {
                const date = new Date(startOfWeek);
                date.setDate(startOfWeek.getDate() + i);
                const dateStr = formatDate(date);

                const dayEvents = applyFilters(getItemsForDay(events, dateStr, true, true), dateStr);
                const dayTasks = applyFilters(getItemsForDay(tasks, dateStr, true, true), dateStr);
                const dayReminders = applyFilters(getItemsForDay(reminders, dateStr, true, true), dateStr);

                const dayCol = document.createElement('div');
                dayCol.className = `day-column ${isToday(date) ? 'today' : ''}`;

                const dayName = date.toLocaleDateString(userLocale, { weekday: 'short' });
                const dayDate = date.toLocaleDateString(userLocale, { month: 'short', day: 'numeric' });

                dayCol.innerHTML = `
                    <div class="day-header">
                        <div class="day-name">${dayName}</div>
                        <div class="day-date">${dayDate}</div>
                    </div>
                    <div class="day-items"></div>
                `;

                const itemsContainer = dayCol.querySelector('.day-items');
                attachDropTarget(dayCol, dateStr, () => '');

                const dayItems = [...dayEvents, ...dayReminders, ...dayTasks]
                    .sort((a, b) => getItemSortValue(a, dateStr) - getItemSortValue(b, dateStr));

                dayItems.forEach(item => {
                    const pill = document.createElement('div');
                    const completed = isCompleted(item, dateStr);
                    pill.className = `homework-item swipe-card ${completed ? 'completed' : ''}`;
                    pill.style.borderLeftColor = item.color || colors[11];
                    pill.dataset.type = item.category;
                    pill.dataset.id = item.id;
                    pill.dataset.date = dateStr;
                    const timeLabel = getItemTimeLabelForDate(item, dateStr);
                    const typeLine = document.createElement('div');
                    typeLine.className = 'homework-class';
                    typeLine.textContent = item.type || item.category;
                    const titleLine = document.createElement('div');
                    titleLine.textContent = `${item.title}${timeLabel ? ' · ' + timeLabel : ''}`;
                    pill.appendChild(typeLine);
                    pill.appendChild(titleLine);
                    attachSwipeAndTap(pill);
                    enableDragForItem(pill, item, dateStr);
                    itemsContainer.appendChild(pill);
                });

                if (itemsContainer.children.length === 0) {
                    itemsContainer.innerHTML = '<div style="color: var(--text-secondary); font-size: 13px; padding: 8px 0;">No items</div>';
                }

                grid.appendChild(dayCol);
            }
        }

        // Render the all view as a week calendar grid with everything included.
        function renderMonthView() {
            const container = document.getElementById('monthView');
            container.innerHTML = '';

            const header = document.createElement('div');
            header.className = 'month-header';
            const monthLabel = currentDate.toLocaleDateString(userLocale, { month: 'long' });
            const yearLabel = currentDate.getFullYear();
            header.innerHTML = `
                <div class="month-title">${monthLabel}</div>
                <div class="month-subtitle">${yearLabel}</div>
            `;

            const grid = document.createElement('div');
            grid.className = 'month-grid';

            const firstOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const lastOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            const startWeekday = firstOfMonth.getDay();
            const totalDays = lastOfMonth.getDate();

            for (let i = 0; i < startWeekday; i++) {
                const spacer = document.createElement('div');
                spacer.className = 'month-cell';
                spacer.style.opacity = '0.4';
                spacer.innerHTML = '<div class="month-day">&nbsp;</div>';
                grid.appendChild(spacer);
            }

            for (let day = 1; day <= totalDays; day++) {
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                const dateStr = formatDate(date);
                const rawItems = [
                    ...getItemsForDay(events, dateStr, true, true),
                    ...getItemsForDay(tasks, dateStr, true, true),
                    ...getItemsForDay(reminders, dateStr, true, true)
                ];
                const items = applyFilters(rawItems, dateStr);

                const cell = document.createElement('div');
                const isSelected = dateStr === formatDate(currentDate);
                cell.className = `month-cell ${isToday(date) ? 'today' : ''} ${isSelected ? 'selected' : ''}`.trim();

                const dayLabel = document.createElement('div');
                dayLabel.className = 'month-day';
                dayLabel.textContent = date.toLocaleDateString(userLocale, { weekday: 'short' }) + ` ${day}`;
                cell.appendChild(dayLabel);

                const itemList = document.createElement('div');
                itemList.className = 'month-items';
                attachDropTarget(cell, dateStr, () => '');

                const sortedItems = [...items].sort((a, b) => getItemSortValue(a, dateStr) - getItemSortValue(b, dateStr));

                sortedItems.slice(0, 3).forEach(item => {
                    const pill = document.createElement('div');
                    const timeLabel = getItemTimeLabelForDate(item, dateStr);
                    pill.className = 'month-pill';
                    pill.style.borderLeftColor = item.color || colors[11];
                    pill.dataset.type = item.category;
                    pill.dataset.id = item.id;
                    pill.dataset.date = dateStr;
                    pill.textContent = `${item.title}${timeLabel ? ' · ' + timeLabel : ''}`;
                    attachSwipeAndTap(pill);
                    enableDragForItem(pill, item, dateStr);
                    itemList.appendChild(pill);
                });

                if (sortedItems.length > 3) {
                    const more = document.createElement('div');
                    more.className = 'month-empty';
                    more.textContent = `+${sortedItems.length - 3} more`;
                    itemList.appendChild(more);
                }

                if (items.length === 0) {
                    const empty = document.createElement('div');
                    empty.className = 'month-empty';
                    empty.textContent = rawItems.length === 0 ? 'No items' : 'Filtered out';
                    itemList.appendChild(empty);
                }

                cell.appendChild(itemList);
                grid.appendChild(cell);
            }

            container.appendChild(header);
            container.appendChild(grid);
        }

        // Build a swipeable card element for events/reminders.
        function buildCard(item, className, dateStr) {
            const card = document.createElement('div');
            const completed = isCompleted(item, dateStr);
            card.className = `${className} swipe-card ${completed ? 'completed' : ''}`;
            card.style.borderLeftColor = item.color || colors[11];
            card.dataset.type = item.category || 'event';
            card.dataset.id = item.id;
            card.dataset.date = dateStr;
            const title = document.createElement('div');
            title.className = 'event-title';
            title.textContent = item.title;
            card.appendChild(title);
            const details = [];
            const timeLabel = getItemTimeLabelForDate(item, dateStr);
            if (timeLabel) details.push(timeLabel);
            if (item.type) details.push(item.type);
            if (item.description) details.push(item.description);
            if (details.length) {
                const meta = document.createElement('div');
                meta.className = 'event-meta';
                meta.textContent = details.join(' · ');
                card.appendChild(meta);
            }
            const check = document.createElement('div');
            check.className = 'card-check';
            check.textContent = '✓';
            card.appendChild(check);
            attachSwipeAndTap(card);
            return card;
        }

        // Add swipe-to-complete/delete and tap-to-edit behavior.
        function attachSwipeAndTap(element) {
            let startX = 0;
            let startY = 0;
            let moved = false;

            element.addEventListener('pointerdown', (e) => {
                startX = e.clientX;
                startY = e.clientY;
                moved = false;
                element.setPointerCapture(e.pointerId);
            });

            element.addEventListener('pointermove', (e) => {
                if (!startX && !startY) return;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) {
                    moved = true;
                    return;
                }
                if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) {
                    moved = true;
                    element.style.transform = `translateX(${dx}px)`;
                    element.style.opacity = `${1 - Math.min(Math.abs(dx) / 160, 0.6)}`;
                }
            });

            element.addEventListener('pointerup', (e) => {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                element.releasePointerCapture(e.pointerId);
                element.style.transform = '';
                element.style.opacity = '';

                if (moved && Math.abs(dy) > Math.abs(dx)) {
                    startX = 0;
                    startY = 0;
                    return;
                }
                if (!moved || Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy)) {
                    openEditFromElement(element);
                } else if (dx > 60) {
                    completeFromElement(element);
                } else if (dx < -60) {
                    deleteFromElement(element);
                }

                startX = 0;
                startY = 0;
            });

            element.addEventListener('pointercancel', () => {
                element.style.transform = '';
                element.style.opacity = '';
                startX = 0;
                startY = 0;
            });
        }

        // Open the edit modal from a rendered element.
        function openEditFromElement(element) {
            const type = element.dataset.type;
            const id = element.dataset.id;
            const dateStr = element.dataset.date;
            openEditModal(type, id, dateStr);
        }

        // Complete an item from its element.
        function completeFromElement(element) {
            const type = element.dataset.type;
            const id = element.dataset.id;
            const dateStr = element.dataset.date;
            toggleComplete(type, id, dateStr, element);
        }

        // Delete an item from its element.
        function deleteFromElement(element) {
            const type = element.dataset.type;
            const id = element.dataset.id;
            deleteItem(type, id);
        }

        function parseDateOnly(dateStr) {
            if (!dateStr) return null;
            const date = new Date(`${dateStr}T00:00:00`);
            if (Number.isNaN(date.getTime())) return null;
            return date;
        }

        function dateDiffInDays(laterDate, earlierDate) {
            const dayMs = 24 * 60 * 60 * 1000;
            return Math.floor((laterDate - earlierDate) / dayMs);
        }

        function isLastWeekdayOfMonth(date) {
            const nextWeek = new Date(date);
            nextWeek.setDate(date.getDate() + 7);
            return nextWeek.getMonth() !== date.getMonth();
        }

        function matchesMonthlyWeekdayRule(date, weekday, ordinal) {
            if (date.getDay() !== weekday) return false;
            if (ordinal === 'last') return isLastWeekdayOfMonth(date);
            const ordinalNum = parseInt(ordinal, 10);
            if (!Number.isInteger(ordinalNum) || ordinalNum < 1 || ordinalNum > 4) return false;
            const weekNumber = Math.floor((date.getDate() - 1) / 7) + 1;
            return weekNumber === ordinalNum;
        }

        // Get items for a day with control over recurrence and weekly view rules.
        function getItemsForDay(list, dateStr, includeRecurring, includeTasksForDay) {
            const date = parseDateOnly(dateStr);
            if (!date) return [];
            const day = date.getDay();

            return list.filter(item => {
                const repeatMode = item.repeatCycle || (item.recurringDays && item.recurringDays.length > 0 ? 'weekly' : '');
                const isRecurring = !!repeatMode;
                if (isRecurring) {
                    if (!includeRecurring) return false;
                    const cycleStart = item.startDate || item.date || '';
                    const startDate = parseDateOnly(cycleStart);
                    if (startDate && date < startDate) return false;

                    if (repeatMode === 'weekly' || repeatMode === 'biweekly') {
                        const recurringDays = item.recurringDays && item.recurringDays.length > 0
                            ? item.recurringDays
                            : (startDate ? [startDate.getDay()] : []);
                        if (!recurringDays.includes(day)) return false;
                        if (repeatMode === 'biweekly' && startDate) {
                            const diffWeeks = Math.floor(dateDiffInDays(date, startDate) / 7);
                            if (diffWeeks < 0 || diffWeeks % 2 !== 0) return false;
                        }
                        return true;
                    }

                    if (repeatMode === 'everyNDays') {
                        if (!startDate) return false;
                        const interval = Number.isInteger(item.repeatInterval) && item.repeatInterval > 0 ? item.repeatInterval : 1;
                        const diffDays = dateDiffInDays(date, startDate);
                        return diffDays >= 0 && diffDays % interval === 0;
                    }

                    if (repeatMode === 'monthlyDate') {
                        if (!startDate) return false;
                        return date.getDate() === startDate.getDate();
                    }

                    if (repeatMode === 'monthlyWeekday') {
                        if (!startDate) return false;
                        const ordinal = item.monthlyOrdinal || getMonthlyOrdinal(startDate);
                        const weekday = Number.isInteger(item.monthlyWeekday) ? item.monthlyWeekday : startDate.getDay();
                        return matchesMonthlyWeekdayRule(date, weekday, ordinal);
                    }

                    return false;
                }

                if (item.category === 'event') {
                    const start = item.date || item.startDate || '';
                    if (!start) return false;
                    const end = item.endDate || start;
                    return dateStr >= start && dateStr <= end;
                }

                if (!item.date) return false;
                return item.date === dateStr;
            });
        }

        // Determine if an item is completed (with recurring support).
        function isCompleted(item, dateStr) {
            const repeatMode = item.repeatCycle || (item.recurringDays && item.recurringDays.length > 0 ? 'weekly' : '');
            if (repeatMode) {
                return item.completedDates && item.completedDates.includes(dateStr);
            }
            return item.completed || false;
        }

        // Toggle completion for events, tasks, and reminders.
        function toggleComplete(type, id, dateStr, element) {
            let item;
            if (type === 'event') item = events.find(ev => ev.id === id);
            if (type === 'task') item = tasks.find(tsk => tsk.id === id);
            if (type === 'reminder') item = reminders.find(rm => rm.id === id);
            if (!item) return;

            const repeatMode = item.repeatCycle || (item.recurringDays && item.recurringDays.length > 0 ? 'weekly' : '');
            if (repeatMode) {
                item.completedDates = item.completedDates || [];
                if (item.completedDates.includes(dateStr)) {
                    item.completedDates = item.completedDates.filter(d => d !== dateStr);
                } else {
                    item.completedDates.push(dateStr);
                }
            } else {
                item.completed = !item.completed;
            }

            saveData();
            if (element) {
                element.classList.add('just-completed');
                if (navigator.vibrate) navigator.vibrate(20);
                setTimeout(() => element.classList.remove('just-completed'), 350);
                setTimeout(() => renderView(), 220);
                return;
            }
            renderView();
        }

        // Open the add modal with defaults.
        function openAddModal() {
            editingItem = null;
            document.getElementById('modalTitle').textContent = 'Add Item';
            document.getElementById('saveButton').textContent = 'Add';
            document.getElementById('deleteButton').style.display = 'none';
            setModalState('addModal', true);
            const today = formatDate(currentDate);
            document.getElementById('itemDate').value = today;
            document.getElementById('itemEndDate').value = today;
            document.getElementById('itemCategory').value = 'event';
            document.getElementById('itemKind').value = '';
            document.getElementById('itemRepeats').value = 'no';
            document.getElementById('itemRepeatInterval').value = '3';
            document.getElementById('itemMonthlyOrdinal').value = '1';
            document.getElementById('itemMonthlyWeekday').value = String(currentDate.getDay());
            clearTimePicker('itemTime');
            clearTimePicker('itemEndTime');
            clearTimePicker('itemDueTime');
            clearTimePicker('itemReminderTime');
            setReminderPreset('');
            selectColor(0);
            updateFormFields();
            setTimeout(() => document.getElementById('itemTitle').focus(), 0);
        }

        // Open add modal pre-filled with a time from the timeline.
        function openAddModalWithTime(hour, minute) {
            openAddModal();
            const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            setTimePickerValue('itemTime', time);
            updateReminderPresetPreview();
        }

        // Open the edit modal and load item data.
        function openEditModal(type, id, dateStr) {
            let item = null;
            if (type === 'event') item = events.find(ev => ev.id === id);
            if (type === 'task') item = tasks.find(tsk => tsk.id === id);
            if (type === 'reminder') item = reminders.find(rm => rm.id === id);
            if (!item) return;

            editingItem = { type, id, dateStr };
            document.getElementById('modalTitle').textContent = 'Edit Item';
            document.getElementById('saveButton').textContent = 'Save';
            document.getElementById('deleteButton').style.display = 'inline-block';

            document.getElementById('itemCategory').value = type;
            document.getElementById('itemKind').value = item.type || '';
            document.getElementById('itemTitle').value = item.title || '';
            const startDateValue = item.date || item.startDate || dateStr || formatDate(currentDate);
            document.getElementById('itemDate').value = startDateValue;
            document.getElementById('itemEndDate').value = item.endDate || startDateValue;
            document.getElementById('itemDescription').value = item.description || '';
            setTimePickerValue('itemTime', item.time || '');
            setTimePickerValue('itemEndTime', item.endTime || '');
            setTimePickerValue('itemDueTime', item.dueTime || '');
            setReminderPreset(item.reminderPreset || '');
            setTimePickerValue('itemReminderTime', getReminderTimeForItem(item));

            const repeats = item.repeatCycle || (item.recurringDays && item.recurringDays.length > 0 ? 'weekly' : 'no');
            document.getElementById('itemRepeats').value = repeats;
            document.getElementById('itemRepeatInterval').value = String(item.repeatInterval || 3);
            document.getElementById('itemMonthlyOrdinal').value = item.monthlyOrdinal || String(getMonthlyOrdinal(new Date(startDateValue + 'T00:00:00')));
            const monthWeekday = Number.isInteger(item.monthlyWeekday) ? item.monthlyWeekday : new Date(startDateValue + 'T00:00:00').getDay();
            document.getElementById('itemMonthlyWeekday').value = String(monthWeekday);

            document.querySelectorAll('.day-checkbox').forEach(cb => cb.checked = false);
            if (item.recurringDays) {
                document.querySelectorAll('.day-checkbox').forEach(cb => {
                    cb.checked = item.recurringDays.includes(parseInt(cb.value, 10));
                });
            }

            document.querySelectorAll('.color-option').forEach((opt, index) => {
                opt.classList.toggle('selected', item.color === colors[index]);
            });

            updateFormFields();
            setModalState('addModal', true);
            setTimeout(() => document.getElementById('itemTitle').focus(), 0);
        }

        // Close the add/edit modal and reset fields.
        function closeAddModal() {
            setModalState('addModal', false);
            resetForm();
        }

        function getMonthlyOrdinal(date) {
            const weekNumber = Math.floor((date.getDate() - 1) / 7) + 1;
            const nextWeek = new Date(date);
            nextWeek.setDate(date.getDate() + 7);
            if (nextWeek.getMonth() !== date.getMonth()) return 'last';
            return String(Math.min(weekNumber, 4));
        }

        // Toggle repeat options based on repeat choice.
        function updateRepeatVisibility() {
            const category = document.getElementById('itemCategory').value;
            const canRepeat = category === 'event';
            if (!canRepeat) {
                document.getElementById('itemRepeats').value = 'no';
            }
            const repeatMode = document.getElementById('itemRepeats').value;
            const repeats = canRepeat && repeatMode !== 'no';
            const weeklyMode = repeatMode === 'weekly' || repeatMode === 'biweekly';
            document.getElementById('recurringGroup').style.display = (repeats && weeklyMode) ? 'block' : 'none';
            document.getElementById('repeatIntervalGroup').style.display = (repeats && repeatMode === 'everyNDays') ? 'block' : 'none';
            document.getElementById('monthlyWeekdayGroup').style.display = (repeats && repeatMode === 'monthlyWeekday') ? 'block' : 'none';
            document.getElementById('dateGroup').style.display = 'block';
            document.getElementById('dateLabel').textContent = repeats ? 'Start date' : 'Date';
        }

        // Update form field visibility based on category.
        function updateFormFields() {
            const category = document.getElementById('itemCategory').value;
            document.getElementById('itemKind').setAttribute('list', category === 'event' ? 'eventTypes' : category === 'task' ? 'taskTypes' : 'reminderTypes');

            document.getElementById('timeGroup').style.display = (category === 'event' || category === 'reminder') ? 'block' : 'none';
            document.getElementById('endTimeGroup').style.display = category === 'event' ? 'block' : 'none';
            document.getElementById('dueTimeGroup').style.display = category === 'task' ? 'block' : 'none';
            document.getElementById('repeatToggleGroup').style.display = category === 'event' ? 'block' : 'none';
            document.getElementById('endDateGroup').style.display = category === 'event' ? 'block' : 'none';
            document.getElementById('recurringGroup').style.display = 'none';
            document.getElementById('dateGroup').style.display = 'block';

            updateRepeatVisibility();
            updateReminderPresetPreview();
        }

        // Populate the color picker UI.
        function initializeColorPicker() {
            const picker = document.getElementById('colorPicker');
            picker.innerHTML = '';
            colors.forEach((color, index) => {
                const option = document.createElement('button');
                option.type = 'button';
                option.className = 'color-option';
                option.setAttribute('aria-label', `Select color ${index + 1}`);
                option.style.backgroundColor = color;
                option.onclick = () => selectColor(index);
                picker.appendChild(option);
            });
        }

        // Select a color for the current item.
        function selectColor(index) {
            document.querySelectorAll('.color-option').forEach((opt, i) => {
                opt.classList.toggle('selected', i === index);
            });
        }

        function initializeModalAccessibility() {
            modalIds.forEach(id => {
                const modal = document.getElementById(id);
                if (!modal) return;
                modal.setAttribute('role', 'dialog');
                modal.setAttribute('aria-modal', 'true');
                modal.setAttribute('aria-hidden', modal.classList.contains('active') ? 'false' : 'true');
            });
        }

        function getModalFocusableElements(modal) {
            if (!modal) return [];
            const selector = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
            return Array.from(modal.querySelectorAll(selector)).filter(el => el.offsetParent !== null);
        }

        // Keep modal state and body scroll in sync.
        function setModalState(modalId, isOpen) {
            const modal = document.getElementById(modalId);
            if (!modal) return;
            modal.classList.toggle('active', isOpen);
            modal.setAttribute('aria-hidden', isOpen ? 'false' : 'true');

            if (isOpen) {
                if (document.activeElement instanceof HTMLElement) {
                    lastFocusedElement = document.activeElement;
                }
                activeModalId = modalId;
                const focusables = getModalFocusableElements(modal);
                if (focusables.length > 0) {
                    focusables[0].focus();
                }
            } else if (activeModalId === modalId) {
                activeModalId = null;
            }

            const anyOpen = modalIds.some(id => {
                const el = document.getElementById(id);
                return el && el.classList.contains('active');
            });
            document.body.classList.toggle('modal-open', anyOpen);
            if (!anyOpen && lastFocusedElement) {
                lastFocusedElement.focus();
                lastFocusedElement = null;
            }
        }

        // Close modals when clicking the backdrop.
        function setupModalDismissal() {
            const addModal = document.getElementById('addModal');
            const settingsModal = document.getElementById('settingsModal');
            if (addModal) {
                addModal.addEventListener('click', (event) => {
                    if (event.target === addModal) closeAddModal();
                });
            }
            if (settingsModal) {
                settingsModal.addEventListener('click', (event) => {
                    if (event.target === settingsModal) closeSettingsModal();
                });
            }
        }

        // Keyboard shortcuts for closing modals.
        function setupGlobalShortcuts() {
            document.addEventListener('keydown', (event) => {
                if (event.key !== 'Escape') return;
                const addModal = document.getElementById('addModal');
                const settingsModal = document.getElementById('settingsModal');
                if (addModal && addModal.classList.contains('active')) {
                    closeAddModal();
                } else if (settingsModal && settingsModal.classList.contains('active')) {
                    closeSettingsModal();
                }
            });
            document.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter') return;
                const lockModal = document.getElementById('lockModal');
                if (lockModal && lockModal.classList.contains('active')) return;
                const addModal = document.getElementById('addModal');
                if (!addModal || !addModal.classList.contains('active')) return;
                if (event.shiftKey) return;
                const target = event.target instanceof HTMLElement ? event.target : null;
                if (!target) return;
                const tag = target.tagName;
                if (tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return;
                if (tag !== 'INPUT') return;
                const inputType = (target.getAttribute('type') || '').toLowerCase();
                if (inputType === 'checkbox' || inputType === 'radio' || inputType === 'button' || inputType === 'submit') return;
                event.preventDefault();
                addOrUpdateItem();
            });
            document.addEventListener('keydown', (event) => {
                if (event.key !== '/') return;
                const tag = event.target ? event.target.tagName : '';
                if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
                const searchInput = document.getElementById('searchInput');
                if (!searchInput) return;
                event.preventDefault();
                searchInput.focus();
            });
            document.addEventListener('keydown', (event) => {
                if (event.key !== 'Tab' || !activeModalId) return;
                const modal = document.getElementById(activeModalId);
                if (!modal || !modal.classList.contains('active')) return;
                const focusables = getModalFocusableElements(modal);
                if (focusables.length === 0) return;
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                const active = document.activeElement;
                if (event.shiftKey && active === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && active === last) {
                    event.preventDefault();
                    first.focus();
                }
            });
        }

        function registerServiceWorker() {
            if (!('serviceWorker' in navigator)) return;
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js').catch(() => {
                    // Non-fatal in unsupported/private contexts.
                });
            });
        }

        // Add/remove header shadow based on scroll position.
        function setupScrollShadows() {
            const header = document.querySelector('.header');
            const dateNav = document.querySelector('.date-nav');
            if (scrollShadowTarget && scrollShadowHandler) {
                scrollShadowTarget.removeEventListener('scroll', scrollShadowHandler);
            }
            scrollShadowTarget = document.querySelector('.time-scroll');
            if (!scrollShadowTarget || !header || !dateNav) {
                if (header) header.classList.remove('scrolled');
                if (dateNav) dateNav.classList.remove('scrolled');
                return;
            }
            scrollShadowHandler = () => {
                const isScrolled = scrollShadowTarget.scrollTop > 4;
                header.classList.toggle('scrolled', isScrolled);
                dateNav.classList.toggle('scrolled', isScrolled);
            };
            scrollShadowHandler();
            scrollShadowTarget.addEventListener('scroll', scrollShadowHandler, { passive: true });
        }

        // Swipe left/right on the day view to change dates.
        function setupDaySwipe() {
            if (daySwipeTarget && daySwipeHandlers) {
                daySwipeTarget.removeEventListener('pointerdown', daySwipeHandlers.onDown);
                daySwipeTarget.removeEventListener('pointermove', daySwipeHandlers.onMove);
                daySwipeTarget.removeEventListener('pointerup', daySwipeHandlers.onUp);
                daySwipeTarget.removeEventListener('pointercancel', daySwipeHandlers.onCancel);
            }
            daySwipeTarget = null;
            daySwipeHandlers = null;

            if (currentView !== 'day') return;
            const target = document.querySelector('.daily-view');
            if (!target) return;

            const state = { active: false, startX: 0, startY: 0 };
            const swipeThreshold = 36;
            const angleBias = 1.15;
            const ignoreSelector = 'input, select, textarea, button, .swipe-card, .day-tasks-panel';

            const onDown = (event) => {
                if (event.pointerType === 'mouse' && event.button !== 0) return;
                if (event.target && event.target.closest(ignoreSelector)) return;
                state.active = true;
                state.startX = event.clientX;
                state.startY = event.clientY;
            };

            const onMove = (event) => {
                if (!state.active) return;
                const dx = event.clientX - state.startX;
                const dy = event.clientY - state.startY;
                if (Math.abs(dy) > Math.abs(dx) * angleBias) {
                    state.active = false;
                }
            };

            const onUp = (event) => {
                if (!state.active) return;
                const dx = event.clientX - state.startX;
                const dy = event.clientY - state.startY;
                state.active = false;
                if (Math.abs(dx) > swipeThreshold && Math.abs(dx) > Math.abs(dy) * angleBias) {
                    changeDate(dx < 0 ? 1 : -1);
                }
            };

            const onCancel = () => {
                state.active = false;
            };

            target.addEventListener('pointerdown', onDown);
            target.addEventListener('pointermove', onMove);
            target.addEventListener('pointerup', onUp);
            target.addEventListener('pointercancel', onCancel);

            daySwipeTarget = target;
            daySwipeHandlers = { onDown, onMove, onUp, onCancel };
        }

        // Swipe left/right on week/month views to change date range.
        function setupRangeSwipe() {
            rangeSwipeBindings.forEach(binding => {
                binding.target.removeEventListener('pointerdown', binding.onDown);
                binding.target.removeEventListener('pointerup', binding.onUp);
                binding.target.removeEventListener('pointercancel', binding.onCancel);
            });
            rangeSwipeBindings = [];

            const targets = [document.querySelector('.week-view'), document.querySelector('.month-view')];
            targets.forEach(target => {
                if (!target) return;
                let startX = 0;
                let startY = 0;
                let active = false;
                const threshold = 42;
                const angleBias = 1.15;

                const onDown = (event) => {
                    if (event.pointerType === 'mouse' && event.button !== 0) return;
                    if (event.target && event.target.closest('input, select, textarea, button, .swipe-card')) return;
                    active = true;
                    startX = event.clientX;
                    startY = event.clientY;
                };

                const onUp = (event) => {
                    if (!active) return;
                    const dx = event.clientX - startX;
                    const dy = event.clientY - startY;
                    active = false;
                    if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * angleBias) {
                        const delta = dx < 0 ? 1 : -1;
                        if (target.classList.contains('week-view')) {
                            changeDate(delta * 7);
                        } else {
                            const next = new Date(currentDate);
                            next.setMonth(currentDate.getMonth() + delta);
                            currentDate = next;
                            updateCurrentDate();
                            renderView();
                        }
                    }
                };

                const onCancel = () => {
                    active = false;
                };

                target.addEventListener('pointerdown', onDown);
                target.addEventListener('pointerup', onUp);
                target.addEventListener('pointercancel', onCancel);
                rangeSwipeBindings.push({ target, onDown, onUp, onCancel });
            });
        }

        // Refresh suggestion lists for item types.
        function refreshTypeSuggestions() {
            const eventSet = new Set(defaultEventTypes);
            const taskSet = new Set(defaultTaskTypes);
            const reminderSet = new Set(defaultReminderTypes);

            events.forEach(ev => { if (ev.type) eventSet.add(ev.type); });
            tasks.forEach(tsk => { if (tsk.type) taskSet.add(tsk.type); });
            reminders.forEach(rm => { if (rm.type) reminderSet.add(rm.type); });

            const eventList = document.getElementById('eventTypes');
            const taskList = document.getElementById('taskTypes');
            const reminderList = document.getElementById('reminderTypes');
            eventList.innerHTML = '';
            taskList.innerHTML = '';
            reminderList.innerHTML = '';

            Array.from(eventSet).sort().forEach(type => {
                const opt = document.createElement('option');
                opt.value = type;
                eventList.appendChild(opt);
            });

            Array.from(taskSet).sort().forEach(type => {
                const opt = document.createElement('option');
                opt.value = type;
                taskList.appendChild(opt);
            });

            Array.from(reminderSet).sort().forEach(type => {
                const opt = document.createElement('option');
                opt.value = type;
                reminderList.appendChild(opt);
            });
        }

        // Initialize all time picker dropdowns.
        function initializeTimePickers() {
            document.querySelectorAll('.time-picker').forEach(picker => {
                const hour = picker.querySelector('.time-hour');
                const minute = picker.querySelector('.time-minute');
                const ampm = picker.querySelector('.time-ampm');
                hour.innerHTML = '<option value=""></option>';
                minute.innerHTML = '<option value=""></option>';
                ampm.innerHTML = '<option value=""></option>';

                for (let h = 1; h <= 12; h++) {
                    const opt = document.createElement('option');
                    opt.value = String(h);
                    opt.textContent = String(h);
                    hour.appendChild(opt);
                }

                for (let m = 0; m < 60; m++) {
                    const opt = document.createElement('option');
                    opt.value = String(m).padStart(2, '0');
                    opt.textContent = String(m).padStart(2, '0');
                    minute.appendChild(opt);
                }

                ['AM', 'PM'].forEach(period => {
                    const opt = document.createElement('option');
                    opt.value = period;
                    opt.textContent = period;
                    ampm.appendChild(opt);
                });

                [hour, minute, ampm].forEach(select => {
                    select.addEventListener('change', () => {
                        if (getSelectedReminderPreset()) updateReminderPresetPreview();
                    });
                });
            });
        }

        // Clear a time picker selection.
        function clearTimePicker(fieldId) {
            const picker = document.querySelector(`[data-field="${fieldId}"]`);
            if (!picker) return;
            picker.querySelector('.time-hour').value = '';
            picker.querySelector('.time-minute').value = '';
            picker.querySelector('.time-ampm').value = '';
        }

        // Apply quick recurring presets.
        function applyRecurringPreset(preset) {
            const map = {
                weekdays: [1, 2, 3, 4, 5],
                weekends: [0, 6],
                daily: [0, 1, 2, 3, 4, 5, 6]
            };
            const values = map[preset] || [];
            document.querySelectorAll('.day-checkbox').forEach(cb => {
                cb.checked = values.includes(parseInt(cb.value, 10));
            });
        }

        function clearRecurringPreset() {
            document.querySelectorAll('.day-checkbox').forEach(cb => cb.checked = false);
        }

        // Smart reminder presets.
        function setReminderPreset(preset) {
            document.querySelectorAll('.reminder-preset').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.preset === preset);
            });
            updateReminderPresetPreview();
        }

        function getSelectedReminderPreset() {
            const active = document.querySelector('.reminder-preset.active');
            return active ? active.dataset.preset : '';
        }

        function getBaseTimeFromForm(category) {
            if (category === 'task') return getTimePickerValue('itemDueTime');
            return getTimePickerValue('itemTime');
        }

        function getBaseTimeFromItem(item) {
            if (item.category === 'task') return item.dueTime || '';
            return item.time || '';
        }

        function shiftTime(time, minutesDelta) {
            if (window.PlannerCore && typeof window.PlannerCore.shiftTime === 'function') {
                return window.PlannerCore.shiftTime(time, minutesDelta);
            }
            if (!time) return '';
            const [hours, minutes] = time.split(':').map(Number);
            if (Number.isNaN(hours) || Number.isNaN(minutes)) return '';
            const dayMinutes = 24 * 60;
            const total = hours * 60 + minutes + minutesDelta;
            const wrapped = ((total % dayMinutes) + dayMinutes) % dayMinutes;
            const h = Math.floor(wrapped / 60);
            const m = wrapped % 60;
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        }

        function computeReminderTime(baseTime, preset, fallbackTime) {
            if (window.PlannerCore && typeof window.PlannerCore.computeReminderTime === 'function') {
                return window.PlannerCore.computeReminderTime(baseTime, preset, fallbackTime);
            }
            if (!preset) return fallbackTime;
            if (preset === 'morning') return '08:00';
            if (!baseTime) return '08:00';
            if (preset === 'at') return baseTime;
            if (preset === '10') return shiftTime(baseTime, -10);
            if (preset === '60') return shiftTime(baseTime, -60);
            return fallbackTime;
        }

        function updateReminderPresetPreview() {
            const preset = getSelectedReminderPreset();
            const category = document.getElementById('itemCategory').value;
            const baseTime = getBaseTimeFromForm(category);
            const current = getTimePickerValue('itemReminderTime');
            const nextTime = computeReminderTime(baseTime, preset, current);
            if (nextTime) setTimePickerValue('itemReminderTime', nextTime);
        }

        function getReminderTimeForItem(item) {
            const preset = item.reminderPreset || '';
            const baseTime = getBaseTimeFromItem(item);
            const stored = item.reminderTime || '';
            if (!preset) return stored || '';
            return computeReminderTime(baseTime, preset, stored);
        }

        function parseTimeToMinutes(time) {
            if (!time || typeof time !== 'string') return null;
            const parts = time.split(':');
            if (parts.length !== 2) return null;
            const hours = Number(parts[0]);
            const minutes = Number(parts[1]);
            if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
            if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
            return (hours * 60) + minutes;
        }

        function getReminderDateTimeForItem(item, dateStr) {
            const preset = item.reminderPreset || '';
            const baseTime = getBaseTimeFromItem(item);
            const stored = item.reminderTime || '';

            const targetDate = new Date(`${dateStr}T00:00:00`);
            if (Number.isNaN(targetDate.getTime())) return null;
            let reminderTime = '';

            if (!preset) {
                reminderTime = stored;
            } else if (preset === 'morning') {
                reminderTime = '08:00';
            } else if (preset === 'at') {
                reminderTime = baseTime || stored;
            } else if (preset === '10' || preset === '60') {
                const baseMinutes = parseTimeToMinutes(baseTime);
                if (baseMinutes === null) return null;
                const shift = preset === '10' ? 10 : 60;
                const adjusted = baseMinutes - shift;
                if (adjusted < 0) {
                    targetDate.setDate(targetDate.getDate() - 1);
                }
                reminderTime = shiftTime(baseTime, -shift);
            } else {
                reminderTime = stored;
            }

            if (!reminderTime) return null;
            const when = new Date(`${formatDate(targetDate)}T${reminderTime}`);
            if (Number.isNaN(when.getTime())) return null;
            return when;
        }

        // Read a time picker value in 24h format.
        function getTimePickerValue(fieldId) {
            const picker = document.querySelector(`[data-field="${fieldId}"]`);
            if (!picker) return '';
            const hour = picker.querySelector('.time-hour').value;
            const minute = picker.querySelector('.time-minute').value;
            const ampm = picker.querySelector('.time-ampm').value;
            if (!hour || !minute || !ampm) return '';
            let h = parseInt(hour, 10);
            if (ampm === 'PM' && h !== 12) h += 12;
            if (ampm === 'AM' && h === 12) h = 0;
            return `${String(h).padStart(2, '0')}:${minute}`;
        }

        // Populate a time picker using a 24h value.
        function setTimePickerValue(fieldId, value) {
            const picker = document.querySelector(`[data-field="${fieldId}"]`);
            if (!picker) return;
            if (!value) {
                clearTimePicker(fieldId);
                return;
            }
            const [hours, minutes] = value.split(':');
            let h = parseInt(hours, 10);
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12 || 12;
            picker.querySelector('.time-hour').value = String(h);
            picker.querySelector('.time-minute').value = minutes;
            picker.querySelector('.time-ampm').value = ampm;
        }

        // Add or update an item in the appropriate list.
        function addOrUpdateItem() {
            const category = document.getElementById('itemCategory').value;
            const type = document.getElementById('itemKind').value.trim();
            const title = document.getElementById('itemTitle').value.trim();
            const itemDate = document.getElementById('itemDate').value;

            if (!title) {
                alert('Please enter a title');
                return;
            }
            if (!itemDate) {
                alert('Please choose a date');
                return;
            }

            const id = editingItem ? editingItem.id : createItemId();
            const repeatValue = document.getElementById('itemRepeats').value;
            const repeats = category === 'event' && repeatValue !== 'no';
            const repeatInterval = parseInt(document.getElementById('itemRepeatInterval').value, 10);
            const monthlyOrdinal = document.getElementById('itemMonthlyOrdinal').value;
            const monthlyWeekday = parseInt(document.getElementById('itemMonthlyWeekday').value, 10);

            const recurringDays = [];
            document.querySelectorAll('.day-checkbox:checked').forEach(cb => {
                recurringDays.push(parseInt(cb.value, 10));
            });
            if (repeats) {
                if ((repeatValue === 'weekly' || repeatValue === 'biweekly') && recurringDays.length === 0) {
                    alert('Select at least one repeat day.');
                    return;
                }
                if (repeatValue === 'everyNDays' && (!Number.isInteger(repeatInterval) || repeatInterval < 2 || repeatInterval > 365)) {
                    alert('Enter a repeat interval between 2 and 365 days.');
                    return;
                }
                if (repeatValue === 'monthlyWeekday') {
                    if (!['1', '2', '3', '4', 'last'].includes(monthlyOrdinal)) {
                        alert('Pick a monthly ordinal.');
                        return;
                    }
                    if (!Number.isInteger(monthlyWeekday) || monthlyWeekday < 0 || monthlyWeekday > 6) {
                        alert('Pick a valid weekday for monthly recurrence.');
                        return;
                    }
                }
            }

            const selectedColor = document.querySelector('.color-option.selected');
            const colorIndex = Array.from(document.querySelectorAll('.color-option')).indexOf(selectedColor);
            const color = colors[colorIndex >= 0 ? colorIndex : 0];

            const common = {
                id,
                category,
                type: type || '',
                title,
                color,
                description: document.getElementById('itemDescription').value.trim(),
                reminderTime: getTimePickerValue('itemReminderTime'),
                reminderPreset: getSelectedReminderPreset()
            };

            if (editingItem && editingItem.type !== category) {
                removeItemFromCategory(editingItem.type, id);
            }

            if (category === 'event') {
                const existingEvent = events.find(ev => ev.id === id);
                const eventEndDate = document.getElementById('itemEndDate').value || itemDate;
                const eventStartTime = getTimePickerValue('itemTime');
                const eventEndTime = getTimePickerValue('itemEndTime');

                if (eventEndDate < itemDate) {
                    alert('End date must be on or after the start date.');
                    return;
                }
                if (eventEndDate === itemDate && eventStartTime && eventEndTime) {
                    const startMinutes = parseTimeToMinutes(eventStartTime);
                    const endMinutes = parseTimeToMinutes(eventEndTime);
                    if (startMinutes !== null && endMinutes !== null && endMinutes <= startMinutes) {
                        alert('End time must be later than start time for same-day events.');
                        return;
                    }
                }

                const item = {
                    ...common,
                    time: eventStartTime,
                    endTime: eventEndTime,
                    date: repeats ? '' : itemDate,
                    startDate: itemDate,
                    endDate: eventEndDate,
                    recurringDays: repeats && (repeatValue === 'weekly' || repeatValue === 'biweekly') ? recurringDays : [],
                    repeatCycle: repeats ? repeatValue : '',
                    repeatInterval: repeats && repeatValue === 'everyNDays' ? repeatInterval : 0,
                    monthlyOrdinal: repeats && repeatValue === 'monthlyWeekday' ? monthlyOrdinal : '',
                    monthlyWeekday: repeats && repeatValue === 'monthlyWeekday' ? monthlyWeekday : null,
                    completed: existingEvent ? !!existingEvent.completed : false,
                    completedDates: existingEvent && Array.isArray(existingEvent.completedDates) ? existingEvent.completedDates : []
                };
                upsertItem(events, item, id);
            } else if (category === 'task') {
                const item = {
                    ...common,
                    dueTime: getTimePickerValue('itemDueTime'),
                    date: itemDate,
                    startDate: '',
                    recurringDays: [],
                    repeatCycle: '',
                    completed: getExistingCompleted('task', id)
                };
                upsertItem(tasks, item, id);
            } else {
                const item = {
                    ...common,
                    date: itemDate,
                    time: getTimePickerValue('itemTime'),
                    completed: getExistingCompleted('reminder', id)
                };
                upsertItem(reminders, item, id);
            }

            saveData();
            refreshTypeSuggestions();
            closeAddModal();
            renderView();
            scheduleReminders();
        }

        function removeItemFromCategory(category, id) {
            if (category === 'event') {
                events = events.filter(ev => ev.id !== id);
                return;
            }
            if (category === 'task') {
                tasks = tasks.filter(tsk => tsk.id !== id);
                return;
            }
            reminders = reminders.filter(rm => rm.id !== id);
        }

        // Read the previous completion state for existing items.
        function getExistingCompleted(category, id) {
            if (category === 'task') {
                const existing = tasks.find(tsk => tsk.id === id);
                return existing ? existing.completed : false;
            }
            if (category === 'event') {
                const existing = events.find(ev => ev.id === id);
                return existing ? existing.completed : false;
            }
            if (category === 'reminder') {
                const existing = reminders.find(rm => rm.id === id);
                return existing ? existing.completed : false;
            }
            return false;
        }

        // Add a new item or update an existing one.
        function upsertItem(list, item, id) {
            const index = list.findIndex(i => i.id === id);
            if (index >= 0) {
                list[index] = { ...list[index], ...item };
            } else {
                list.push(item);
            }
        }

        // Delete the currently edited item.
        function deleteCurrentItem() {
            if (!editingItem) return;
            deleteItem(editingItem.type, editingItem.id);
            closeAddModal();
        }

        // Delete an item from its list.
        function deleteItem(type, id) {
            removeItemFromCategory(type, id);
            saveData();
            refreshTypeSuggestions();
            renderView();
            scheduleReminders();
        }

        // Reset modal inputs.
        function resetForm() {
            document.getElementById('itemTitle').value = '';
            document.getElementById('itemKind').value = '';
            document.getElementById('itemDescription').value = '';
            document.getElementById('itemRepeats').value = 'no';
            document.getElementById('itemRepeatInterval').value = '3';
            document.getElementById('itemMonthlyOrdinal').value = '1';
            document.getElementById('itemMonthlyWeekday').value = '1';
            document.querySelectorAll('.day-checkbox').forEach(cb => cb.checked = false);
            document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
            document.getElementById('itemEndDate').value = '';
            clearTimePicker('itemTime');
            clearTimePicker('itemEndTime');
            clearTimePicker('itemDueTime');
            clearTimePicker('itemReminderTime');
            setReminderPreset('');
        }

        // Format a Date object as YYYY-MM-DD.
        function formatDate(date) {
            if (window.PlannerCore && typeof window.PlannerCore.formatDateLocal === 'function') {
                return window.PlannerCore.formatDateLocal(date);
            }
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }

        // Format a 24h time to 12h display.
        function formatTime(time) {
            if (window.PlannerCore && typeof window.PlannerCore.formatTime12 === 'function') {
                return window.PlannerCore.formatTime12(time);
            }
            if (!time) return '';
            const [hours, minutes] = time.split(':');
            const h = parseInt(hours, 10);
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            return `${h12}:${minutes} ${ampm}`;
        }

        // Format a slot label like 1 PM.
        function formatHourLabel(hour) {
            if (window.PlannerCore && typeof window.PlannerCore.formatHourLabel === 'function') {
                return window.PlannerCore.formatHourLabel(hour);
            }
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const h12 = hour % 12 || 12;
            return `${h12} ${ampm}`;
        }

        // Extract hour from a 24h time string.
        function getHourFromTime(time) {
            if (window.PlannerCore && typeof window.PlannerCore.getHourFromTime === 'function') {
                return window.PlannerCore.getHourFromTime(time);
            }
            if (!time) return -1;
            const [hours, minutes] = time.split(':');
            const h = parseInt(hours, 10);
            const m = parseInt(minutes, 10);
            if (Number.isNaN(h) || Number.isNaN(m)) return -1;
            if (h < 0 || h > 23 || m < 0 || m > 59) return -1;
            return h;
        }

        function getMinuteFromTime(time) {
            if (window.PlannerCore && typeof window.PlannerCore.getMinuteFromTime === 'function') {
                return window.PlannerCore.getMinuteFromTime(time);
            }
            if (!time) return 0;
            const [, minutes] = time.split(':');
            return parseInt(minutes, 10) || 0;
        }

        function getItemTimeLabelForDate(item, dateStr) {
            if (item.category === 'event') {
                const startDateStr = item.startDate || item.date || '';
                const endDateStr = item.endDate || startDateStr;
                const startTime = item.time || '';
                const endTime = item.endTime || '';
                const singleDay = !startDateStr || startDateStr === endDateStr;

                if (singleDay) {
                    if (startTime && endTime) return `${formatTime(startTime)}-${formatTime(endTime)}`;
                    if (startTime) return formatTime(startTime);
                    if (endTime) return `Until ${formatTime(endTime)}`;
                    return 'All day';
                }

                if (dateStr === startDateStr) {
                    if (startTime) return `Starts ${formatTime(startTime)}`;
                    return 'Starts';
                }
                if (dateStr === endDateStr) {
                    if (endTime) return `Ends ${formatTime(endTime)}`;
                    return 'Ends';
                }
                return 'All day';
            }

            const time = item.dueTime || item.time || '';
            return time ? formatTime(time) : '';
        }

        function getItemSortValue(item, dateStr) {
            if (item.category === 'event') {
                const range = getEventRangeForDay(item, dateStr || formatDate(currentDate));
                if (range) return range.start;
            }
            const time = item.dueTime || item.time || item.reminderTime || '';
            const value = parseTimeToMinutes(time);
            if (value === null) return 24 * 60 + 1;
            return value;
        }

        function getNextItemForDay(items, dateStr) {
            if (!items.length) return null;
            const sorted = [...items].sort((a, b) => getItemSortValue(a, dateStr) - getItemSortValue(b, dateStr));
            const isTodayView = isToday(new Date(`${dateStr}T00:00:00`));
            if (!isTodayView) return sorted[0];
            const now = new Date();
            const nowValue = now.getHours() * 60 + now.getMinutes();
            return sorted.find(item => getItemSortValue(item, dateStr) >= nowValue) || sorted[0];
        }

        // Update the reminder toggle button state.
        function updateNotificationButton() {
            const btn = document.getElementById('notifyButton');
            if (!btn) return;
            btn.textContent = notificationsEnabled ? 'Reminders On' : 'Reminders Off';
            btn.classList.toggle('active', notificationsEnabled);
        }

        // Ask for notification permission or toggle it.
        function toggleNotifications() {
            if (!('Notification' in window)) {
                alert('Notifications are not supported in this browser.');
                return;
            }

            if (Notification.permission === 'granted') {
                notificationsEnabled = !notificationsEnabled;
                localStorage.setItem('plannerNotifications', notificationsEnabled ? 'on' : 'off');
                updateNotificationButton();
                scheduleReminders();
                return;
            }

            if (Notification.permission === 'denied') {
                alert('Notifications are blocked in your browser settings.');
                return;
            }

            Notification.requestPermission().then(permission => {
                notificationsEnabled = permission === 'granted';
                localStorage.setItem('plannerNotifications', notificationsEnabled ? 'on' : 'off');
                updateNotificationButton();
                scheduleReminders();
            }).catch(() => {
                notificationsEnabled = false;
                localStorage.setItem('plannerNotifications', 'off');
                updateNotificationButton();
            });
        }

        // Clear any scheduled reminder timers.
        function clearReminderTimers() {
            reminderTimers.forEach(timer => clearTimeout(timer));
            reminderTimers = [];
        }

        // Schedule upcoming reminders while the app is open.
        function scheduleReminders() {
            clearReminderTimers();
            if (!notificationsEnabled || !('Notification' in window) || Notification.permission !== 'granted') return;

            const now = new Date();
            const maxWindowMs = 7 * 24 * 60 * 60 * 1000;

            const schedule = (title, body, when) => {
                const delta = when - now;
                if (!Number.isFinite(delta) || delta <= 0 || delta > maxWindowMs) return;
                const timer = setTimeout(() => {
                    new Notification(title, { body });
                }, delta);
                reminderTimers.push(timer);
            };

            const scheduleItem = (item, label) => {
                const dateStr = item.date || getNextRecurringDate(item);
                if (!dateStr) return;
                if (isCompleted(item, dateStr)) return;
                const when = getReminderDateTimeForItem(item, dateStr);
                if (!when) return;
                schedule(`${label}: ${item.title}`, item.description || item.type || 'Reminder', when);
            };

            tasks.forEach(task => scheduleItem(task, 'Task'));
            events.forEach(event => scheduleItem(event, 'Event'));
            reminders.forEach(rem => scheduleItem(rem, 'Reminder'));
        }

        // Find the next date for a recurring item.
        function getNextRecurringDate(item) {
            const repeatMode = item.repeatCycle || (item.recurringDays && item.recurringDays.length > 0 ? 'weekly' : '');
            if (!repeatMode) return item.date || item.startDate || '';

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startDate = parseDateOnly(item.startDate || item.date || '');
            if (!startDate) return '';

            const firstCandidate = today < startDate ? startDate : today;
            for (let i = 0; i < 400; i++) {
                const candidate = new Date(firstCandidate);
                candidate.setDate(firstCandidate.getDate() + i);
                const dateStr = formatDate(candidate);
                if (getItemsForDay([item], dateStr, true, true).length > 0) {
                    return dateStr;
                }
            }
            return '';
        }
