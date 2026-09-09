const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} = require('discord.js');
const { getGuild, updateGuild } = require('../utils/storage');
const { createDraft, renderBuilderUI } = require('../utils/ticketBuilder');

const VIP_ROLE_ID = '1546163647984963664'; // ID fijo del rol Vip+ que se desbloquea en la tienda

module.exports = {
  data: new SlashCommandBuilder()
    .setName('desktop')
    .setDescription('Comandos de administración del servidor')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName('verification')
        .setDescription('Envía un panel de verificación en este canal')
        .addRoleOption((option) =>
          option
            .setName('rol')
            .setDescription('Rol que se dará al usuario al verificarse')
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('ticket')
        .setDescription('Crea un panel de tickets personalizado en este canal')
    )
    .addSubcommand((sub) =>
      sub.setName('shop').setDescription('Muestra la tienda del servidor')
    )
    .addSubcommand((sub) =>
      sub
        .setName('welcome')
        .setDescription('Configura el canal de mensajes de bienvenida')
        .addChannelOption((option) =>
          option
            .setName('canal')
            .setDescription('Canal donde se enviarán los mensajes de bienvenida')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('despedida')
        .setDescription('Configura el canal de mensajes de despedida')
        .addChannelOption((option) =>
          option
            .setName('canal')
            .setDescription('Canal donde se enviarán los mensajes de despedida')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('boost')
        .setDescription('Configura el canal donde se anuncian los boosts del servidor')
        .addChannelOption((option) =>
          option
            .setName('canal')
            .setDescription('Canal donde se anunciarán los boosts')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('twitch')
        .setDescription('Anuncia que estás en directo en Twitch')
        .addStringOption((option) =>
          option.setName('titulo').setDescription('Título del directo').setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName('tiktok').setDescription('Anuncia que has subido un nuevo TikTok')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'verification') {
      await handleVerification(interaction);
      return;
    }

    if (sub === 'ticket') {
      await handleTicketBuilderStart(interaction);
      return;
    }

    if (sub === 'shop') {
      await handleShop(interaction);
      return;
    }

    if (sub === 'welcome') {
      await handleWelcomeConfig(interaction);
      return;
    }

    if (sub === 'despedida') {
      await handleFarewellConfig(interaction);
      return;
    }

    if (sub === 'boost') {
      await handleBoostConfig(interaction);
      return;
    }

    if (sub === 'twitch') {
      await handleTwitchAnnounce(interaction);
      return;
    }

    if (sub === 'tiktok') {
      await handleTiktokAnnounce(interaction);
      return;
    }
  },
};

async function handleVerification(interaction) {
  const role = interaction.options.getRole('rol');
  const botMember = await interaction.guild.members.fetchMe();

  if (role.position >= botMember.roles.highest.position) {
    return interaction.reply({
      content:
        'Mi rol debe estar por encima del rol de verificación. Sube mi rol en la lista de roles del servidor y vuelve a intentarlo.',
      ephemeral: true,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle('Verificación')
    .setDescription('Pulsa el botón para verificarte y obtener acceso al resto del servidor.')
    .setColor(0x5865f2);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`verify_button|${role.id}`)
      .setLabel('Verificar')
      .setStyle(ButtonStyle.Success)
  );

  await interaction.channel.send({ embeds: [embed], components: [row] });
  return interaction.reply({ content: '✅ Panel de verificación enviado.', ephemeral: true });
}

async function handleTicketBuilderStart(interaction) {
  const draft = createDraft(interaction.user.id);
  await interaction.reply({ ...renderBuilderUI(draft), ephemeral: true });
}

// Crea (si no existe ya) el canal donde los usuarios pueden enviar mensajes
// para ganar dinero de la tienda.
async function ensureSpamChannel(guild) {
  const guildData = getGuild(guild.id);
  if (guildData.spamChannelId && guild.channels.cache.has(guildData.spamChannelId)) return;

  const channel = await guild.channels.create({
    name: 'gana-dinero',
    type: ChannelType.GuildText,
    topic: 'Envía mensajes aquí para ganar dinero en la tienda del servidor.',
  });

  updateGuild(guild.id, (g) => {
    g.spamChannelId = channel.id;
  });

  await channel
    .send(
      '💬 Envía mensajes aquí para ganar dinero. Cuantos más mensajes envíes, más dinero acumulas — úsalo en `/desktop shop`.'
    )
    .catch(() => {});
}

async function handleShop(interaction) {
  await ensureSpamChannel(interaction.guild);

  const guildData = getGuild(interaction.guild.id);
  const entry = (guildData.economy && guildData.economy[interaction.user.id]) || { balance: 0 };

  const embed = new EmbedBuilder()
    .setTitle('🛒 Tienda del servidor')
    .setDescription(
      `💵 Tu saldo actual: **${entry.balance}$**\n\n` +
        '**Exclusivo+** — `570$`\nDesbloquea el permiso para cambiar tu propio apodo con `/nick`.\n\n' +
        `**Vip+** — \`1000$\`\nDesbloquea el rol <@&${VIP_ROLE_ID}>.\n\n` +
        '**Rol personalizado** — `250$`\nCrea tu propio rol con el nombre y color que elijas.'
    )
    .setColor(0xf1c40f)
    .setFooter({ text: 'Gana dinero enviando mensajes en el canal de farmeo.' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('shop_buy|exclusivo').setLabel('Exclusivo+ (570$)').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('shop_buy|vipplus').setLabel('Vip+ (1000$)').setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('shop_buy|customrole')
      .setLabel('Rol personalizado (250$)')
      .setStyle(ButtonStyle.Success)
  );

  await interaction.reply({ embeds: [embed], components: [row] });
}

async function handleWelcomeConfig(interaction) {
  const channel = interaction.options.getChannel('canal');

  updateGuild(interaction.guild.id, (g) => {
    g.welcomeChannelId = channel.id;
  });

  return interaction.reply({
    content: `✅ A partir de ahora los mensajes de bienvenida se enviarán en ${channel}.`,
    ephemeral: true,
  });
}

async function handleFarewellConfig(interaction) {
  const channel = interaction.options.getChannel('canal');

  updateGuild(interaction.guild.id, (g) => {
    g.farewellChannelId = channel.id;
  });

  return interaction.reply({
    content: `✅ A partir de ahora los mensajes de despedida se enviarán en ${channel}.`,
    ephemeral: true,
  });
}

async function handleBoostConfig(interaction) {
  const channel = interaction.options.getChannel('canal');

  updateGuild(interaction.guild.id, (g) => {
    g.boosterChannelId = channel.id;
  });

  return interaction.reply({
    content: `✅ A partir de ahora los boosts se anunciarán en ${channel}.`,
    ephemeral: true,
  });
}

async function handleTwitchAnnounce(interaction) {
  const link = process.env.TWITCH_URL;
  if (!link) {
    return interaction.reply({
      content: 'Falta configurar la variable de entorno TWITCH_URL con el enlace de tu canal de Twitch.',
      ephemeral: true,
    });
  }

  const titulo = interaction.options.getString('titulo');

  await interaction.channel.send({
    content: `BUENAS @everyone ESTAMOS EN DIRECTO, ÚNANSE "${titulo}"\n${link}`,
    allowedMentions: { parse: ['everyone'] },
  });

  return interaction.reply({ content: '✅ Anuncio de directo enviado.', ephemeral: true });
}

async function handleTiktokAnnounce(interaction) {
  const link = process.env.TIKTOK_URL;
  if (!link) {
    return interaction.reply({
      content: 'Falta configurar la variable de entorno TIKTOK_URL con el enlace de tu cuenta de TikTok.',
      ephemeral: true,
    });
  }

  await interaction.channel.send({
    content: `BUENAS @everyone ACABAMOS DE SUBIR TIKTOKASO, VAYAN A VERLO Y SEAN LOS PRIMEROS!!\n${link}`,
    allowedMentions: { parse: ['everyone'] },
  });

  return interaction.reply({ content: '✅ Anuncio de TikTok enviado.', ephemeral: true });
}
