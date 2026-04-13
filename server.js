const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // Render will assign a port automatically

app.use(express.json());
app.use(cors());

// Serve the HTML dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API Route for ESP32 scans
app.post('/api/attendance', (req, res) => {
    const scannedID = req.body.uid;
    console.log(`\n🔔 SCAN RECEIVED: ${scannedID}`);
    res.status(200).send("Data received successfully!");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});