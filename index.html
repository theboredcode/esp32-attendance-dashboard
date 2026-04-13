const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// --- 1. THE DATABASE & MEMORY ---
let activeSessions = {};
let attendanceLogs = []; // Stores data for the CSV download

function lookupUser(uid) {
    if (uid === "D3 5F 75 34") return "Vishnuprasad";
    if (uid === "AE CB DE 89") return "Deepasree";
    if (uid === "0E 0D CF 89") return "Seshan";
    return "Unknown User";
}

// --- 2. SERVE THE HTML DASHBOARD ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- 3. LIVE CONNECTION TO THE WEBSITE ---
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

// --- 4. RECEIVE ESP32 SCANS ---
app.post('/api/attendance', (req, res) => {
    const uid = req.body.uid;
    if (!uid) return res.status(400).send("No UID");

    const name = lookupUser(uid);

    // Calculate Indian Standard Time (IST)
    const timeOptions = { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const timeString = new Date().toLocaleTimeString('en-US', timeOptions);

    // Determine Check-in or Check-out
    let action = "Check-In";
    if (activeSessions[uid]) {
        action = "Check-Out";
        delete activeSessions[uid];
    } else if (name !== "Unknown User") {
        activeSessions[uid] = true;
    }

    // Save to the CSV array
    attendanceLogs.push({id: uid, user: name, time: timeString, action: action});

    // Create the data package
    const payload = JSON.stringify({ id: uid, user: name, time: timeString, action: action });
    console.log(`\n🔔 CLOUD PROCESSED: ${payload}`);

    // Broadcast to the website instantly
    clients.forEach(client => client.write(`data: ${payload}\n\n`));

    res.status(200).send("Success");
});

// --- 5. BUTTON ROUTES (Download & Clear) ---
app.get('/download', (req, res) => {
    let csv = "User ID,Full Name,Timestamp,Action\n";
    attendanceLogs.forEach(log => { csv += `${log.id},${log.user},${log.time},${log.action}\n`; });
    res.setHeader('Content-disposition', 'attachment; filename=attendance.csv');
    res.set('Content-Type', 'text/csv');
    res.status(200).send(csv);
});

app.post('/clear', (req, res) => {
    attendanceLogs = [];
    activeSessions = {};
    clients.forEach(client => client.write(`data: {"action": "clear_ui"}\n\n`));
    res.status(200).send("Cleared");
});

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));