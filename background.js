const TRACK_INTERVAL = 5000;

function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

function getWeekKey() {
    const d = new Date();
    const week = getISOWeek(d);
    return `${d.getFullYear()}-W${week}`;
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

function storeTime(key, seconds) {
    browser.storage.local.get(key).then((result) => {
        const current = result[key] || 0;
        let update = {};
        update[key] = current + seconds;
        browser.storage.local.set(update);
    });
}

function trackTab(tabId) {
    let lastActive = Date.now();
    const interval = setInterval(() => {
        browser.tabs.get(tabId).then(tab => {
            if (tab.active && tab.url.startsWith("https://www.linkedin.com/feed")) {
                const now = Date.now();
                const elapsed = Math.floor((now - lastActive) / 1000);
                lastActive = now;
                storeTime(getTodayKey(), elapsed);
                storeTime(getWeekKey(), elapsed);
            }
        });
    }, TRACK_INTERVAL);

    browser.tabs.onRemoved.addListener((closedId) => {
        if (closedId === tabId) clearInterval(interval);
    });
}

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.url && tab.url.startsWith("https://www.linkedin.com/feed")) {
        trackTab(tabId);
    }
});
