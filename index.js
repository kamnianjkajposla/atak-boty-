const express = require('express');
const mineflayer = require('mineflayer');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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

// Funkcja generująca losowe hasło dla bota
function generateRandomPassword() {
    return "Pass" + Math.floor(Math.random() * 900000 + 100000) + "!";
}

// Losowe wiadomości na czacie
function getRandomChatText() {
    const messages = [
        "siema wszystkim!",
        "fajny serwer",
        "gdzie jest admin?",
        "nudzę się",
        "kto gra w przetrwanie?",
        "ale tu ładnie",
        "cześć",
        "idę kopać diamenty"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}

// Strona główna z wbudowanym panelem HTML w jednym pliku
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="pl">
        <head>
            <meta charset="UTF-8">
            <title>Panel Sterowania Botami Minecraft</title>
            <style>
                body { font-family: Arial, sans-serif; background: #1e1e1e; color: #fff; text-align: center; padding-top: 50px; }
                .box { background: #2d2d2d; padding: 20px; border-radius: 8px; display: inline-block; width: 320px; }
                input, button { width: 90%; padding: 10px; margin: 10px 0; border-radius: 5px; border: none; }
                input { background: #3c3c3c; color: #fff; }
                button { background: #4CAF50; color: white; font-weight: bold; cursor: pointer; }
                button:hover { background: #45a049; }
                .info { font-size: 12px; color: #aaa; margin-top: 5px; }
            </style>
        </head>
        <body>
            <div class="box">
                <h2>Panel Botów (Wszystko w 1 pliku)</h2>
                <form action="/start-bots" method="POST">
                    <label>IP Serwera:</label>
                    <input type="text" name="host" value="localhost" required>
                    
                    <label>Port Serwera:</label>
                    <input type="number" name="port" value="25565" required>
                    
                    <label>Liczba botów:</label>
                    <input type="number" name="botCount" min="1" value="3" required>
                    <div class="info">Boty automatycznie się zarejestrują, zalogują i będą pisać na czacie.</div>
                    
                    <button type="submit">Wypuść Boty na Serwer</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// Endpoint ping dla Renderu
app.get('/ping', (req, res) => {
    res.status(200).send('Bot Panel is alive!');
});

// Obsługa uruchamiania botów
app.post('/start-bots', (req, res) => {
    let count = parseInt(req.body.botCount) || 1;
    if (count < 1) count = 1;

    stopAllBots();

    const host = req.body.host;
    const port = parseInt(req.body.port) || 25565;

    console.log(`Uruchamianie ${count} botów na serwer: ${host}:${port}`);

    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const botName = generateRandomName();
            const botPassword = generateRandomPassword();
            
            const bot = mineflayer.createBot({
                host: host,
                port: port,
                username: botName,
                version: false 
            });

            bot.once('spawn', () => {
                console.log(`Bot ${botName} dołączył do gry. Rejestracja...`);

                // 1. Rejestracja
                setTimeout(() => {
                    bot.chat(`/register ${botPassword} ${botPassword}`);
                }, 1000);

                // 2. Logowanie
                setTimeout(() => {
                    bot.chat(`/login ${botPassword}`);
                    console.log(`Bot ${botName} wysłał komendę logowania.`);
                }, 3000);

                // Anty-cheat bypass + losowy czat
                setInterval(() => {
                    if (!bot.entity) return;
                    
                    const actions = ['forward', 'back', 'left', 'right'];
                    const randomAction = actions[Math.floor(Math.random() * actions.length)];
                    bot.setControlState(randomAction, true);
                    setTimeout(() => bot.setControlState(randomAction, false), 1000);
                    bot.look(Math.random() * Math.PI * 2, (Math.random() - 0.5) * Math.PI);

                    if (Math.random() < 0.3) {
                        bot.chat(getRandomChatText());
                    }
                }, 12000);
            });

            bot.on('error', (err) => {
                console.log(`Błąd bota ${botName}:`, err.message);
            });

            bot.on('end', () => {
                console.log(`Bot ${botName} rozłączył się.`);
            });

            activeBots.push(bot);
        }, i * 1000); 
    }

    res.send(`<h2>Uruchomiono ${count} botów!</h2><p>Sprawdź konsolę serwera.</p><a href="/">Powrót</a>`);
});

function stopAllBots() {
    activeBots.forEach(bot => {
        try {
            bot.quit();
        } catch (e) {}
    });
    activeBots = [];
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Panel uruchomiony na porcie ${PORT}`);
});
