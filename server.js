const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// --- 1. THE DATABASE & MEMORY ---
let activeSessions = {}; // Used just to toggle the visual "Check-In/Out" on the website
let rawLogs = [];        // Keeps every scan for the live web stream
let dailySummary = {};   // Keeps the HR First-In / Last-Out data

function lookupUser(uid) {
    if (uid === "D3 5F 75 34") return "Vishnuprasad";
    if (uid === "AE CB DE 89") return "Deepasree";
    if (uid === "0E 0D CF 89") return "Seshan";
    if (uid === "9E 8C DF 89") return "Guest"; // Your test card
    return "Unknown User";
}

// --- 2. SERVE THE HTML DASHBOARD ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- 3. LIVE CONNECTION TO THE WEBSITE (SSE) ---
let clients = [];
app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    clients.push(res);
    req.on('close', () => {
        clients = clients.filter(client => client !== res);
    });
});

// --- 4. RECEIVE ESP32 SCANS & VERIFY ---
app.post('/api/attendance', (req, res) => {
    const uid = req.body.uid;
    if (!uid) return res.status(400).send("No UID");

    const name = lookupUser(uid);

    // Calculate Indian Standard Time (IST)
    const timeOptions = { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const timeString = new Date().toLocaleTimeString('en-US', timeOptions);
    
    // Short time specifically formatted for the tiny 16x2 LCD
    const shortTime = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });

    // Determine Check-in or Check-out for the visual UI
    let action = "Check-In";
    if (activeSessions[uid]) {
        action = "Check-Out";
        delete activeSessions[uid];
    } else if (name !== "Unknown User") {
        activeSessions[uid] = true;
    }

    // --- HR SUMMARY LOGIC ---
    if (name !== "Unknown User") {
        if (!dailySummary[uid]) {
            dailySummary[uid] = { user: name, firstIn: timeString, lastOut: "Still on shift" };
        } else {
            dailySummary[uid].lastOut = timeString;
        }
    }

    // Save to raw logs for the live website stream
    rawLogs.push({id: uid, user: name, time: timeString, action: action});

    // Broadcast to the website instantly
    const payload = JSON.stringify({ id: uid, user: name, time: timeString, action: action });
    clients.forEach(client => client.write(`data: ${payload}\n\n`));

    // --- REPLY TO ESP32 TERMINAL ---
    if (name === "Unknown User") {
        res.status(200).send("UNVERIFIED");
    } else if (action === "Check-In") {
        res.status(200).send("IN|" + name + "|" + shortTime);
    } else {
        res.status(200).send("OUT|" + name + "|" + shortTime);
    }
});

// --- 5. BUTTON ROUTES (Download Summary & Clear) ---
app.get('/download', (req, res) => {
    let csv = "User ID,Full Name,First In,Last Out\n";
    for (const uid in dailySummary) {
        const data = dailySummary[uid];
        csv += `${uid},${data.user},${data.firstIn},${data.lastOut}\n`;
    }
    
    const dateOptions = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
    const dateString = new Date().toLocaleDateString('en-GB', dateOptions).replace(/\//g, '-');

    res.setHeader('Content-disposition', `attachment; filename=HR_Summary_${dateString}.csv`);
    res.set('Content-Type', 'text/csv');
    res.status(200).send(csv);
});

app.post('/clear', (req, res) => {
    rawLogs = [];
    activeSessions = {};
    dailySummary = {}; 
    clients.forEach(client => client.write(`data: {"action": "clear_ui"}\n\n`));
    res.status(200).send("Cleared");
});

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));