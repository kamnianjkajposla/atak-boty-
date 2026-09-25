const express = require('express');
const mineflayer = require('mineflayer');
const path = require('path');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Lista przechowująca aktywne boty
let activeBots = [];

// Funkcja generująca losową nazwę bota
function generateRandomName() {
    const adjectives = ["Cool", "Fast", "Super", "Dark", "Pro", "Mega", "Epic", "Ninja"];
    const nouns = ["Player", "Gamer", "Shadow", "Ghost", "Knight", "Hunter", "Wolf", "Bot"];
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 900) + 100;
    return `${randomAdj}${randomNoun}${randomNumber}`;
}

// Endpoint HTTP dla Render (żeby widział, że aplikacja żyje)
app.get('/ping', (req, res) => {
    res.status(200).send('Bot Panel is alive!');
});

// Obsługa uruchamiania botów ze strony www
app.post('/start-bots', (req, res) => {
    let count = parseInt(req.body.botCount) || 1;
    
    if (count > 8) count = 8;
    if (count < 1) count = 1;

    stopAllBots();

    const host = req.body.host;
    const port = parseInt(req.body.port) || 25565;

    console.log(`Uruchamianie ${count} botów na serwer: ${host}:${port}`);

    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const botName = generateRandomName();
            
            const bot = mineflayer.createBot({
                host: host,
                port: port,
                username: botName,
                version: false 
            });

            bot.once('spawn', () => {
                console.log(`Bot ${botName} dołączył do gry!`);
                
                setInterval(() => {
                    if (!bot.entity) return;
                    const actions = ['forward', 'back', 'left', 'right'];
                    const randomAction = actions[Math.floor(Math.random() * actions.length)];
                    
                    bot.setControlState(randomAction, true);
                    setTimeout(() => bot.setControlState(randomAction, false), 1000);

                    bot.look(Math.random() * Math.PI * 2, (Math.random() - 0.5) * Math.PI);
                }, 10000);
            });

            bot.on('error', (err) => {
                console.log(`Błąd bota ${botName}:`, err.message);
            });

            bot.on('end', () => {
                console.log(`Bot ${botName} rozłączył się.`);
            });

            activeBots.push(bot);
        }, i * 1500); 
    }

    res.send(`Uruchomiono ${count} botów! Sprawdź konsolę.`);
});

function stopAllBots() {
    activeBots.forEach(bot => {
        try {
            bot.quit();
        } catch (e) {}
    });
    activeBots = [];
}

// Uruchomienie serwera na porcie wskazanym przez Render lub domyślnie 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Panel uruchomiony na porcie ${PORT}`);
});
