require('dotenv').config();
const http = require('http');
const { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  PermissionFlagsBits,
  MessageFlags
} = require('discord.js');

// --- 1. PROSTY SERWER HTTP DLA RENDERA ---
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot Discord dziala poprawnie (Web Service)!\n');
});

server.listen(PORT, () => {
  console.log(`Serwer HTTP nasłuchuje na porcie ${PORT}`);
});

// --- 2. KLIENT DISCORDA ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

client.once('clientReady', async () => {
  console.log(`Zalogowano jako ${client.user.tag}!`);

  const commands = [
    new SlashCommandBuilder()
      .setName('weryfikacja')
      .setDescription('Tworzy panel weryfikacyjny i konfigurowac uprawnienia kanałów')
      .addRoleOption(option => 
        option.setName('rola')
              .setDescription('Rola nadawana po pomyślnej weryfikacji')
              .setRequired(true)
      )
  ];

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

  try {
    console.log('Rejestrowanie komendy /weryfikacja...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands },
    );
    console.log('Komenda /weryfikacja została pomyślnie zarejestrowana!');
  } catch (error) {
    console.error('Błąd rejestracji komend:', error);
  }
});

// Automatyczne nadawanie roli po dołączeniu
client.on('guildMemberAdd', async (member) => {
  try {
    let unverifiedRole = member.guild.roles.cache.find(r => r.name === 'Niezweryfikowany');

    if (!unverifiedRole) {
      unverifiedRole = await member.guild.roles.create({
        name: 'Niezweryfikowany',
        colors: { primaryColor: 0x999999 },
        reason: 'Automatycznie utworzona rola do weryfikacji'
      });
    }

    await member.roles.add(unverifiedRole);
    console.log(`Nadano rolę @Niezweryfikowany dla: ${member.user.tag}`);
  } catch (error) {
    console.error(`Błąd podczas nadawania roli nowemu graczowi ${member.user.tag}:`, error);
  }
});

client.on('interactionCreate', async interaction => {
  
  if (interaction.isChatInputCommand() && interaction.commandName === 'weryfikacja') {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Nie masz uprawnień Administratora do tej komendy!', flags: MessageFlags.Ephemeral });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guild = interaction.guild;
    const verificationChannel = interaction.channel;
    const targetRole = interaction.options.getRole('rola');

    try {
      let unverifiedRole = guild.roles.cache.find(r => r.name === 'Niezweryfikowany');
      if (!unverifiedRole) {
        unverifiedRole = await guild.roles.create({
          name: 'Niezweryfikowany',
          colors: { primaryColor: 0x999999 },
          reason: 'Automatycznie utworzona rola do weryfikacji'
        });
      }

      const channels = guild.channels.cache.values();
      for (const channel of channels) {
        if (channel.id === verificationChannel.id) {
          await channel.permissionOverwrites.create(unverifiedRole, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true
          });
        } else {
          await channel.permissionOverwrites.create(unverifiedRole, {
            ViewChannel: false,
            SendMessages: false
          });
        }
      }

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`verify_btn_${targetRole.id}`)
            .setLabel('Zweryfikuj się')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅')
        );

      await verificationChannel.send({
        content: '**System Weryfikacji**\nAby uzyskać dostęp do całego serwera, kliknij przycisk poniżej!',
        components: [row]
      });

      await interaction.editReply({ content: `✅ Sukces! Skonfigurowano kanał weryfikacji. Rola docelowa: **${targetRole.name}**.` });

    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: 'Wystąpił błąd. Upewnij się, że bot ma uprawnienia Administratora i najwyższą rolę na liście.' });
    }
  }

  if (interaction.isButton() && interaction.customId.startsWith('verify_btn_')) {
    const roleId = interaction.customId.split('_')[2];
    const guild = interaction.guild;
    const member = interaction.member;

    const targetRole = guild.roles.cache.get(roleId);
    const unverifiedRole = guild.roles.cache.find(r => r.name === 'Niezweryfikowany');

    if (!targetRole) {
      return interaction.reply({ content: 'Błąd: Rola docelowa nie istnieje!', flags: MessageFlags.Ephemeral });
    }

    try {
      await member.roles.add(targetRole);

      if (unverifiedRole && member.roles.cache.has(unverifiedRole.id)) {
        await member.roles.remove(unverifiedRole);
      }

      await interaction.reply({ content: '🎉 Pomyślnie zweryfikowano! Masz teraz dostęp do serwera.', flags: MessageFlags.Ephemeral });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'Wystąpił błąd podczas nadawania roli. Sprawdź pozycję roli bota.', flags: MessageFlags.Ephemeral });
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
