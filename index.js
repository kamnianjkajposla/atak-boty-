const express = require('express');
const mineflayer = require('mineflayer');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let activeBots = [];

// ==========================================
// TUTAJ WPISUJESZ SWÓJ SERWER I PORT NA STAŁE
// ==========================================
const TARGET_HOST = "LanarchiaGG.Aternos.Me"; // Zmień na IP swojego serwera
const TARGET_PORT = 25565;                      // Zmień na port, jeśli jest inny niż 25565
// ==========================================

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

// Prosta strona z jednym polem do wpisania liczby botów
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="pl">
        <head>
            <meta charset="UTF-8">
            <title>Panel Botów Minecraft</title>
            <style>
                body { font-family: Arial, sans-serif; background: #1e1e1e; color: #fff; text-align: center; padding-top: 50px; }
                .box { background: #2d2d2d; padding: 20px; border-radius: 8px; display: inline-block; width: 320px; }
                input, button { width: 90%; padding: 10px; margin: 10px 0; border-radius: 5px; border: none; }
                input { background: #3c3c3c; color: #fff; font-size: 16px; text-align: center; }
                button { background: #4CAF50; color: white; font-weight: bold; cursor: pointer; font-size: 16px; }
                button:hover { background: #45a049; }
                .info { font-size: 12px; color: #aaa; margin-top: 5px; }
            </style>
        </head>
        <body>
            <div class="box">
                <h2>Sterowanie Botami</h2>
                <p style="font-size: 13px; color: #ccc;">Serwer: <b>${TARGET_HOST}</b></p>
                <form action="/start-bots" method="POST">
                    <label>Ile osób ma dołączyć?</label>
                    <input type="number" name="botCount" min="1" value="5" required>
                    <div class="info">Boty wejdą, zarejestrują się i zaczną symulować graczy.</div>
                    
                    <button type="submit">Wypuść Boty</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

app.get('/ping', (req, res) => {
    res.status(200).send('Bot Panel is alive!');
});

app.post('/start-bots', (req, res) => {
    let count = parseInt(req.body.botCount) || 1;
    if (count < 1) count = 1;

    stopAllBots();

    console.log(`Uruchamianie ${count} botów na serwer: ${TARGET_HOST}:${TARGET_PORT}`);

    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const botName = generateRandomName();
            const botPassword = generateRandomPassword();
            
            const bot = mineflayer.createBot({
                host: TARGET_HOST,
                port: TARGET_PORT,
                username: botName,
                version: false 
            });

            bot.once('spawn', () => {
                console.log(`Bot ${botName} dołączył do gry. Rejestracja...`);

                // Rejestracja
                setTimeout(() => {
                    bot.chat(`/register ${botPassword} ${botPassword}`);
                }, 1000);

                // Logowanie
                setTimeout(() => {
                    bot.chat(`/login ${botPassword}`);
                    console.log(`Bot ${botName} wysłał komendę logowania.`);
                }, 3000);

                // Ruch i czat (omijanie anty-cheatu)
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
        }, i * 1500); // 1.5 sekundy przerwy między wejściami kolejnych botów
    }

    res.send(`<h2>Uruchomiono ${count} botów!</h2><p>Sprawdź konsolę na Renderze.</p><a href="/">Powrót</a>`);
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
