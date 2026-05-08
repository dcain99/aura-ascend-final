// TODO: Refactor the water logic to use a multiplier instead of flat points later.
let auraChartInstance = null;
let audioStarted = false;
let audioCtx, oscillator, gainNode; 


// Rank colors & Letters
const auraTiers = {
    "PREDATOR": { color: "#ff3333", grade: "S" }, // Red for Apex predator
    "MASTER":   { color: "#ff4dff", grade: "A" }, 
    "DIAMOND":  { color: "#a020f0", grade: "B" }, 
    "PLATINUM": { color: "#00bfff", grade: "C" }, 
    "GOLD":     { color: "#ffcc00", grade: "D" }, 
    "BRONZE":   { color: "#cd7f32", grade: "E" }  
};

// Rank based on points
const getAuraRank = (points) => {
    if (points >= 1500) return { name: "PREDATOR", ...auraTiers.PREDATOR };
    if (points >= 1100) return { name: "MASTER", ...auraTiers.MASTER };
    if (points >= 800)  return { name: "DIAMOND", ...auraTiers.DIAMOND };
    if (points >= 500)  return { name: "PLATINUM", ...auraTiers.PLATINUM };
    if (points >= 250)  return { name: "GOLD", ...auraTiers.GOLD };
    return { name: "BRONZE", ...auraTiers.BRONZE };
};

// Refresh Data
const updateDashboard = () => {
	
	
	// Update the Temporal Header 
const now = new Date();
document.getElementById('sessionTimestamp').innerText = now.toLocaleString('en-GB', { 
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' 
}).toUpperCase();


    // Get values from inputs
    const stepvalue = Number(document.getElementById('steps').value) || 0;
    const setsvalue  = Number(document.getElementById('sets').value) || 0;
    const versesvalue = Number(document.getElementById('verses').value) || 0;
    const sleepvalue  = Number(document.getElementById('sleep').value) || 0;
    const Proteinmet = document.getElementById('protein').checked;
    const waterValue = Number(document.getElementById('water').value) || 0;
    const standingValue = Number(document.getElementById('standing').value) || 0;
	
    // Manual Point Calculations
    let biblepoints = (v) => v <= 10 ? v * 15 : 150 - ((v - 10) * 2);
    let sleeppoints = (h) => h === 0 ? 0 : (h >= 7 && h <= 9) ? 150 : (h === 6 || h === 10) ? 75 : 25;
    let steppoints  = stepvalue <= 15000 ? (stepvalue / 25) : Math.max(0, 600 - ((stepvalue - 15000) / 25));
    let setpoints = setsvalue <= 12 ? setsvalue * 15 : 180 - ((setsvalue - 12) * 20);
	
	
	// ---  Water Logic ---
    let waterPoints = 0;
    const centerpiece = document.querySelector('.aura-centerpiece');
    centerpiece.classList.remove('system-failure-flicker', 'low-dim', 'optimal-vibration');

    if (waterValue < 2.0 && waterValue > 0) {
        waterPoints = -150; 
        centerpiece.classList.add('system-failure-flicker');
    } else if (waterValue >= 2.0 && waterValue < 3.0) {
        waterPoints = 0;
        centerpiece.classList.add('low-dim');
    } else if (waterValue >= 3.0 && waterValue <= 4.5) {
        waterPoints = 150;
        centerpiece.classList.add('optimal-vibration');
    } else if (waterValue > 5.0) {
        waterPoints = -100; // Over-hydration penalty
    }

    // --- Standing Logic ---
    let standingPoints = 0;
    if (standingValue >= 2 && standingValue < 4) {
        standingPoints = standingValue * 15;
    } else if (standingValue >= 4) {
        standingPoints = (standingValue * 15) + 100;
    }

    const xpGained = biblepoints(versesvalue) + sleeppoints(sleepvalue) + steppoints + setpoints + waterPoints + standingPoints;
    const multiplier = Proteinmet ? 1.2 : 1.0;
    const FinalxpGained = Math.max(0, Math.round(xpGained * multiplier));

    // UI refresh
    const rankInfo = getAuraRank(FinalxpGained);

    // Update Text Elements
    document.getElementById('DisplayAura').innerText = FinalxpGained;
    
    const ranklabel = document.getElementById('RankTitle');
    ranklabel.innerText = rankInfo.name;
    ranklabel.style.color = rankInfo.color; 
	
	// --- Aura Visual Logic ---
const auraVisual = document.getElementById('auraEffect');
if (auraVisual) {
    // Sync the aura's CSS variable to the current rank color
    auraVisual.style.setProperty('--aura-color', rankInfo.color);
	
	let sizeMultiplier = 0.4 + (FinalxpGained / 3000); 
    sizeMultiplier = Math.min(sizeMultiplier, 1.1); 
    auraVisual.style.setProperty('--aura-size', sizeMultiplier);
	
	if (FinalxpGained >= 1500) {
            // High power = Faster flicker
            auraVisual.style.animationDuration = "0.8s"; 
        } else {
            // Normal power = Steady flicker
            auraVisual.style.animationDuration = "1.5s";
        }

    // Control Intensity based on the Score
    if (FinalxpGained >= 500) {
        auraVisual.style.opacity = "0.8";
        
       
        if (rankInfo.grade === "S") {
            auraVisual.style.filter = `drop-shadow(0 0 30px ${rankInfo.color}) contrast(1.4)`;
        } else {
            auraVisual.style.filter = `drop-shadow(0 0 15px ${rankInfo.color})`;
        }
    } else {
       
        auraVisual.style.opacity = "0";
    }
	
	
}

    // Audio Hum Logic
    if (audioStarted) {
        const freq = 50 + (FinalxpGained / 10); 
        oscillator.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.1);
        const volume = FinalxpGained > 0 ? 0.05 : 0;
        gainNode.gain.setTargetAtTime(volume, audioCtx.currentTime, 0.1);
    }

    // Update tierbadge
    const tierBadge = document.getElementById('NavRank');
    if (tierBadge) {
        tierBadge.innerText = "RANK: " + rankInfo.grade;
        tierBadge.style.borderColor = rankInfo.color; 
    }

    storedstats(FinalxpGained);
	
	updateAuraChart(); // Refresh the chart whenever data changes
	
};

// Data Persistence
const storedstats = (score) => {
    const selectedDate = document.getElementById('datePicker').value;
    if (!selectedDate) return;

    const dataObj = {
        steps: document.getElementById('steps').value,
        sets: document.getElementById('sets').value,
        verses: document.getElementById('verses').value,
        sleep: document.getElementById('sleep').value,
        protein: document.getElementById('protein').checked,
		water: document.getElementById('water').value,
        standing: document.getElementById('standing').value,
        totalAura: score
    };
    localStorage.setItem("aura_entry_" + selectedDate, JSON.stringify(dataObj));
};

const getDailyData = () => {
    const selectedDate = document.getElementById('datePicker').value;
    const record = JSON.parse(localStorage.getItem("aura_entry_" + selectedDate));
    
    if (record) {
        document.getElementById('steps').value = record.steps || "";
        document.getElementById('sets').value = record.sets || "";
        document.getElementById('verses').value = record.verses || "";
        document.getElementById('sleep').value = record.sleep || "";
        document.getElementById('protein').checked = record.protein || false;
		document.getElementById('water').value = record.water || "";
        document.getElementById('standing').value = record.standing || "";
   } else {
    // Reset ALL cards if no data exists for this date
    ['steps', 'sets', 'verses', 'sleep', 'water', 'standing'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = "";
    });
    document.getElementById('protein').checked = false;
}
    updateDashboard();
};

// initialization 
window.addEventListener('DOMContentLoaded', () => {
    
    const lowFxToggle = document.getElementById('lowFxToggle');

    //  Low FX Logic
    if (lowFxToggle) {
        if (localStorage.getItem('lowFxMode') === 'true') {
            document.body.classList.add('low-fx');
            lowFxToggle.checked = true;
        }

        lowFxToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.add('low-fx');
                localStorage.setItem('lowFxMode', 'true');
            } else {
                document.body.classList.remove('low-fx');
                localStorage.setItem('lowFxMode', 'false');
            }
        }); 
    }

    // --- Scroll of Wisdom Logic ---
const quotes = [
    "The only way to grow is to move.",
    "Discipline is doing what needs to be done, even if you don't want to.",
    "I can do all things through Christ who strengthens me.",
    "Do you not know that in a race all the runners run, but only one gets the prize? Run in such a way as to get the prize.",
    "Your future self is watching you through your memories.",
    "The pain of discipline is less than the pain of regret.",
    "Consistency beats intensity every single time.",
    "Focus on improving yourself, not proving yourself.",
    "Do something today that your future self will thank you for.",
    "Your effort today shapes tomorrow.",
    "Dreams work when you do."
];

    const updateWisdom = () => {
        const wisdomElement = document.getElementById('wisdom-scroll');
        if (wisdomElement) {
            wisdomElement.style.opacity = 0; 
            setTimeout(() => {
                const randomIndex = Math.floor(Math.random() * quotes.length);
                wisdomElement.innerText = `"${quotes[randomIndex]}"`;
                wisdomElement.style.opacity = 1; 
            }, 800);
        }
    };

    setInterval(updateWisdom, 15000);
    
    // Handle Date changes and inputs
    const dateInput = document.getElementById('datePicker');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
        dateInput.addEventListener('change', getDailyData);
    }

    document.addEventListener('input', (e) => {
        if (e.target.id !== 'datePicker') updateDashboard();
    });
    
    getDailyData();
    
  // Event listeners for buttons
    const clearBtn = document.getElementById('clearDataBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to wipe all system data?")) {
                localStorage.clear();
                getDailyData(); 
            }
        });
    }
    
  const masterBtn = document.getElementById('masterAudioBtn');

if (masterBtn) {
    masterBtn.addEventListener('click', () => {
       
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            oscillator = audioCtx.createOscillator();
            gainNode = audioCtx.createGain();
            oscillator.type = 'sine';
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.start();
        }
        
        audioStarted = !audioStarted; 

        if (audioStarted) {
            masterBtn.innerText = "SYSTEM HUM: ONLINE";
            masterBtn.style.background = "#33ff33"; 
            updateDashboard(); 
        } else {
            // Mute the sound
            gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
            masterBtn.innerText = "SYSTEM HUM: OFFLINE";
            masterBtn.style.background = "#ff4444"; // Red for Inactive
        }
    });
}
    
}); 


// --- History Log Logic ---
const getWeeklyHistory = () => {
    const history = [];
    const selectedDateValue = document.getElementById('datePicker').value;
    const baseDate = selectedDateValue ? new Date(selectedDateValue + 'T00:00:00') : new Date();

    for (let i = 6; i >= 0; i--) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
     
        const record = JSON.parse(localStorage.getItem("aura_entry_" + dateStr));
        
        history.push({
            label: dateStr.split('-').slice(1).join('/'), // Formats to MM/DD
            score: record ? record.totalAura : 0
        });
    }
    return history; // The 7-day array of objects
};

const updateAuraChart = () => {
    const ctx = document.getElementById('auraChart');
    if (!ctx) return;
	


    const dataSet = getWeeklyHistory();
    const labels = dataSet.map(d => d.label);
    const scores = dataSet.map(d => d.score);

    if (auraChartInstance) {
        auraChartInstance.destroy(); 
    }

    auraChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Aura',
                data: scores,
                borderColor: '#ffcc00', 
                backgroundColor: 'rgba(255, 204, 0, 0.1)',
                borderWidth: 2,
                tension: 0.4, 
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#888' } },
                x: { grid: { display: false }, ticks: { color: '#888' } }
            }
        }
    });
	
};


