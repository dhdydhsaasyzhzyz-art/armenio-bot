const { getGuild } = require('../utils/storage');
const { EmbedBuilder } = require('discord.js');

module.exports = async function guildMemberAdd(member) {
  const guildData = getGuild(member.guild.id);

  // Autorole (comportamiento ya existente, sin cambios)
  if (guildData.autoroleId) {
    const role = member.guild.roles.cache.get(guildData.autoroleId);
    if (role) {
      try {
        await member.roles.add(role);
      } catch (err) {
        console.error(`No se pudo asignar el autorole a ${member.user.tag}:`, err.message);
      }
    }
  }

  // Mensaje de bienvenida (nuevo)
  const channel =
    (guildData.welcomeChannelId && member.guild.channels.cache.get(guildData.welcomeChannelId)) ||
    member.guild.systemChannel;

  if (channel) {
    const embed = new EmbedBuilder()
      .setTitle('🎉 ¡Bienvenido!')
      .setDescription(`${member} te damos la bienvenida a **${member.guild.name}** y esperamos que disfrutes.`)
      .setColor(0x57f287)
      .setThumbnail(member.user.displayAvatarURL());

    channel.send({ embeds: [embed] }).catch(() => {});
  }
};
