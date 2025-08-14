function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
function getISOWeek(date) {
    const tempDate = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    tempDate.setDate(tempDate.getDate() - dayNr + 3);
    const firstThursday = tempDate.valueOf();
    tempDate.setMonth(0, 1);
    if (tempDate.getDay() !== 4) {
        tempDate.setMonth(0, 1 + ((4 - tempDate.getDay()) + 7) % 7);
    }
    const weekNumber = 1 + Math.ceil((firstThursday - tempDate) / 604800000);
    return weekNumber;
}
function getWeekKey(date) {
    return `${date.getFullYear()}-W${getISOWeek(date)}`;
}
function formatDuration(sec, unit, lang) {
    if (unit === 'hours') return lang === 'en' ? `${(sec / 3600).toFixed(1)}h` : `${(sec / 3600).toFixed(1)} Std`;
    if (unit === 'minutes') return lang === 'en' ? `${Math.round(sec / 60)}min` : `${Math.round(sec / 60)} Min`;
    return lang === 'en' ? `${sec}s` : `${sec} Sek`;
}
function getTimeData() {
    return browser.storage.local.get(null);
}
function defaultSettings() {
    return {
        tracking: true,
        lang: 'de',
        graphUnit: 'hours',
        theme: 'light',
        showDiffs: true,
        chartType: 'bar',
        showLegend: false,
        graphRange: 14,
        fontSize: 15,
        borderRadius: 16,
        showTitle: true,
        showCurrentStreak: true,
        colorAccent: '#0073b1',
        colorAccentDark: '#0a66c2',
        showTooltip: true,
        autoShowWidget: true,
        widgetOpacity: 1,
        compactMode: false
    };
}
function getSettings() {
    let settings = localStorage.getItem('quickstats_settings');
    if (!settings) {
        settings = defaultSettings();
        localStorage.setItem('quickstats_settings', JSON.stringify(settings));
    } else {
        settings = JSON.parse(settings);
        const defaults = defaultSettings();
        for (let key in defaults) if (!(key in settings)) settings[key] = defaults[key];
    }
    return settings;
}
function setSettings(newSettings) {
    localStorage.setItem('quickstats_settings', JSON.stringify(newSettings));
    updateStatsWidget();
}
function renderGraph(data) {
    if (document.getElementById('linkedin-time-tracker')) return;
    const settings = getSettings();
    const lang = settings.lang;
    const unit = settings.graphUnit === 'hours' ? 'hours'
        : settings.graphUnit === 'minutes' ? 'minutes'
        : 'minutes';
    const theme = settings.theme;
    const range = Number(settings.graphRange) || 14;
    const chartType = settings.chartType;
    const fontSize = settings.fontSize;
    const borderRadius = settings.borderRadius;
    const showTitle = settings.showTitle;
    const showCurrentStreak = settings.showCurrentStreak;
    const showLegend = settings.showLegend;
    const showDiffs = settings.showDiffs;
    const colorAccent = theme === 'dark' ? settings.colorAccentDark : settings.colorAccent;
    const showTooltip = settings.showTooltip;
    const widgetOpacity = settings.widgetOpacity;
    const compactMode = settings.compactMode;

    const today = new Date();
    let days = [], times = [];
    let showMode = settings.graphUnit;
    if (showMode === 'days' || showMode === 'hours' || showMode === 'minutes') {
        for (let i = range - 1; i >= 0; i--) {
            let d = new Date(today);
            d.setDate(today.getDate() - i);
            let key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
            days.push(`${d.getDate()}.${d.getMonth() + 1}`);
            times.push(data[key] || 0);
        }
    } else if (showMode === 'weeks') {
        let weekLabels = [], weekTimes = [];
        for (let i = Math.ceil(range / 7) - 1; i >= 0; i--) {
            let d = new Date(today);
            d.setDate(today.getDate() - i * 7);
            let key = getWeekKey(d);
            weekLabels.push(key);
            weekTimes.push(data[key] || 0);
        }
        days = weekLabels;
        times = weekTimes;
    }

    let weekNowKey = getWeekKey(today);
    let lastWeek = new Date(today); lastWeek.setDate(today.getDate() - 7);
    let weekLastKey = getWeekKey(lastWeek);
    let weekNow = data[weekNowKey] || 0, weekPrev = data[weekLastKey] || 0, diffWeek = weekNow - weekPrev;
    let todayKey = getTodayKey();
    let yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    let yesterdayKey = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;
    let diffDay = (data[todayKey] || 0) - (data[yesterdayKey] || 0);
    let currentStreak = 0;
    for (let i = 0; i < times.length; i++) {
        if (times[times.length - 1 - i] > 0) currentStreak++;
        else break;
    }
    let container = document.createElement('div');
    container.id = "linkedin-time-tracker";
    container.className = "artdeco-card mb2 overflow-hidden profile-card";
    container.style.padding = compactMode ? "8px" : "18px";
    container.style.background = theme === 'dark' ? "#222" : "#fff";
    container.style.borderRadius = `${borderRadius}px`;
    container.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
    container.style.fontSize = `${fontSize}px`;
    container.style.lineHeight = "1.5";
    container.style.maxWidth = compactMode ? "160px" : "272px";
    container.style.marginTop = "8px";
    container.style.marginBottom = "0px";
    container.style.color = theme === 'dark' ? "#eee" : "#222";
    container.style.transition = "all .2s";
    container.style.opacity = widgetOpacity;

    let titleText = lang === 'en' ? "QuickStats" : "QuickStats";
    let todayText = lang === 'en' ? 'Today' : 'Heute';
    let last7Text = lang === 'en' ? 'Last 7 days' : 'Letzte 7 Tage';
    let weekVsText = lang === 'en' ? 'Week vs. last week' : 'Woche vs. letzte Woche';
    let streakText = lang === 'en' ? 'Current streak' : 'Aktuelle Serie';

    container.innerHTML = `
        ${showTitle ? `<div style="font-size:${fontSize + 2}px; font-weight:700; margin-bottom:5px; letter-spacing:.5px;">${titleText}</div>` : ""}
        <div style="margin-bottom:2px;">
        ${todayText}: <b>${formatDuration(data[todayKey] || 0, unit, lang)}</b>
        ${showDiffs ? `<span style="font-size:12px; color:#666;"> (${diffDay >= 0 ? '+' : ''}${formatDuration(diffDay, unit, lang)} ${lang === 'en' ? 'vs. yesterday' : 'vs. gestern'})</span>` : ""}
        </div>
        <div style="margin-bottom:2px;">
        ${last7Text}: <b>${formatDuration(times.slice(-7).reduce((a, b) => a + b, 0), unit, lang)}</b>
        </div>
        ${showDiffs ? `<div style="margin-bottom:8px;">
        <span style="font-size:13px; color:#666;">${weekVsText}:</span>
        <b style="font-size:12px">${diffWeek >= 0 ? '+' : ''}${formatDuration(diffWeek, unit, lang)}</b>
        </div>` : ""}
        ${showCurrentStreak ? `<div style="margin-bottom:8px;font-size:13px;color:#666;">${streakText}: <b>${currentStreak}</b></div>` : ""}
        <div style="display:flex; align-items:center; justify-content:center; width:100%; min-height:48px;">
        <canvas id="linkedinTimeChart" width="220" height="48" style="margin-top:0; max-width:100%;"></canvas>
        </div>
    `;

    var profileCard = document.querySelector('.artdeco-card.profile-card');
    if (profileCard) profileCard.parentNode.insertBefore(container, profileCard.nextSibling);

    setTimeout(() => {
        const canvas = document.getElementById('linkedinTimeChart');
        if (canvas && typeof Chart !== "undefined") {
            let graphData = times;
            if (unit === 'hours') graphData = times.map(x => +(x / 3600).toFixed(2));
            else if (unit === 'minutes') graphData = times.map(x => Math.round(x / 60));
            new Chart(canvas.getContext('2d'), {
                type: chartType,
                data: {
                    labels: days,
                    datasets: [{
                        label: lang === 'en'
                            ? (showMode === 'weeks' ? 'Hours/Week' : unit === 'hours' ? 'Hours/Day' : unit === 'minutes' ? 'Minutes/Day' : 'Seconds/Day')
                            : (showMode === 'weeks' ? 'Stunden/Woche' : unit === 'hours' ? 'Stunden/Tag' : unit === 'minutes' ? 'Minuten/Tag' : 'Sekunden/Tag'),
                        data: graphData,
                        backgroundColor: Array(graphData.length).fill(colorAccent)
                    }]
                },
                options: {
                    plugins: { legend: { display: showLegend }, tooltip: { enabled: showTooltip } },
                    scales: {
                        y: { beginAtZero: true, grid: { display: false }, ticks: { display: false } },
                        x: { grid: { display: false }, ticks: { display: false } }
                    }
                }
            });
        }
    }, 70);
}
function updateStatsWidget() {
    document.querySelectorAll('#linkedin-time-tracker').forEach(el => el.remove());
    const settings = getSettings();
    if (settings.tracking && document.querySelector('.artdeco-card.profile-card') && !document.getElementById('linkedin-time-tracker')) {
        getTimeData().then(renderGraph);
    }
}
function insertStatsWidgetIfNeeded() {
    if (!document.querySelector('.artdeco-card.profile-card')) return;
    if (document.getElementById('linkedin-time-tracker')) return;
    const settings = getSettings();
    if (!settings.tracking) return;
    getTimeData().then(renderGraph);
}
const observerStats = new MutationObserver(insertStatsWidgetIfNeeded);
observerStats.observe(document.body, { childList: true, subtree: true });
setInterval(insertStatsWidgetIfNeeded, 1200);

function createSettingsPopup() {
    let settings = getSettings();
    if (document.getElementById('quickstats-settings-popup')) return;
    const popup = document.createElement('div');
    popup.id = 'quickstats-settings-popup';
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.background = settings.theme === 'dark' ? '#222' : '#fff';
    popup.style.color = settings.theme === 'dark' ? '#eee' : '#222';
    popup.style.boxShadow = '0 2px 16px rgba(0,0,0,0.2)';
    popup.style.borderRadius = `${settings.borderRadius}px`;
    popup.style.padding = '32px 24px';
    popup.style.zIndex = '9999';
    popup.style.minWidth = '340px';
    popup.style.transition = 'all .2s';
    popup.innerHTML = `
        <div style="font-size:17px; font-weight:600; margin-bottom:18px;">${settings.lang === 'en' ? 'QuickStats Settings' : 'QuickStats Einstellungen'}</div>
        <div style="margin-bottom:14px;">
            <label><input type="checkbox" id="enable-tracking" ${settings.tracking ? 'checked' : ''}>${settings.lang === 'en' ? 'Enable tracking' : 'Tracking aktivieren'}</label>
        </div>
        <div style="margin-bottom:14px;">
            <label>${settings.lang === 'en' ? 'Language' : 'Sprache'}:
                <select id="quickstats-lang">
                    <option value="en" ${settings.lang === 'en' ? 'selected' : ''}>English</option>
                    <option value="de" ${settings.lang === 'de' ? 'selected' : ''}>Deutsch</option>
                </select>
            </label>
        </div>
        <div style="margin-bottom:14px;">
            <label>${settings.lang === 'en' ? 'Theme' : 'Design'}:
                <select id="quickstats-theme">
                    <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>${settings.lang === 'en' ? 'Light' : 'Hell'}</option>
                    <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>${settings.lang === 'en' ? 'Dark' : 'Dunkel'}</option>
                </select>
            </label>
        </div>
        <div style="margin-bottom:14px;">
            <label>${settings.lang === 'en' ? 'Graph Mode' : 'Graph Ansicht'}:
                <select id="quickstats-graph-unit">
                    <option value="minutes" ${settings.graphUnit === 'minutes' ? 'selected' : ''}>${settings.lang === 'en' ? 'Minutes' : 'Minuten'}</option>
                    <option value="hours" ${settings.graphUnit === 'hours' ? 'selected' : ''}>${settings.lang === 'en' ? 'Hours' : 'Stunden'}</option>
                    <option value="days" ${settings.graphUnit === 'days' ? 'selected' : ''}>${settings.lang === 'en' ? 'Daily' : 'Täglich'}</option>
                    <option value="weeks" ${settings.graphUnit === 'weeks' ? 'selected' : ''}>${settings.lang === 'en' ? 'Weekly' : 'Wöchentlich'}</option>
                </select>
            </label>
        </div>
        <div style="margin-bottom:14px;">
            <label>${settings.lang === 'en' ? 'Chart type' : 'Diagrammtyp'}:
                <select id="quickstats-chart-type">
                    <option value="bar" ${settings.chartType === 'bar' ? 'selected' : ''}>${settings.lang === 'en' ? 'Bar' : 'Balken'}</option>
                    <option value="line" ${settings.chartType === 'line' ? 'selected' : ''}>${settings.lang === 'en' ? 'Line' : 'Linie'}</option>
                </select>
            </label>
        </div>
        <div style="margin-bottom:14px;">
            <label>${settings.lang === 'en' ? 'Accent Color' : 'Akzentfarbe'}:
                <input type="color" id="quickstats-accent" value="${settings.colorAccent}">
            </label>
        </div>
        <div style="margin-bottom:14px;">
            <label>${settings.lang === 'en' ? 'Legend' : 'Legende'}:
                <input type="checkbox" id="quickstats-show-legend" ${settings.showLegend ? 'checked' : ''}>
            </label>
        </div>
        <div style="margin-bottom:14px;">
            <label>${settings.lang === 'en' ? 'Show differences' : 'Unterschiede anzeigen'}:
                <input type="checkbox" id="quickstats-show-diffs" ${settings.showDiffs ? 'checked' : ''}>
            </label>
        </div>
        <div style="margin-bottom:14px;">
            <label>${settings.lang === 'en' ? 'Show title' : 'Titel anzeigen'}:
                <input type="checkbox" id="quickstats-show-title" ${settings.showTitle ? 'checked' : ''}>
            </label>
        </div>
        <div style="margin-bottom:14px;">
            <label>${settings.lang === 'en' ? 'Show streak' : 'Serie anzeigen'}:
                <input type="checkbox" id="quickstats-show-streak" ${settings.showCurrentStreak ? 'checked' : ''}>
            </label>
        </div>
        <div style="margin-bottom:14px;">
            <label>${settings.lang === 'en' ? 'Tooltip' : 'Tooltip'}:
                <input type="checkbox" id="quickstats-show-tooltip" ${settings.showTooltip ? 'checked' : ''}>
            </label>
        </div>
        <div style="margin-bottom:14px;">
            <label>${settings.lang === 'en' ? 'Compact mode' : 'Kompaktmodus'}:
                <input type="checkbox" id="quickstats-compact" ${settings.compactMode ? 'checked' : ''}>
            </label>
        </div>
        <div style="margin-bottom:14px;">
            <label>${settings.lang === 'en' ? 'Widget opacity' : 'Widget Transparenz'}:
                <input type="range" min="0.3" max="1" step="0.01" id="quickstats-opacity" value="${settings.widgetOpacity}">
            </label>
        </div>
        <div style="margin-bottom:14px;">
            <label>${settings.lang === 'en' ? 'Graph range (days)' : 'Graph Bereich (Tage)'}:
                <input type="number" min="7" max="60" id="quickstats-graph-range" value="${settings.graphRange}">
            </label>
        </div>
        <div style="margin-bottom:14px;">
            <label>${settings.lang === 'en' ? 'Font size' : 'Schriftgröße'}:
                <input type="number" min="12" max="20" id="quickstats-font-size" value="${settings.fontSize}">
            </label>
        </div>
        <div style="margin-bottom:14px;">
            <label>${settings.lang === 'en' ? 'Border radius' : 'Abrundung'}:
                <input type="number" min="0" max="32" id="quickstats-border-radius" value="${settings.borderRadius}">
            </label>
        </div>
        <button id="close-quickstats-settings" style="margin-top:10px; padding:8px 20px; border-radius:8px; background:#0073b1; color:#fff; border:none;">${settings.lang === 'en' ? 'Close' : 'Schließen'}</button>
    `;
    document.body.appendChild(popup);

    function bindSetting(id, key, inputType = 'value', parser = v => v) {
        const el = document.getElementById(id);
        if (!el) return;
        el.onchange = (e) => {
            if (inputType === 'checked') settings[key] = e.target.checked;
            else settings[key] = parser(e.target.value);
            setSettings(settings);
            if (key === 'theme' || key === 'lang' || key === 'compactMode') {
                popup.remove();
                createSettingsPopup();
            }
        };
    }
    bindSetting('enable-tracking', 'tracking', 'checked');
    bindSetting('quickstats-lang', 'lang');
    bindSetting('quickstats-theme', 'theme');
    bindSetting('quickstats-graph-unit', 'graphUnit');
    bindSetting('quickstats-chart-type', 'chartType');
    bindSetting('quickstats-accent', 'colorAccent');
    bindSetting('quickstats-show-legend', 'showLegend', 'checked');
    bindSetting('quickstats-show-diffs', 'showDiffs', 'checked');
    bindSetting('quickstats-show-title', 'showTitle', 'checked');
    bindSetting('quickstats-show-streak', 'showCurrentStreak', 'checked');
    bindSetting('quickstats-show-tooltip', 'showTooltip', 'checked');
    bindSetting('quickstats-compact', 'compactMode', 'checked');
    bindSetting('quickstats-opacity', 'widgetOpacity', 'value', v => Math.max(0.3, Math.min(1, Number(v))));
    bindSetting('quickstats-graph-range', 'graphRange', 'value', v => Math.max(7, Math.min(60, Number(v))));
    bindSetting('quickstats-font-size', 'fontSize', 'value', v => Math.max(12, Math.min(20, Number(v))));
    bindSetting('quickstats-border-radius', 'borderRadius', 'value', v => Math.max(0, Math.min(32, Number(v))));

    document.getElementById('close-quickstats-settings').onclick = () => {
        popup.remove();
        updateStatsWidget();
    };
}
function addQuickStatsSettingsLink() {
    const manageList = document.querySelector('ul[aria-label="Manage"]');
    if (!manageList) return;
    if (manageList.querySelector('.quickstats-settings-link')) return;
    const li = document.createElement('li');
    li.className = "global-nav__secondary-item quickstats-settings-link";
    const settings = getSettings();
    const a = document.createElement('a');
    a.className = "PGqaLQfFCVxPObMVWYFHqRuydpmGwtFMzMls global-nav__secondary-link";
    a.href = "#";
    a.textContent = settings.lang === 'en' ? "QuickStats Settings" : "QuickStats Einstellungen";
    a.onclick = (e) => {
        e.preventDefault();
        createSettingsPopup();
    };
    li.appendChild(a);
    manageList.appendChild(li);
}
const observerSettings = new MutationObserver(() => {
    const meMenu = document.querySelector('.global-nav__me-content');
    if (meMenu) addQuickStatsSettingsLink();
});
observerSettings.observe(document.body, { childList: true, subtree: true });
