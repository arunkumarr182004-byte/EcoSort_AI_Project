// EcoSort AI - Dashboard Analytics Controller

// Dynamic chart instances stored globally to allow destroying on refresh
let distributionChartInstance = null;
let activityChartInstance = null;

// Ranger levels definitions
function getRangerLevel(totalScans) {
    if (totalScans === 0) return { name: "Eco Recruit", icon: "fa-seedling" };
    if (totalScans <= 5) return { name: "Seedling Ranger (Lvl 1)", icon: "fa-seedling" };
    if (totalScans <= 12) return { name: "Sprout Defender (Lvl 2)", icon: "fa-leaf" };
    if (totalScans <= 25) return { name: "Eco Guardian (Lvl 3)", icon: "fa-tree" };
    return { name: "Green Champion (Lvl 4)", icon: "fa-crown" };
}

// Main load function called by the SPA router
async function loadDashboard() {
    try {
        const res = await fetch('/api/dashboard');
        const data = await res.json();
        
        // 1. Update KPI Card values
        document.getElementById('dash-total-scans').innerText = data.total_scans;
        document.getElementById('dash-recycling-rate').innerText = `${data.recycling_percentage}%`;
        document.getElementById('dash-carbon-offset').innerText = `${data.total_carbon_savings.toFixed(2)} kg`;
        
        const badge = getRangerLevel(data.total_scans);
        document.getElementById('dash-eco-score').innerHTML = `<i class="fa-solid ${badge.icon}"></i> ${badge.name.split(' ')[0]}`;
        
        // Sync header user card level
        const sidebarRole = document.querySelector('.user-role');
        if (sidebarRole) {
            sidebarRole.innerText = badge.name;
        }

        // Detect current theme to style charts appropriately
        const theme = document.documentElement.getAttribute('data-theme') || 'light';
        const isDark = theme === 'dark';
        
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)';
        const textColor = isDark ? '#94a3b8' : '#64748b';
        
        // 2. Render Waste stream category distribution pie chart
        renderDistributionChart(data.category_distribution, isDark, textColor);
        
        // 3. Render Daily activity line chart
        renderActivityChart(data.daily_scans, gridColor, textColor, isDark);
        
    } catch (err) {
        console.error('Failed to load dashboard data:', err);
    }
}

function renderDistributionChart(distribution, isDark, textColor) {
    const ctx = document.getElementById('distribution-chart');
    if (!ctx) return;
    
    // Destroy previous instance
    if (distributionChartInstance) {
        distributionChartInstance.destroy();
    }
    
    const categories = Object.keys(distribution);
    const counts = Object.values(distribution);
    
    // Fallback if no data available yet
    if (categories.length === 0) {
        categories.push("No Logs Yet");
        counts.push(1);
    }
    
    // Map categories to standard color palette
    const colorMap = {
        'Plastic': '#10b981',
        'Paper': '#3b82f6',
        'Glass': '#6366f1',
        'Metal': '#8b5cf6',
        'Organic Waste': '#f59e0b',
        'E-Waste': '#0ea5e9',
        'Hazardous Waste': '#ef4444',
        'No Logs Yet': '#94a3b8'
    };
    
    const backgroundColors = categories.map(cat => colorMap[cat] || '#64748b');
    
    distributionChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: counts,
                backgroundColor: backgroundColors,
                borderWidth: isDark ? 2 : 1,
                borderColor: isDark ? '#0f1624' : '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: textColor,
                        font: {
                            family: 'Inter',
                            size: 11
                        },
                        padding: 14
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.label === 'No Logs Yet') return 'No scans logged';
                            return ` ${context.label}: ${context.raw} scan(s)`;
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

function renderActivityChart(dailyScans, gridColor, textColor, isDark) {
    const ctx = document.getElementById('activity-chart');
    if (!ctx) return;
    
    if (activityChartInstance) {
        activityChartInstance.destroy();
    }
    
    const labels = dailyScans.map(item => {
        // Format YYYY-MM-DD to Short Date (e.g. Aug 06)
        const dateObj = new Date(item.date + 'T00:00:00');
        return dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    });
    const counts = dailyScans.map(item => item.count);
    
    const canvasContext = ctx.getContext('2d');
    
    // Create soft gradient under line
    const gradient = canvasContext.createLinearGradient(0, 0, 0, 240);
    if (isDark) {
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
    } else {
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
    }
    
    activityChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Scans',
                data: counts,
                fill: true,
                backgroundColor: gradient,
                borderColor: '#10b981',
                borderWidth: 3,
                pointBackgroundColor: '#10b981',
                pointBorderColor: isDark ? '#0f1624' : '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // Hide label box
                }
            },
            scales: {
                y: {
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        color: textColor,
                        stepSize: 1,
                        beginAtZero: true
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: textColor
                    }
                }
            }
        }
    });
}
