const { SlashCommandBuilder } = require('discord.js');
const { getGuild, updateGuild } = require('../utils/storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dardinero')
    .setDescription('Le da dinero a otro usuario')
    .addUserOption((option) =>
      option.setName('persona').setDescription('A quién le das el dinero').setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName('cantidad').setDescription('Cuánto dinero le das').setRequired(true).setMinValue(1)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('persona');
    const amount = interaction.options.getInteger('cantidad');

    if (target.id === interaction.user.id) {
      return interaction.reply({ content: 'No puedes darte dinero a ti mismo.', ephemeral: true });
    }
    if (target.bot) {
      return interaction.reply({ content: 'No le puedes dar dinero a un bot.', ephemeral: true });
    }

    const guildData = getGuild(interaction.guild.id);
    const senderBalance = (guildData.economy && guildData.economy[interaction.user.id]?.balance) || 0;

    if (senderBalance < amount) {
      return interaction.reply({
        content: `No tienes suficiente dinero. Tienes **${senderBalance}$**.`,
        ephemeral: true,
      });
    }

    updateGuild(interaction.guild.id, (g) => {
      g.economy = g.economy || {};
      g.economy[interaction.user.id] = g.economy[interaction.user.id] || {
        balance: 0,
        messageCount: 0,
        exclusivo: false,
      };
      g.economy[target.id] = g.economy[target.id] || { balance: 0, messageCount: 0, exclusivo: false };

      g.economy[interaction.user.id].balance -= amount;
      g.economy[target.id].balance += amount;
    });

    return interaction.reply(`💸 ${interaction.user} le ha dado **${amount}$** a ${target}.`);
  },
};
