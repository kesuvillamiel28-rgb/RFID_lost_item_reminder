const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000; // Tatakbo ang website sa http://localhost:3000

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Kunwaring Database (Dito muna maiimbak ang mga na-scan na lost items habang umaandar ang server)
let lostItems = [
    { tag_id: "A1B2C3D4", item_name: "Keychain / Susi", status: "Nasa Guidance Office", date_found: "2026-10-09 08:30 AM" },
    { tag_id: "E5F6G7H8", item_name: "Black Wallet", status: "Nasa Security Guard", date_found: "2026-10-09 11:15 AM" }
];

// Map ng RFID UIDs sa mga totoong pangalan ng gamit para sa "Personalized" feature
// PAALALA: Palitan ang mga 'SAMPLE_UID' ng totoong UID ng mga RFID tags ninyo kapag nakuha niyo na
const rfidRegistry = {
    "A1B2C3D4": "Keychain / Susi",
    "E5F6G7H8": "Black Wallet",
    "99AA88BB": "Tumbler / Water Bottle"
};

// 1. WEB PAGE ROUTE: Dito papasok ang mga estudyante/bisita gamit ang PC o Phone
app.get('/', (req, res) => {
    // Ipasa ang listahan ng lost items sa HTML page
    res.render('index', { items: lostItems });
});

// 2. API ROUTE: Dito magpapadala ng HTTP POST request ang ESP32 kapag may na-scan na RFID
app.post('/api/scan', (req, res) => {
    const { tag_id, location } = req.body;
    
    if (!tag_id) {
        return res.status(400).json({ error: "Missing tag_id" });
    }

    console.log(`[IoT Signal] RFID Tag Detected via Wi-Fi: ${tag_id} mula sa ${location}`);

    // Alamin ang pangalan ng gamit base sa RFID Registry, kung wala ay markahang "Unknown Item"
    const itemName = rfidRegistry[tag_id] || "Unknown Item (Hindi pa Rehistrado)";
    const currentTime = new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' });

    // Suriin kung nasa listahan na ba ang item na ito para hindi ma-duplicate
    const existingItemIndex = lostItems.findIndex(item => item.tag_id === tag_id);

    if (existingItemIndex === -1) {
        // Kung wala pa sa listahan, i-store bilang bagong Lost Item
        lostItems.unshift({
            tag_id: tag_id,
            item_name: itemName,
            status: `Nahanap sa ${location}`,
            date_found: currentTime
        });
        console.log(`[Database] Bagong item naidagdag: ${itemName}`);
    } else {
        // Kung nandoon na, i-update na lang ang oras at lokasyon
        lostItems[existingItemIndex].date_found = currentTime;
        lostItems[existingItemIndex].status = `Muling na-scan sa ${location}`;
        console.log(`[Database] Na-update ang status ng: ${itemName}`);
    }

    // Magpadala ng tagumpay na tugon pabalik sa ESP32
    res.status(200).json({ status: "Success", message: "Lost item stored in website dashboard" });
});

// Patakbuhin ang server sa local network
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`[-] Website is ONLINE and running!`);
    console.log(`[-] Sa PC (Localhost): http://localhost:${PORT}`);
    console.log(`[-] Para sa ESP32 at PHONE, gamitin ang iyong IPv4 Address!`);
    console.log(`======================================================\n`);
});
