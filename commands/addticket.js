const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuild } = require('../utils/storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addticket')
    .setDescription('Da acceso a un usuario a este ticket')
    .addUserOption((option) =>
      option.setName('usuario').setDescription('Usuario al que se le dará acceso al ticket').setRequired(true)
    ),

  async execute(interaction) {
    const guildData = getGuild(interaction.guild.id);
    const ticket = guildData.tickets && guildData.tickets[interaction.channel.id];

    if (!ticket) {
      return interaction.reply({
        content: 'Este comando solo se puede usar dentro de un canal de ticket.',
        ephemeral: true,
      });
    }

    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
    const isCreator = ticket.creatorId === interaction.user.id;

    if (!isAdmin && !isCreator) {
      return interaction.reply({
        content: 'Solo el creador del ticket o un administrador pueden añadir usuarios.',
        ephemeral: true,
      });
    }

    const user = interaction.options.getUser('usuario');

    await interaction.channel.permissionOverwrites.edit(user.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
    });

    return interaction.reply({ content: `✅ ${user} ahora tiene acceso a este ticket.` });
  },
};
