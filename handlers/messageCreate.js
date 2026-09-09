const { getGuild, updateGuild } = require('../utils/storage');
const { askGroq } = require('../utils/groq');

const REWARD_PER_LEVEL = 4; // $ que se ganan cada vez que se cumple la cuota de mensajes

// Cuantos más ahorros tenga el usuario, más mensajes hacen falta para
// ganar los siguientes 4$ (así se evita que suba el dinero demasiado rápido)
function getRequiredMessages(balance) {
  if (balance < 100) return 30;
  if (balance < 240) return 60;
  return 100;
}

module.exports = async function messageCreate(message) {
  if (!message.guild || message.author.bot) return;

  const guildData = getGuild(message.guild.id);

  // ---- 1. Si el propio usuario AFK vuelve a escribir, se le quita el estado ----
  if (guildData.afk && guildData.afk[message.author.id]) {
    updateGuild(message.guild.id, (g) => {
      if (g.afk) delete g.afk[message.author.id];
    });
    message.reply(`✅ ${message.author}, se te ha quitado el estado AFK.`).catch(() => {});
  }

  // ---- 2. Avisar si se menciona a alguien que está AFK ----
  const mentionedAfk = [];
  message.mentions.users.forEach((user) => {
    if (user.id === message.author.id) return;
    const entry = guildData.afk && guildData.afk[user.id];
    if (!entry) return;

    if (entry.until && Date.now() > entry.until) {
      // El tiempo de AFK ya expiró, lo limpiamos silenciosamente
      updateGuild(message.guild.id, (g) => {
        if (g.afk) delete g.afk[user.id];
      });
      return;
    }

    mentionedAfk.push({ user, entry });
  });

  if (mentionedAfk.length > 0) {
    const texto = mentionedAfk.map(({ user, entry }) => `💤 ${user} está AFK: **${entry.reason}**`).join('\n');
    message.reply(texto).catch(() => {});
  }

  // ---- 3. Moderación del canal de risa (solo enlaces, fotos o vídeos) ----
  if (guildData.laughChannelId && message.channel.id === guildData.laughChannelId) {
    const hasAttachment = message.attachments.size > 0;
    const hasLink = /https?:\/\/\S+/i.test(message.content);

    if (!hasAttachment && !hasLink) {
      await message.delete().catch(() => {});
      return;
    }
  }

  // ---- 4. Dinero por mensajes en el canal de farmeo (comportamiento existente) ----
  if (guildData.spamChannelId && message.channel.id === guildData.spamChannelId) {
    const userId = message.author.id;

    updateGuild(message.guild.id, (g) => {
      g.economy = g.economy || {};
      g.economy[userId] = g.economy[userId] || { balance: 0, messageCount: 0, exclusivo: false };

      const entry = g.economy[userId];
      entry.messageCount += 1;

      const required = getRequiredMessages(entry.balance);
      if (entry.messageCount >= required) {
        entry.messageCount -= required;
        entry.balance += REWARD_PER_LEVEL;

        message.channel
          .send(`💰 ${message.author} ha ganado **${REWARD_PER_LEVEL}$**. Saldo actual: **${entry.balance}$**.`)
          .catch(() => {});
      }
    });
  }

  // ---- 5. Respuesta con IA (Groq) al mencionar al bot ----
  if (message.mentions.has(message.client.user)) {
    const prompt = message.content.replace(/<@!?\d+>/g, '').trim();

    if (prompt.length > 0) {
      try {
        await message.channel.sendTyping().catch(() => {});
        const respuesta = await askGroq(prompt);
        await message.reply(respuesta.slice(0, 1900));
      } catch (err) {
        console.error('Error llamando a Groq:', err.message);
        await message
          .reply('No he podido pensar en una respuesta ahora mismo, inténtalo de nuevo en un momento.')
          .catch(() => {});
      }
    }
  }
};
