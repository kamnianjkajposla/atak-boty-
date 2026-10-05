```js
const mineflayer = require("mineflayer");
const net = require("net");
const http = require("http");
const fs = require("fs");

// ==================================================
// USTAWIENIA
// ==================================================

const MC_HOST = "FAIRYMC.aternos.me";
const MC_VERSION = "1.21.5";

const BOT_COUNT = 25;

// Jedno hasło dla botów
const PASSWORD = "FairyBot123";

// Nazwy botów
const BOT_NAMES = [
    "AdamKowalski",
    "PiotrNowak",
    "TomekWrona",
    "KubaLis",
    "MarekZielinski",
    "JanKaczmarek",
    "PawelMazur",
    "MichalWojcik",
    "BartekKrawczyk",
    "DanielSikora",
    "MateuszKrol",
    "FilipWieczorek",
    "KamilPawlak",
    "MarcinDuda",
    "RobertWilk",
    "SzymonJablonski",
    "MaciejKubiak",
    "LukaszAdamczyk",
    "DamianWalczak",
    "PatrykStasiak",
    "KarolSobczak",
    "OskarPietrzak",
    "WojciechUrban",
    "IgorRutkowski",
    "HubertMichalski"
];

// Porty sprawdzane automatycznie
const PORTS = [
    25565,
    25566,
    25567,
    25568,
    25569,
    25570
];

let minecraftPort = null;
const bots = [];

// ==================================================
// ZAPIS REJESTRACJI
// ==================================================

const REGISTER_FILE = "./registered.json";

let registered = {};

function loadRegistered() {
    try {
        if (fs.existsSync(REGISTER_FILE)) {
            registered = JSON.parse(
                fs.readFileSync(
                    REGISTER_FILE,
                    "utf8"
                )
            );
        }
    } catch (error) {
        console.log(
            "Nie można odczytać registered.json."
        );

        registered = {};
    }
}

function saveRegistered() {
    fs.writeFileSync(
        REGISTER_FILE,
        JSON.stringify(
            registered,
            null,
            2
        )
    );
}

loadRegistered();

// ==================================================
// HTTP DLA RENDER
// ==================================================

const WEB_PORT = process.env.PORT || 3000;

const httpServer = http.createServer((req, res) => {

    const online = bots.filter(
        bot => bot && bot.entity
    ).length;

    if (req.url === "/status") {

        res.writeHead(200, {
            "Content-Type":
                "application/json; charset=utf-8"
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
        "Content-Type":
            "text/plain; charset=utf-8"
    });

    res.end(
        "FAIRYMC Bot System\n" +
        "HTTP: ONLINE\n" +
        "Serwer: " + MC_HOST + "\n" +
        "Port: " +
        (minecraftPort || "szukanie...") +
        "\n" +
        "Boty: " +
        online +
        "/" +
        BOT_COUNT +
        "\n"
    );
});

httpServer.listen(
    WEB_PORT,
    "0.0.0.0",
    () => {
        console.log(
            "HTTP działa na porcie " +
            WEB_PORT
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

        socket.connect(
            port,
            host
        );
    });
}

// ==================================================
// ZNAJDOWANIE PORTU
// ==================================================

async function findPort() {

    console.log(
        "Szukam portu Minecraft..."
    );

    for (const port of PORTS) {

        console.log(
            "Sprawdzam " + port + "..."
        );

        const open = await checkPort(
            MC_HOST,
            port
        );

        if (open) {

            console.log(
                "Znaleziono port: " +
                port
            );

            return port;
        }
    }

    return null;
}

// ==================================================
// OPÓŹNIENIE
// ==================================================

function sleep(ms) {
    return new Promise(
        resolve => setTimeout(
            resolve,
            ms
        )
    );
}

// ==================================================
// WYSŁANIE KOMENDY
// ==================================================

async function sendCommand(
    bot,
    command
) {

    try {

        bot.chat(command);

        console.log(
            "[" +
            bot.username +
            "] >> " +
            command
        );

    } catch (error) {

        console.log(
            "[" +
            bot.username +
            "] Nie można wysłać komendy."
        );
    }
}

// ==================================================
// TWORZENIE BOTA
// ==================================================

function createBot(number) {

    const username =
        BOT_NAMES[number - 1];

    if (!username) {
        console.log(
            "Brak nazwy dla bota " +
            number
        );

        return;
    }

    console.log(
        "[" +
        username +
        "] Łączenie..."
    );

    const bot = mineflayer.createBot({

        host: MC_HOST,

        port: minecraftPort,

        username: username,

        version: MC_VERSION
    });

    bots[number - 1] = bot;

    // ==================================================
    // SPAWN
    // ==================================================

    bot.once("spawn", async () => {

        console.log(
            "[" +
            username +
            "] POŁĄCZONY!"
        );

        await sleep(2000);

        // ----------------------------------------------
        // PIERWSZA REJESTRACJA
        // ----------------------------------------------

        if (!registered[username]) {

            console.log(
                "[" +
                username +
                "] Pierwsze logowanie."
            );

            await sendCommand(
                bot,
                "/register " +
                PASSWORD +
                " " +
                PASSWORD
            );

            await sleep(3000);

            registered[username] = true;

            saveRegistered();

            console.log(
                "[" +
                username +
                "] Zapisano rejestrację."
            );

        } else {

            // ------------------------------------------
            // KOLEJNE LOGOWANIE
            // ------------------------------------------

            console.log(
                "[" +
                username +
                "] Logowanie..."
            );

            await sendCommand(
                bot,
                "/login " +
                PASSWORD
            );

            await sleep(3000);
        }

        // ==================================================
        // WIADOMOŚĆ NA CZACIE
        // ==================================================

        await sleep(1000);

        try {

            bot.chat(
                "Cześć! Jestem " +
                username
            );

        } catch {}
    });

    // ==================================================
    // CZAT
    // ==================================================

    bot.on(
        "chat",
        (player, message) => {

            if (
                player ===
                bot.username
            ) {
                return;
            }

            console.log(
                "[" +
                username +
                "] " +
                player +
                ": " +
                message
            );

            // Przykładowe komendy

            if (message === "!ping") {

                bot.chat("Pong!");
            }

            if (message === "!hej") {

                bot.chat(
                    "Hej " +
                    player +
                    "!"
                );
            }
        }
    );

    // ==================================================
    // BŁĄD
    // ==================================================

    bot.on(
        "error",
        error => {

            console.log(
                "[" +
                username +
                "] BŁĄD: " +
                error.message
            );
        }
    );

    // ==================================================
    // KICK
    // ==================================================

    bot.on(
        "kicked",
        reason => {

            console.log(
                "[" +
                username +
                "] KICK:"
            );

            console.log(reason);
        }
    );

    // ==================================================
    // ROZŁĄCZENIE
    // ==================================================

    bot.on(
        "end",
        () => {

            console.log(
                "[" +
                username +
                "] Rozłączony."
            );

            bots[number - 1] = null;

            setTimeout(
                () => {
                    createBot(number);
                },
                10000
            );
        }
    );
}

// ==================================================
// START
// ==================================================

async function start() {

    console.log(
        "================================="
    );

    console.log(
        " FAIRYMC BOT SYSTEM"
    );

    console.log(
        "================================="
    );

    console.log(
        "Host: " + MC_HOST
    );

    console.log(
        "Wersja: " + MC_VERSION
    );

    console.log(
        "Boty: " + BOT_COUNT
    );

    console.log(
        "================================="
    );

    minecraftPort =
        await findPort();

    if (!minecraftPort) {

        console.log(
            "Nie znaleziono portu."
        );

        console.log(
            "Ponawiam za 15 sekund..."
        );

        setTimeout(
            start,
            15000
        );

        return;
    }

    console.log(
        "Port Minecraft: " +
        minecraftPort
    );

    console.log(
        "Uruchamiam boty..."
    );

    for (
        let i = 1;
        i <= BOT_COUNT;
        i++
    ) {

        createBot(i);

        // Odstęp między botami
        await sleep(1500);
    }

    console.log(
        "Wszystkie boty zostały uruchomione."
    );
}

start();
```
