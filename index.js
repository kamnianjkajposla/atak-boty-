const express = require('express');
const mineflayer = require('mineflayer');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let activeBots = [];

// ==========================================
// TUTAJ WPISUJESZ TYLKO ADRES IP SWOJEGO SERWERA
// Port i wersja zostaną wykryte automatycznie!
// ==========================================
const TARGET_HOST = "LanarchiaGG.Aternos.Me"; 
// ==========================================

// Funkcja generująca losową nazwę bota
function generateRandomName() {
    const adjectives = ["Cool", "Fast", "Super", "Dark", "Pro", "Mega", "Epic", "Ninja", "Fast", "Alex"];
    const nouns = ["Player", "Gamer", "Shadow", "Ghost", "Knight", "Hunter", "Wolf", "Bot", "Steve", "Noob"];
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 9000) + 1000;
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
        "idę kopać diamenty",
        "ale lagi",
        "kto pomogę zbudować dom?"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}

// Strona główna z domyślną wartością 100 botów
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="pl">
        <head>
            <meta charset="UTF-8">
            <title>Panel 100 Botów Minecraft</title>
            <style>
                body { font-family: Arial, sans-serif; background: #1e1e1e; color: #fff; text-align: center; padding-top: 50px; }
                .box { background: #2d2d2d; padding: 25px; border-radius: 8px; display: inline-block; width: 340px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
                input, button { width: 90%; padding: 12px; margin: 10px 0; border-radius: 5px; border: none; }
                input { background: #3c3c3c; color: #fff; font-size: 18px; text-align: center; font-weight: bold; }
                button { background: #E53935; color: white; font-weight: bold; cursor: pointer; font-size: 16px; }
                button:hover { background: #C62828; }
                .info { font-size: 12px; color: #aaa; margin-top: 8px; line-height: 1.4; }
            </style>
        </head>
        <body>
            <div class="box">
                <h2>Masowe Wprowadzanie Botów</h2>
                <p style="font-size: 13px; color: #4CAF50;">Serwer: <b>${TARGET_HOST}</b></p>
                <form action="/start-bots" method="POST">
                    <label>Liczba botów do wysłania:</label>
                    <input type="number" name="botCount" min="1" value="100" required>
                    <div class="info">Port i wersja serwera wykryją się same. Boty wejdą, zarejestrują się i zaczną symulować graczy.</div>
                    
                    <button type="submit">Wypuść 100 Botów!</button>
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
    let count = parseInt(req.body.botCount) || 100;
    if (count < 1) count = 1;

    stopAllBots();

    console.log(`Rozpoczynam wysyłanie ${count} botów na serwer: ${TARGET_HOST} (port i wersja wykrywane automatycznie)`);

    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const botName = generateRandomName();
            const botPassword = generateRandomPassword();
            
            // Brak jawnego portu i wersji - Mineflayer sam je wykryje i zgadnie!
            const bot = mineflayer.createBot({
                host: TARGET_HOST,
                username: botName,
                version: false 
            });

            bot.once('spawn', () => {
                console.log(`Bot ${botName} dołączył do gry. Rejestracja...`);

                // Automatyczna rejestracja
                setTimeout(() => {
                    bot.chat(`/register ${botPassword} ${botPassword}`);
                }, 1500);

                // Automatyczne logowanie
                setTimeout(() => {
                    bot.chat(`/login ${botPassword}`);
                }, 3500);

                // Ruch i czat (omijanie anty-cheatu i kicków za AFK)
                setInterval(() => {
                    if (!bot.entity) return;
                    
                    const actions = ['forward', 'back', 'left', 'right'];
                    const randomAction = actions[Math.floor(Math.random() * actions.length)];
                    bot.setControlState(randomAction, true);
                    setTimeout(() => bot.setControlState(randomAction, false), 1000);
                    bot.look(Math.random() * Math.PI * 2, (Math.random() - 0.5) * Math.PI);

                    if (Math.random() < 0.25) {
                        bot.chat(getRandomChatText());
                    }
                }, 15000);
            });

            bot.on('error', (err) => {
                // Ukrywamy pomniejsze błędy połączeń, żeby nie zasmiecać konsoli przy 100 botach
                console.log(`Błąd bota ${botName}:`, err.message);
            });

            bot.on('end', () => {
                // Bot rozłączony
            });

            activeBots.push(bot);
        }, i * 800); // Odstęp 0.8 sekundy między botami, żeby nie przyciąć serwera natychmiastowym spamem
    }

    res.send(`<h2>Wysłano ${count} botów!</h2><p>Sprawdź konsolę na Renderze oraz serwer Minecraft.</p><a href="/">Powrót do panelu</a>`);
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
