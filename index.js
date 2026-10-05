```js
const mineflayer = require("mineflayer");
const net = require("net");
const http = require("http");

// ==================================================
// USTAWIENIA MINECRAFT
// ==================================================

const MC_HOST = "FAIRYMC.aternos.me";
const MC_VERSION = "1.21.5";

const BOT_COUNT = 20;

// Porty do sprawdzenia
const PORTS = [
    25565,
    25566,
    25567,
    25568,
    25569,
    25570
];

// ==================================================
// HTTP DLA RENDER
// ==================================================

const WEB_PORT = process.env.PORT || 3000;

let minecraftPort = null;
let bots = [];

const httpServer = http.createServer((req, res) => {

    if (req.url === "/status") {

        const online = bots.filter(
            bot => bot && bot.entity
        ).length;

        res.writeHead(200, {
            "Content-Type": "application/json; charset=utf-8"
        });

        res.end(JSON.stringify({
            status: "online",
            server: MC_HOST,
            port: minecraftPort,
            botsOnline: online,
            botsTotal: BOT_COUNT
        }, null, 2));

        return;
    }

    res.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8"
    });

    res.end(
        "FAIRYMC Minecraft Bot System\n" +
        "HTTP: ONLINE\n" +
        `Serwer: ${MC_HOST}\n` +
        `Port: ${minecraftPort || "szukanie..."}\n` +
        `Boty: ${bots.filter(b => b && b.entity).length}/${BOT_COUNT}\n`
    );
});

httpServer.listen(
    WEB_PORT,
    "0.0.0.0",
    () => {
        console.log(
            `HTTP działa na porcie ${WEB_PORT}`
        );
    }
);

// ==================================================
// SPRAWDZANIE PORTU
// ==================================================

function checkPort(host, port) {

    return new Promise(resolve => {

        const socket = new net.Socket();

        let finished = false;

        function finish(result) {

            if (finished) return;

            finished = true;

            socket.destroy();

            resolve(result);
        }

        socket.setTimeout(2000);

        socket.once("connect", () => {
            finish(true);
        });

        socket.once("timeout", () => {
            finish(false);
        });

        socket.once("error", () => {
            finish(false);
        });

        socket.connect(port, host);
    });
}

// ==================================================
// SZUKANIE PORTU
// ==================================================

async function findPort() {

    console.log("");
    console.log("=================================");
    console.log(" SZUKANIE PORTU MINECRAFT");
    console.log("=================================");
    console.log(`Serwer: ${MC_HOST}`);

    for (const port of PORTS) {

        console.log(
            `Sprawdzam port ${port}...`
        );

        const result = await checkPort(
            MC_HOST,
            port
        );

        if (result) {

            console.log(
                `Znaleziono otwarty port: ${port}`
            );

            return port;
        }
    }

    return null;
}

// ==================================================
// TWORZENIE BOTA
// ==================================================

function createBot(number) {

    const username = `FairyBot_${number}`;

    console.log(
        `[${username}] Łączenie...`
    );

    const bot = mineflayer.createBot({
        host: MC_HOST,
        port: minecraftPort,
        username: username,
        version: MC_VERSION
    });

    bots[number - 1] = bot;

    // ==============================================
    // POŁĄCZENIE
    // ==============================================

    bot.once("spawn", () => {

        console.log(
            `[${username}] POŁĄCZONY!`
        );

        setTimeout(() => {

            try {
                bot.chat(
                    `FairyBot ${number} online!`
                );
            } catch {}
            
        }, 1000);
    });

    // ==============================================
    // CHAT
    // ==============================================

    bot.on("chat", (player, message) => {

        if (player === bot.username) {
            return;
        }

        console.log(
            `[${username}] ${player}: ${message}`
        );

        if (message === "!ping") {

            bot.chat("Pong!");
        }

        if (message === "!hej") {

            bot.chat(
                `Hej ${player}!`
            );
        }
    });

    // ==============================================
    // BŁĄD
    // ==============================================

    bot.on("error", error => {

        console.log(
            `[${username}] BŁĄD: ${error.message}`
        );
    });

    // ==============================================
    // KICK
    // ==============================================

    bot.on("kicked", reason => {

        console.log(
            `[${username}] KICK:`
        );

        console.log(reason);
    });

    // ==============================================
    // ROZŁĄCZENIE
    // ==============================================

    bot.on("end", () => {

        console.log(
            `[${username}] Rozłączony.`
        );

        bots[number - 1] = null;

        console.log(
            `[${username}] Reconnect za 10 sekund...`
        );

        setTimeout(() => {

            createBot(number);

        }, 10000);
    });

    return bot;
}

// ==================================================
// START
// ==================================================

async function start() {

    console.log("");
    console.log("=================================");
    console.log(" FAIRYMC BOT SYSTEM");
    console.log("=================================");
    console.log(`Host: ${MC_HOST}`);
    console.log(`Wersja: ${MC_VERSION}`);
    console.log(`Liczba botów: ${BOT_COUNT}`);
    console.log("=================================");

    minecraftPort = await findPort();

    if (!minecraftPort) {

        console.log("");
        console.log(
            "Nie znaleziono otwartego portu."
        );

        console.log(
            "Czy serwer Aternos jest uruchomiony?"
        );

        console.log(
            "Ponawiam za 15 sekund..."
        );

        setTimeout(start, 15000);

        return;
    }

    console.log("");
    console.log(
        `Minecraft: ${MC_HOST}:${minecraftPort}`
    );

    console.log(
        `Uruchamiam ${BOT_COUNT} botów...`
    );

    console.log("");

    // ==============================================
    // URUCHAMIANIE 20 BOTÓW
    // ==============================================

    for (let i = 1; i <= BOT_COUNT; i++) {

        createBot(i);

        // 1 sekunda odstępu
        await new Promise(resolve => {
            setTimeout(resolve, 1000);
        });
    }

    console.log("");
    console.log("=================================");
    console.log(" WSZYSTKIE BOTY URUCHOMIONE");
    console.log("=================================");
}

start();
```

