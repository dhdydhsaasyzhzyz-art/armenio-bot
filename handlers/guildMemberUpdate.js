const { getGuild } = require('../utils/storage');
const { computeNicknameForMember } = require('../utils/nickname');
const { EmbedBuilder } = require('discord.js');

// Se dispara cada vez que un miembro cambia (roles, apodo, boost, etc.)
module.exports = async function guildMemberUpdate(oldMember, newMember) {
  const guildData = getGuild(newMember.guild.id);

  // ---- Apodo automático 「Rol」Usuario (comportamiento ya existente) ----
  const rolesChanged =
    oldMember.roles.cache.size !== newMember.roles.cache.size ||
    !oldMember.roles.cache.every((r) => newMember.roles.cache.has(r.id));

  if (rolesChanged) {
    const desiredNick = computeNicknameForMember(newMember, guildData);
    const currentNick = newMember.nickname || newMember.user.username;

    if (desiredNick !== currentNick) {
      try {
        // Si el apodo deseado coincide con el username puro, quitamos el apodo (null)
        await newMember.setNickname(desiredNick === newMember.user.username ? null : desiredNick);
      } catch (err) {
        console.error(`No se pudo actualizar el apodo de ${newMember.user.tag}:`, err.message);
      }
    }
  }

  // ---- Anuncio de boost (nuevo) ----
  const startedBoosting = !oldMember.premiumSince && newMember.premiumSince;
  if (startedBoosting) {
    const channel =
      (guildData.boosterChannelId && newMember.guild.channels.cache.get(guildData.boosterChannelId)) ||
      newMember.guild.systemChannel;

    if (channel) {
      const embed = new EmbedBuilder()
        .setTitle('🚀 ¡Nuevo boost!')
        .setDescription(
          `${newMember} acaba de boostear **${newMember.guild.name}**. ¡Muchísimas gracias por tu apoyo!`
        )
        .setColor(0xf47fff)
        .setThumbnail(newMember.user.displayAvatarURL());

      channel.send({ embeds: [embed] }).catch(() => {});
    }
  }
};
