(function initPlannerCore(root) {
    'use strict';

    function formatDateLocal(date) {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
            return '';
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatTime12(time) {
        if (!time || typeof time !== 'string') return '';
        const parts = time.split(':');
        if (parts.length !== 2) return '';
        const hours = Number(parts[0]);
        const minutes = Number(parts[1]);
        if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return '';
        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return '';
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const h12 = hours % 12 || 12;
        return `${h12}:${String(minutes).padStart(2, '0')} ${ampm}`;
    }

    function formatHourLabel(hour) {
        if (!Number.isInteger(hour) || hour < 0 || hour > 23) return '';
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const h12 = hour % 12 || 12;
        return `${h12} ${ampm}`;
    }

    function getHourFromTime(time) {
        if (!time || typeof time !== 'string') return -1;
        const parts = time.split(':');
        if (parts.length !== 2) return -1;
        const hours = Number(parts[0]);
        const minutes = Number(parts[1]);
        if (!Number.isInteger(hours) || hours < 0 || hours > 23) return -1;
        if (!Number.isInteger(minutes) || minutes < 0 || minutes > 59) return -1;
        return hours;
    }

    function getMinuteFromTime(time) {
        if (!time || typeof time !== 'string') return 0;
        const parts = time.split(':');
        if (parts.length !== 2) return 0;
        const minutes = Number(parts[1]);
        if (!Number.isInteger(minutes) || minutes < 0 || minutes > 59) return 0;
        return minutes;
    }

    function shiftTime(time, minutesDelta) {
        if (!time || typeof time !== 'string') return '';
        const parts = time.split(':').map(Number);
        if (parts.length !== 2) return '';
        const hours = parts[0];
        const minutes = parts[1];
        if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return '';
        if (!Number.isInteger(minutesDelta)) return '';
        const dayMinutes = 24 * 60;
        const total = (hours * 60) + minutes + minutesDelta;
        const wrapped = ((total % dayMinutes) + dayMinutes) % dayMinutes;
        const h = Math.floor(wrapped / 60);
        const m = wrapped % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    function computeReminderTime(baseTime, preset, fallbackTime) {
        if (!preset) return fallbackTime || '';
        if (preset === 'morning') return '08:00';
        if (!baseTime) return '08:00';
        if (preset === 'at') return baseTime;
        if (preset === '10') return shiftTime(baseTime, -10);
        if (preset === '60') return shiftTime(baseTime, -60);
        return fallbackTime || '';
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    const api = {
        computeReminderTime,
        escapeHtml,
        formatDateLocal,
        formatHourLabel,
        formatTime12,
        getHourFromTime,
        getMinuteFromTime,
        shiftTime
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    root.PlannerCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
