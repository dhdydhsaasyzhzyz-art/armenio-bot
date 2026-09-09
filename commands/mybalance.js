const { SlashCommandBuilder } = require('discord.js');
const { getGuild } = require('../utils/storage');

module.exports = {
  data: new SlashCommandBuilder().setName('mybalance').setDescription('Muestra cuánto dinero tienes'),

  async execute(interaction) {
    const guildData = getGuild(interaction.guild.id);
    const balance = (guildData.economy && guildData.economy[interaction.user.id]?.balance) || 0;

    return interaction.reply(`💰 ${interaction.user} tiene **${balance}$**.`);
  },
};
