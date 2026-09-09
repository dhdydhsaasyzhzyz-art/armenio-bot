const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuild } = require('../utils/storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deleteuserticket')
    .setDescription('Quita a un usuario del ticket actual')
    .addUserOption((option) =>
      option.setName('usuario').setDescription('Usuario al que se le quitará el acceso').setRequired(true)
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
        content: 'Solo el creador del ticket o un administrador pueden quitar usuarios.',
        ephemeral: true,
      });
    }

    const user = interaction.options.getUser('usuario');

    if (user.id === ticket.creatorId) {
      return interaction.reply({
        content: 'No puedes quitar al creador del ticket. Usa el botón de cerrar si quieres terminar el ticket.',
        ephemeral: true,
      });
    }

    await interaction.channel.permissionOverwrites.delete(user.id).catch(() => {});

    return interaction.reply({ content: `🚫 ${user} ya no tiene acceso a este ticket.` });
  },
};
