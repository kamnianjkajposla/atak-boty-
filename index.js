const { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  PermissionFlagsBits 
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers // Wymagane do wykrywania nowych członków!
  ]
});

client.once('ready', async () => {
  console.log(`Zalogowano jako ${client.user.tag}!`);

  // Rejestracja komendy slash /weryfikacja
  const commands = [
    new SlashCommandBuilder()
      .setName('weryfikacja')
      .setDescription('Tworzy panel weryfikacyjny i konfiguruje uprawnienia kanałów')
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
    console.error(error);
  }
});

// 1. AUTOMATYCZNE NADAWANIE ROLI @Niezweryfikowany PO DOŁĄCZENIU
client.on('guildMemberAdd', async (member) => {
  try {
    // Szukamy roli @Niezweryfikowany na serwerze
    let unverifiedRole = member.guild.roles.cache.find(r => r.name === 'Niezweryfikowany');

    // Jeśli rola nie istnieje, bot sam ją stworzy
    if (!unverifiedRole) {
      unverifiedRole = await member.guild.roles.create({
        name: 'Niezweryfikowany',
        color: '#999999',
        reason: 'Automatycznie utworzona rola do weryfikacji'
      });
    }

    // Nadajemy rolę nowemu graczowi
    await member.roles.add(unverifiedRole);
    console.log(`Nadano rolę @Niezweryfikowany dla: ${member.user.tag}`);

  } catch (error) {
    console.error(`Błąd podczas nadawania roli nowemu graczowi ${member.user.tag}:`, error);
  }
});

// 2. OBSŁUGA INTERAKCJI (KOMENDA I PRZYCISK)
client.on('interactionCreate', async interaction => {
  
  // A. Konfiguracja komendą /weryfikacja
  if (interaction.isChatInputCommand() && interaction.commandName === 'weryfikacja') {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Nie masz uprawnień Administratora do tej komendy!', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const verificationChannel = interaction.channel;
    const targetRole = interaction.options.getRole('rola');

    try {
      // Znajdź lub stwórz rolę @Niezweryfikowany
      let unverifiedRole = guild.roles.cache.find(r => r.name === 'Niezweryfikowany');
      if (!unverifiedRole) {
        unverifiedRole = await guild.roles.create({
          name: 'Niezweryfikowany',
          color: '#999999',
          reason: 'Automatycznie utworzona rola do weryfikacji'
        });
      }

      // Ukryj i zablokuj wszystkie kanały, oprócz tego wybranego
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

      // Wyślij wiadomość z przyciskiem do weryfikacji
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

      await interaction.editReply({ content: `✅ Pomyślnie skonfigurowano! Utworzono rolę @Niezweryfikowany (będzie nadawana nowym graczom), zablokowano inne kanały. Rola po weryfikacji: **${targetRole.name}**.` });

    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: 'Wystąpił błąd podczas konfiguracji uprawnień. Upewnij się, że bot ma role wyżej niż użytkownicy oraz ma uprawnienia Administratora!' });
    }
  }

  // B. Kliknięcie przycisku "Zweryfikuj się"
  if (interaction.isButton() && interaction.customId.startsWith('verify_btn_')) {
    const roleId = interaction.customId.split('_')[2];
    const guild = interaction.guild;
    const member = interaction.member;

    const targetRole = guild.roles.cache.get(roleId);
    const unverifiedRole = guild.roles.cache.find(r => r.name === 'Niezweryfikowany');

    if (!targetRole) {
      return interaction.reply({ content: 'Błąd: Docelowa rola weryfikacji nie istnieje!', ephemeral: true });
    }

    try {
      // Nadaj rolę docelową (np. Zweryfikowany)
      await member.roles.add(targetRole);

      // Zabierz rolę Niezweryfikowany
      if (unverifiedRole && member.roles.cache.has(unverifiedRole.id)) {
        await member.roles.remove(unverifiedRole);
      }

      await interaction.reply({ content: '🎉 Pomyślnie zweryfikowano! Odblokowano dostęp do pozostałych kanałów.', ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'Wystąpił błąd podczas nadawania roli. Sprawdź uprawnienia bota.', ephemeral: true });
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
