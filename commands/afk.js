const { SlashCommandBuilder } = require('discord.js');
const { updateGuild } = require('../utils/storage');
const { parseDuration } = require('../utils/time');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Te marca como AFK para avisar a quien te mencione')
    .addStringOption((option) =>
      option.setName('razon').setDescription('Motivo por el que estás AFK').setRequired(true).setMaxLength(200)
    )
    .addStringOption((option) =>
      option
        .setName('tiempo')
        .setDescription('Duración del AFK, ej: 30m, 2h, 1d (opcional, si no se pone es indefinido)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const razon = interaction.options.getString('razon');
    const tiempoStr = interaction.options.getString('tiempo');

    let until = null;
    if (tiempoStr) {
      const ms = parseDuration(tiempoStr);
      if (!ms) {
        return interaction.reply({
          content: 'No entendí ese tiempo. Usa un formato como `30m`, `2h` o `1d`.',
          ephemeral: true,
        });
      }
      until = Date.now() + ms;
    }

    updateGuild(interaction.guild.id, (g) => {
      g.afk = g.afk || {};
      g.afk[interaction.user.id] = { reason: razon, since: Date.now(), until };
    });

    return interaction.reply(
      `💤 ${interaction.user} está ahora AFK: **${razon}**${
        until ? ` (vuelve <t:${Math.floor(until / 1000)}:R>)` : ''
      }`
    );
  },
};
