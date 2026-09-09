const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { updateGuild } = require('../utils/storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Configura un rol que se asigna automáticamente a todos los miembros')
    .addRoleOption((option) =>
      option
        .setName('rol')
        .setDescription('Rol que se asignará automáticamente')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const role = interaction.options.getRole('rol');
    const guild = interaction.guild;

    if (role.managed) {
      return interaction.reply({
        content: 'No puedo asignar un rol gestionado por una integración o bot.',
        ephemeral: true,
      });
    }

    const botMember = await guild.members.fetchMe();
    if (role.position >= botMember.roles.highest.position) {
      return interaction.reply({
        content:
          'Mi rol debe estar por encima del rol que quieres asignar automáticamente. Sube mi rol en la lista de roles del servidor y vuelve a intentarlo.',
        ephemeral: true,
      });
    }

    updateGuild(guild.id, (g) => {
      g.autoroleId = role.id;
    });

    await interaction.deferReply({ ephemeral: true });

    // Asigna el rol a todos los miembros que ya están en el servidor
    const members = await guild.members.fetch();
    let count = 0;
    for (const member of members.values()) {
      if (member.user.bot) continue;
      if (member.roles.cache.has(role.id)) continue;
      try {
        await member.roles.add(role);
        count++;
      } catch (err) {
        console.error(`No se pudo asignar el rol a ${member.user.tag}:`, err.message);
      }
    }

    await interaction.editReply(
      `✅ Rol automático configurado: ${role}.\nSe asignó a **${count}** miembro(s) ya existentes. Los nuevos miembros lo recibirán automáticamente al entrar.`
    );
  },
};
