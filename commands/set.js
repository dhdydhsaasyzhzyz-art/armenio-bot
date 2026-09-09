const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { updateGuild } = require('../utils/storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set')
    .setDescription('Configuraciones varias del servidor')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub.setName('risa').setDescription('Convierte este canal en uno de solo enlaces, fotos o vídeos')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'risa') {
      updateGuild(interaction.guild.id, (g) => {
        g.laughChannelId = interaction.channel.id;
      });

      return interaction.reply(
        '😂 A partir de ahora este canal solo admite mensajes con enlaces, fotos o vídeos. Los mensajes de solo texto se borrarán automáticamente.'
      );
    }
  },
};
