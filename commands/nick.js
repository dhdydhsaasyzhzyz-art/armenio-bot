const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuild } = require('../utils/storage');
const { computeNicknameForMember } = require('../utils/nickname');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nick')
    .setDescription('Cambia tu apodo (requiere haber comprado Exclusivo+ en la tienda)')
    .addStringOption((option) =>
      option.setName('nombre').setDescription('Nuevo nombre base para tu apodo').setRequired(true).setMaxLength(26)
    ),

  async execute(interaction) {
    const guildData = getGuild(interaction.guild.id);
    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
    const hasExclusivo = Boolean(guildData.economy && guildData.economy[interaction.user.id]?.exclusivo);

    if (!isAdmin && !hasExclusivo) {
      return interaction.reply({
        content: 'Necesitas comprar **Exclusivo+** en `/desktop shop` para poder cambiar tu nombre.',
        ephemeral: true,
      });
    }

    const nuevoNombre = interaction.options.getString('nombre');
    const finalNick = computeNicknameForMember(interaction.member, guildData, nuevoNombre);

    try {
      await interaction.member.setNickname(finalNick);
    } catch (err) {
      return interaction.reply({
        content: 'No he podido cambiarte el apodo (puede que tu rol esté por encima del mío).',
        ephemeral: true,
      });
    }

    return interaction.reply({ content: `✅ Tu apodo ahora es **${finalNick}**.`, ephemeral: true });
  },
};
