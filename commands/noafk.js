const { SlashCommandBuilder } = require('discord.js');
const { getGuild, updateGuild } = require('../utils/storage');

module.exports = {
  data: new SlashCommandBuilder().setName('noafk').setDescription('Quita tu estado de AFK'),

  async execute(interaction) {
    const guildData = getGuild(interaction.guild.id);
    if (!guildData.afk || !guildData.afk[interaction.user.id]) {
      return interaction.reply({ content: 'No estabas en modo AFK.', ephemeral: true });
    }

    updateGuild(interaction.guild.id, (g) => {
      if (g.afk) delete g.afk[interaction.user.id];
    });

    return interaction.reply(`✅ ${interaction.user} ya no está AFK.`);
  },
};
