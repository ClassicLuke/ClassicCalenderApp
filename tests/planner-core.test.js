const test = require('node:test');
const assert = require('node:assert/strict');

const core = require('../scripts/planner-core.js');

test('formatDateLocal uses local date components', () => {
    const date = new Date(2026, 1, 7, 23, 30, 0);
    assert.equal(core.formatDateLocal(date), '2026-02-07');
});

test('formatTime12 formats valid time and rejects invalid', () => {
    assert.equal(core.formatTime12('00:05'), '12:05 AM');
    assert.equal(core.formatTime12('14:30'), '2:30 PM');
    assert.equal(core.formatTime12('99:99'), '');
});

test('shiftTime wraps across day boundaries', () => {
    assert.equal(core.shiftTime('00:05', -10), '23:55');
    assert.equal(core.shiftTime('23:50', 20), '00:10');
    assert.equal(core.shiftTime('10:00', 30), '10:30');
});

test('getHourFromTime rejects invalid minute values', () => {
    assert.equal(core.getHourFromTime('10:99'), -1);
    assert.equal(core.getHourFromTime('10:30'), 10);
});

test('computeReminderTime applies presets', () => {
    assert.equal(core.computeReminderTime('09:00', 'at', ''), '09:00');
    assert.equal(core.computeReminderTime('09:00', '10', ''), '08:50');
    assert.equal(core.computeReminderTime('', 'morning', ''), '08:00');
    assert.equal(core.computeReminderTime('', '', '07:15'), '07:15');
});

test('escapeHtml escapes dangerous characters', () => {
    assert.equal(core.escapeHtml('<script>alert("x")</script>'), '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
});
