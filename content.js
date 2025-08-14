function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
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
function formatDuration(sec) {
    if (sec < 60) return `${sec}s`;
    if (sec < 3600) return `${Math.round(sec/60)}min`;
    return `${(sec/3600).toFixed(1)}h`;
}
function getTimeData() {
    return browser.storage.local.get(null);
}
function renderGraph(data) {
    if (document.getElementById('linkedin-time-tracker')) return;
    const today = new Date();
    let days = [];
    let times = [];
    for (let i = 13; i >= 0; i--) {
        let d = new Date(today);
        d.setDate(today.getDate() - i);
        let key = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
        days.push(`${d.getDate()}.${d.getMonth()+1}`);
        times.push(data[key] || 0);
    }
    let weekNowKey = getWeekKey(today);
    let lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    let weekLastKey = getWeekKey(lastWeek);
    let weekNow = data[weekNowKey] || 0;
    let weekPrev = data[weekLastKey] || 0;
    let diffWeek = weekNow - weekPrev;
    let todayKey = getTodayKey();
    let yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    let yesterdayKey = `${yesterday.getFullYear()}-${yesterday.getMonth()+1}-${yesterday.getDate()}`;
    let diffDay = (data[todayKey] || 0) - (data[yesterdayKey] || 0);
    let container = document.createElement('div');
    container.id = "linkedin-time-tracker";
    container.innerHTML = `
        <div style="font-weight:bold; margin-bottom:8px;">QuickStats LinkedIn-Feed-Zeit</div>
        <div>Heute: <b>${formatDuration(data[todayKey]||0)}</b> (${diffDay>=0?'+':''}${formatDuration(diffDay)} vs. gestern)</div>
        <div>Letzte 7 Tage: <b>${formatDuration(times.slice(-7).reduce((a,b)=>a+b,0))}</b></div>
        <div>Woche vs. letzte Woche: <b>${diffWeek>=0?'+':''}${formatDuration(diffWeek)}</b></div>
        <canvas id="linkedinTimeChart" width="350" height="120"></canvas>
    `;
    document.body.prepend(container);
    setTimeout(() => {
        const canvas = document.getElementById('linkedinTimeChart');
        if (canvas) {
            new Chart(canvas.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: days,
                    datasets: [{
                        label: 'Minuten/Tag',
                        data: times.map(x => Math.round(x/60)),
                        backgroundColor: Array(times.length).fill('#0073b1')
                    }]
                },
                options: {
                    plugins: { legend: { display: false }},
                    scales: {
                        y: { beginAtZero: true, grid: { color: "#eee" }},
                        x: { grid: { display: false }}
                    }
                }
            });
        }
    }, 100);
}
getTimeData().then(renderGraph);
