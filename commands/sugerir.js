const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { updateGuild } = require('../utils/storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sugerir')
    .setDescription('Envía una sugerencia al canal de sugerencias')
    .addStringOption((option) =>
      option.setName('mensaje').setDescription('Tu sugerencia').setRequired(true).setMaxLength(1000)
    ),

  async execute(interaction) {
    const channelId = process.env.SUGGESTIONS_CHANNEL_ID;
    if (!channelId) {
      return interaction.reply({
        content:
          'No hay un canal de sugerencias configurado. Avisa a un administrador (falta la variable SUGGESTIONS_CHANNEL_ID).',
        ephemeral: true,
      });
    }

    const channel = interaction.guild.channels.cache.get(channelId);
    if (!channel) {
      return interaction.reply({
        content: 'El canal de sugerencias configurado ya no existe. Avisa a un administrador.',
        ephemeral: true,
      });
    }

    const mensaje = interaction.options.getString('mensaje');
    const suggestionId = `${interaction.user.id}-${Date.now()}`;

    updateGuild(interaction.guild.id, (g) => {
      g.suggestions = g.suggestions || {};
      g.suggestions[suggestionId] = { votes: {} };
    });

    const embed = new EmbedBuilder()
      .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
      .setTitle('📩 Nueva sugerencia')
      .setDescription(mensaje)
      .setColor(0x5865f2)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`suggestion_vote|${suggestionId}|w`)
        .setLabel('W (0)')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`suggestion_vote|${suggestionId}|l`)
        .setLabel('L (0)')
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({ embeds: [embed], components: [row] });

    return interaction.reply({ content: '✅ Tu sugerencia ha sido enviada.', ephemeral: true });
  },
};
