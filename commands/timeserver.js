const { SlashCommandBuilder } = require('discord.js');
const { formatDuration } = require('../utils/time');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeserver')
    .setDescription('Muestra cuánto tiempo llevas en el servidor'),

  async execute(interaction) {
    const joinedAt = interaction.member.joinedAt;
    if (!joinedAt) {
      return interaction.reply({ content: 'No he podido calcular tu fecha de entrada.', ephemeral: true });
    }

    const ms = Date.now() - joinedAt.getTime();
    const texto = formatDuration(ms);

    return interaction.reply(
      `🕐 ${interaction.user} lleva **${texto}** en el servidor (entró <t:${Math.floor(
        joinedAt.getTime() / 1000
      )}:D>).`
    );
  },
};
