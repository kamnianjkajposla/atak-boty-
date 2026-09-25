const express = require('express');
const mineflayer = require('mineflayer');
const path = require('path');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Lista przechowująca aktywne boty
let activeBots = [];

// Funkcja generująca losową nazwę bota (żeby anty-cheat podejrzanie nie patrzył na ciągi typu "Bot1", "Bot2")
function generateRandomName() {
    const adjectives = ["Cool", "Fast", "Super", "Dark", "Pro", "Mega", "Epic", "Ninja"];
    const nouns = ["Player", "Gamer", "Shadow", "Ghost", "Knight", "Hunter", "Wolf", "Bot"];
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 900) + 100;
    return `${randomAdj}${randomNoun}${randomNumber}`;
}

// Obsługa żądania ze strony www
app.post('/start-bots', (req, res) => {
    let count = parseInt(req.body.botCount) || 1;
    
    // Ograniczenie do max 8 botów zgodnie z Twoją prośbą
    if (count > 8) count = 8;
    if (count < 1) count = 1;

    // Najpierw wyłączamy poprzednie boty, jeśli jakieś działały
    stopAllBots();

    const host = req.body.host;
    const port = parseInt(req.body.port) || 25565;

    console.log(`Uruchamianie ${count} botów na serwer: ${host}:${port}`);

    // Pętla tworząca określoną liczbę botów z losowym opóźnieniem (anty-cheat protection)
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const botName = generateRandomName();
            
            const bot = mineflayer.createBot({
                host: host,
                port: port,
                username: botName,
                // Ukrywanie, że to bot (podawanie wersji, wersja protokołu itp.)
                version: false 
            });

            // Anty-cheat bypass: losowe ruchy co jakiś czas, żeby serwer nie uznał bota za AFK/program
            bot.once('spawn', () => {
                console.log(`Bot ${botName} dołączył do gry!`);
                
                // Co jakiś czas wykonaj losowy ruch, aby oszukać anty-cheat
                setInterval(() => {
                    if (!bot.entity) return;
                    // Losowy skok lub obrót głowy
                    const actions = ['forward', 'back', 'left', 'right'];
                    const randomAction = actions[Math.floor(Math.random() * actions.length)];
                    
                    bot.setControlState(randomAction, true);
                    setTimeout(() => bot.setControlState(randomAction, false), 1000);

                    // Losowy obrót głowy (zapobiega wykryciu sztywnego stania)
                    bot.look(Math.random() * Math.PI * 2, (Math.random() - 0.5) * Math.PI);
                }, 10000); // co 10 sekund
            });

            bot.on('error', (err) => {
                console.log(`Błąd bota ${botName}:`, err.message);
            });

            bot.on('end', () => {
                console.log(`Bot ${botName} rozłączył się.`);
            });

            activeBots.push(bot);
        }, i * 1500); // 1.5 sekundy przerwy między wchodzeniem każdego bota (chroni przed anty-cheatem na spam połączeń)
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

app.listen(3000, () => {
    console.log('Panel uruchomiony! Otwórz w przeglądarce: http://localhost:3000');
});
