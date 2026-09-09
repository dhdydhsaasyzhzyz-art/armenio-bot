const { getGuild } = require('../utils/storage');
const { EmbedBuilder } = require('discord.js');

module.exports = async function guildMemberRemove(member) {
  const guildData = getGuild(member.guild.id);

  const channel =
    (guildData.farewellChannelId && member.guild.channels.cache.get(guildData.farewellChannelId)) ||
    member.guild.systemChannel;

  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle('👋 Hasta pronto')
    .setDescription(`**${member.user.tag}** ha abandonado **${member.guild.name}**. ¡Que te vaya bien!`)
    .setColor(0xed4245)
    .setThumbnail(member.user.displayAvatarURL());

  channel.send({ embeds: [embed] }).catch(() => {});
};
