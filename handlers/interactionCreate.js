const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  PermissionFlagsBits,
  PermissionsBitField,
  ChannelType,
} = require('discord.js');
const { getGuild, updateGuild } = require('../utils/storage');
const {
  getDraft,
  deleteDraft,
  renderBuilderUI,
  renderRemoveSelect,
  generateId,
  slugify,
} = require('../utils/ticketBuilder');

module.exports = async function interactionCreate(interaction) {
  try {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction);
      return;
    }

    if (interaction.isButton()) {
      await handleButton(interaction);
      return;
    }

    if (interaction.isStringSelectMenu()) {
      await handleSelectMenu(interaction);
      return;
    }

    if (interaction.isModalSubmit()) {
      await handleModal(interaction);
      return;
    }
  } catch (err) {
    console.error('Error manejando la interacción:', err);
    const payload = { content: '⚠️ Ha ocurrido un error al procesar la acción.', ephemeral: true };
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(payload).catch(() => {});
    } else {
      await interaction.reply(payload).catch(() => {});
    }
  }
};

async function handleButton(interaction) {
  const parts = interaction.customId.split('|');
  const action = parts[0];

  if (action === 'verify_button') {
    return handleVerifyButton(interaction, parts[1]);
  }

  if (action === 'close_ticket') {
    return handleCloseTicket(interaction);
  }

  if (action === 'shop_buy') {
    return handleShopBuy(interaction, parts[1]);
  }

  if (action === 'suggestion_vote') {
    return handleSuggestionVote(interaction, parts[1], parts[2]);
  }

  if (action === 'ticketbuilder_edit_text') {
    return handleTicketBuilderEditTextButton(interaction, parts[1]);
  }

  if (action === 'ticketbuilder_add_option') {
    return handleTicketBuilderAddOptionButton(interaction, parts[1]);
  }

  if (action === 'ticketbuilder_remove_option') {
    return handleTicketBuilderRemoveButton(interaction, parts[1]);
  }

  if (action === 'ticketbuilder_send') {
    return handleTicketBuilderSend(interaction, parts[1]);
  }
}

async function handleSelectMenu(interaction) {
  const parts = interaction.customId.split('|');
  const action = parts[0];

  if (action === 'ticket_select') {
    return handleTicketSelect(interaction);
  }

  if (action === 'ticketbuilder_removeselect') {
    return handleTicketBuilderRemoveSelect(interaction, parts[1]);
  }
}

async function handleVerifyButton(interaction, roleId) {
  const member = interaction.member;

  const role = interaction.guild.roles.cache.get(roleId);
  if (!role) {
    return interaction.reply({
      content: 'El rol de verificación ya no existe. Avisa a un administrador.',
      ephemeral: true,
    });
  }

  if (member.roles.cache.has(roleId)) {
    return interaction.reply({ content: 'Ya estás verificado.', ephemeral: true });
  }

  await member.roles.add(roleId);
  return interaction.reply({ content: '✅ Has sido verificado correctamente.', ephemeral: true });
}

// ---------- Sistema de tickets (panel con desplegable) ----------

async function handleTicketSelect(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const guildData = getGuild(interaction.guild.id);

  const optionId = interaction.values[0];
  const optionInfo = (guildData.ticketOptions && guildData.ticketOptions[optionId]) || { label: 'ticket' };

  // Evitar que un mismo usuario tenga varios tickets abiertos a la vez
  const existingEntry = Object.entries(guildData.tickets || {}).find(
    ([, t]) => t.creatorId === interaction.user.id
  );
  if (existingEntry) {
    const [channelId] = existingEntry;
    const channel = interaction.guild.channels.cache.get(channelId);
    if (channel) {
      return interaction.editReply(`Ya tienes un ticket abierto: ${channel}`);
    }
    updateGuild(interaction.guild.id, (g) => {
      if (g.tickets) delete g.tickets[channelId];
    });
  }

  const updatedAfterCounter = updateGuild(interaction.guild.id, (g) => {
    g.ticketCounter = (g.ticketCounter || 0) + 1;
  });
  const ticketNumber = updatedAfterCounter.ticketCounter;

  const channelName = `${slugify(optionInfo.label)}-${ticketNumber}`.slice(0, 90);

  const categoryId = process.env.TICKET_CATEGORY_ID;
  const category = categoryId ? interaction.guild.channels.cache.get(categoryId) : null;
  const validCategory = category && category.type === ChannelType.GuildCategory ? category : null;

  const channel = await interaction.guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: validCategory ? validCategory.id : undefined,
    permissionOverwrites: [
      {
        id: interaction.guild.roles.everyone.id,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
      {
        id: interaction.user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
        ],
      },
      {
        id: interaction.client.user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ManageChannels,
        ],
      },
    ],
  });

  updateGuild(interaction.guild.id, (g) => {
    g.tickets = g.tickets || {};
    g.tickets[channel.id] = { creatorId: interaction.user.id, optionId };
  });

  const welcomeConfig = guildData.ticketWelcome || {
    title: 'Ticket de soporte',
    description: 'Gracias por abrir un ticket. Un miembro del staff te atenderá pronto.',
    closeButtonLabel: 'Cerrar Ticket',
  };

  const embed = new EmbedBuilder()
    .setTitle(welcomeConfig.title)
    .setDescription(`${welcomeConfig.description}\n\n**Categoría:** ${optionInfo.label}`)
    .setColor(0x5865f2);

  const closeRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel(welcomeConfig.closeButtonLabel || 'Cerrar Ticket')
      .setStyle(ButtonStyle.Danger)
  );

  await channel.send({
    content: `${interaction.user}`,
    embeds: [embed],
    components: [closeRow],
  });

  return interaction.editReply(`✅ Tu ticket ha sido creado: ${channel}`);
}

async function handleCloseTicket(interaction) {
  // Requisito clave: quien creó el ticket NO puede cerrarlo, solo un administrador
  const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
  if (!isAdmin) {
    return interaction.reply({
      content: '🚫 Solo un administrador puede cerrar este ticket.',
      ephemeral: true,
    });
  }

  await interaction.reply({ content: 'Cerrando el ticket en 5 segundos...' });

  updateGuild(interaction.guild.id, (g) => {
    if (g.tickets) delete g.tickets[interaction.channel.id];
  });

  setTimeout(() => {
    interaction.channel.delete().catch(() => {});
  }, 5000);
}

// ---------- Constructor del panel de tickets (/desktop ticket) ----------

const SESSION_EXPIRED_MSG = 'Esta sesión de configuración ya no está disponible. Usa `/desktop ticket` de nuevo.';

async function handleTicketBuilderEditTextButton(interaction, builderId) {
  const draft = getDraft(builderId);
  if (!draft) {
    return interaction.reply({ content: SESSION_EXPIRED_MSG, ephemeral: true });
  }

  const modal = new ModalBuilder()
    .setCustomId(`ticketbuilder_edit_text_modal|${builderId}`)
    .setTitle('Editar texto del panel');

  const titleInput = new TextInputBuilder()
    .setCustomId('panel_title')
    .setLabel('Título del panel')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(256)
    .setValue(draft.title);

  const descInput = new TextInputBuilder()
    .setCustomId('panel_description')
    .setLabel('Descripción del panel')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(1000)
    .setValue(draft.description);

  modal.addComponents(
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(descInput)
  );

  await interaction.showModal(modal);
}

async function handleTicketBuilderAddOptionButton(interaction, builderId) {
  const draft = getDraft(builderId);
  if (!draft) {
    return interaction.reply({ content: SESSION_EXPIRED_MSG, ephemeral: true });
  }

  if (draft.options.length >= 25) {
    return interaction.reply({ content: 'Ya tienes el máximo de 25 opciones.', ephemeral: true });
  }

  const modal = new ModalBuilder()
    .setCustomId(`ticketbuilder_add_option_modal|${builderId}`)
    .setTitle('Añadir opción de ticket');

  const labelInput = new TextInputBuilder()
    .setCustomId('option_label')
    .setLabel('Nombre de la opción (ej: Soporte)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(80);

  const descInput = new TextInputBuilder()
    .setCustomId('option_description')
    .setLabel('Descripción breve (opcional)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(100);

  modal.addComponents(
    new ActionRowBuilder().addComponents(labelInput),
    new ActionRowBuilder().addComponents(descInput)
  );

  await interaction.showModal(modal);
}

async function handleTicketBuilderRemoveButton(interaction, builderId) {
  const draft = getDraft(builderId);
  if (!draft) {
    return interaction.reply({ content: SESSION_EXPIRED_MSG, ephemeral: true });
  }

  if (draft.options.length === 0) {
    return interaction.reply({ content: 'No hay ninguna opción que quitar.', ephemeral: true });
  }

  await interaction.update(renderRemoveSelect(draft));
}

async function handleTicketBuilderRemoveSelect(interaction, builderId) {
  const draft = getDraft(builderId);
  if (!draft) {
    return interaction.reply({ content: SESSION_EXPIRED_MSG, ephemeral: true });
  }

  const optionId = interaction.values[0];
  draft.options = draft.options.filter((o) => o.id !== optionId);

  await interaction.update(renderBuilderUI(draft));
}

async function handleTicketBuilderSend(interaction, builderId) {
  const draft = getDraft(builderId);
  if (!draft) {
    return interaction.reply({ content: SESSION_EXPIRED_MSG, ephemeral: true });
  }

  if (draft.options.length === 0) {
    return interaction.reply({ content: 'Añade al menos una opción antes de enviar el panel.', ephemeral: true });
  }

  const embed = new EmbedBuilder().setTitle(draft.title).setDescription(draft.description).setColor(0x5865f2);

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('ticket_select')
    .setPlaceholder('Elige una opción')
    .addOptions(
      draft.options.map((o) => ({
        label: o.label.slice(0, 100),
        description: o.description ? o.description.slice(0, 100) : undefined,
        value: o.id,
      }))
    );

  await interaction.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(selectMenu)] });

  updateGuild(interaction.guild.id, (g) => {
    g.ticketOptions = {};
    draft.options.forEach((o) => {
      g.ticketOptions[o.id] = { label: o.label, description: o.description || null };
    });
  });

  deleteDraft(builderId);

  // Encadenamos el modal para configurar la bienvenida del ticket
  const welcomeModal = new ModalBuilder()
    .setCustomId('ticket_welcome_modal')
    .setTitle('Mensaje de bienvenida del ticket');

  const wTitle = new TextInputBuilder()
    .setCustomId('welcome_title')
    .setLabel('Título de bienvenida')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(256);

  const wDesc = new TextInputBuilder()
    .setCustomId('welcome_description')
    .setLabel('Descripción de bienvenida')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(1000);

  const wCloseLabel = new TextInputBuilder()
    .setCustomId('welcome_close_label')
    .setLabel('Texto del botón de cerrar (opcional)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(80);

  welcomeModal.addComponents(
    new ActionRowBuilder().addComponents(wTitle),
    new ActionRowBuilder().addComponents(wDesc),
    new ActionRowBuilder().addComponents(wCloseLabel)
  );

  await interaction.showModal(welcomeModal);
}

async function handleModal(interaction) {
  const parts = interaction.customId.split('|');
  const modalName = parts[0];

  if (modalName === 'ticketbuilder_edit_text_modal') {
    return handleTicketBuilderEditTextSubmit(interaction, parts[1]);
  }

  if (modalName === 'ticketbuilder_add_option_modal') {
    return handleTicketBuilderAddOptionSubmit(interaction, parts[1]);
  }

  if (interaction.customId === 'ticket_welcome_modal') {
    return handleTicketWelcomeSubmit(interaction);
  }

  if (interaction.customId === 'custom_role_modal') {
    return handleCustomRoleSubmit(interaction);
  }
}

async function handleTicketBuilderEditTextSubmit(interaction, builderId) {
  const draft = getDraft(builderId);
  if (!draft) {
    return interaction.reply({ content: SESSION_EXPIRED_MSG, ephemeral: true });
  }

  draft.title = interaction.fields.getTextInputValue('panel_title');
  draft.description = interaction.fields.getTextInputValue('panel_description');

  await interaction.update(renderBuilderUI(draft));
}

async function handleTicketBuilderAddOptionSubmit(interaction, builderId) {
  const draft = getDraft(builderId);
  if (!draft) {
    return interaction.reply({ content: SESSION_EXPIRED_MSG, ephemeral: true });
  }

  const label = interaction.fields.getTextInputValue('option_label');
  const description = interaction.fields.getTextInputValue('option_description');

  draft.options.push({ id: generateId(), label, description: description || null });

  await interaction.update(renderBuilderUI(draft));
}

async function handleTicketWelcomeSubmit(interaction) {
  const title = interaction.fields.getTextInputValue('welcome_title');
  const description = interaction.fields.getTextInputValue('welcome_description');
  const closeButtonLabel =
    interaction.fields.getTextInputValue('welcome_close_label') || 'Cerrar Ticket';

  updateGuild(interaction.guild.id, (g) => {
    g.ticketWelcome = { title, description, closeButtonLabel };
  });

  await interaction.reply({
    content: '✅ Panel de tickets enviado y mensaje de bienvenida configurado correctamente.',
    ephemeral: true,
  });
}

// ---------- Tienda del servidor ----------

const VIP_ROLE_ID = '1546163647984963664'; // Debe coincidir con el de commands/desktop.js
const SHOP_PRICES = { exclusivo: 570, vipplus: 1000, customrole: 250 };

function getEconomyEntry(guildData, userId) {
  return (guildData.economy && guildData.economy[userId]) || { balance: 0, messageCount: 0, exclusivo: false };
}

async function handleShopBuy(interaction, item) {
  const price = SHOP_PRICES[item];
  if (!price) return;

  const guildData = getGuild(interaction.guild.id);
  const entry = getEconomyEntry(guildData, interaction.user.id);

  if (entry.balance < price) {
    return interaction.reply({
      content: `No tienes suficiente dinero. Te faltan **${price - entry.balance}$**.`,
      ephemeral: true,
    });
  }

  if (item === 'exclusivo') {
    if (entry.exclusivo) {
      return interaction.reply({ content: 'Ya tienes Exclusivo+.', ephemeral: true });
    }

    updateGuild(interaction.guild.id, (g) => {
      g.economy = g.economy || {};
      g.economy[interaction.user.id] = g.economy[interaction.user.id] || { balance: 0, messageCount: 0, exclusivo: false };
      g.economy[interaction.user.id].balance -= price;
      g.economy[interaction.user.id].exclusivo = true;
    });

    return interaction.reply({
      content: '✅ Has comprado **Exclusivo+**. Ya puedes usar `/nick` para cambiar tu apodo.',
      ephemeral: true,
    });
  }

  if (item === 'vipplus') {
    const role = interaction.guild.roles.cache.get(VIP_ROLE_ID);
    if (!role) {
      return interaction.reply({
        content: 'El rol de Vip+ no existe en este servidor. Avisa a un administrador.',
        ephemeral: true,
      });
    }

    const botMember = await interaction.guild.members.fetchMe();
    if (role.position >= botMember.roles.highest.position) {
      return interaction.reply({
        content: 'No puedo asignar el rol de Vip+ (mi rol está por debajo). Avisa a un administrador.',
        ephemeral: true,
      });
    }

    if (interaction.member.roles.cache.has(role.id)) {
      return interaction.reply({ content: 'Ya tienes el rol Vip+.', ephemeral: true });
    }

    updateGuild(interaction.guild.id, (g) => {
      g.economy = g.economy || {};
      g.economy[interaction.user.id] = g.economy[interaction.user.id] || { balance: 0, messageCount: 0, exclusivo: false };
      g.economy[interaction.user.id].balance -= price;
      g.nicknameRoles = g.nicknameRoles || {};
      g.nicknameRoles[role.id] = role.name;
    });

    await interaction.member.roles.add(role);

    return interaction.reply({ content: `✅ Has comprado **Vip+**. Ahora tienes el rol ${role}.`, ephemeral: true });
  }

  if (item === 'customrole') {
    // El cobro se confirma al enviar el modal (por si el saldo cambia mientras lo rellenan)
    const modal = new ModalBuilder().setCustomId('custom_role_modal').setTitle('Crea tu rol personalizado');

    const nameInput = new TextInputBuilder()
      .setCustomId('role_name')
      .setLabel('Nombre del rol')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(32);

    const colorInput = new TextInputBuilder()
      .setCustomId('role_color')
      .setLabel('Color en hexadecimal (ej: #ff0000)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(7);

    modal.addComponents(
      new ActionRowBuilder().addComponents(nameInput),
      new ActionRowBuilder().addComponents(colorInput)
    );

    return interaction.showModal(modal);
  }
}

async function handleCustomRoleSubmit(interaction) {
  const price = SHOP_PRICES.customrole;
  const guildData = getGuild(interaction.guild.id);
  const entry = getEconomyEntry(guildData, interaction.user.id);

  if (entry.balance < price) {
    return interaction.reply({
      content: `No tienes suficiente dinero. Te faltan **${price - entry.balance}$**.`,
      ephemeral: true,
    });
  }

  const name = interaction.fields.getTextInputValue('role_name');
  let color = interaction.fields.getTextInputValue('role_color').trim();

  if (!/^#?[0-9a-fA-F]{6}$/.test(color)) {
    return interaction.reply({
      content: 'El color no es válido. Usa un formato hexadecimal como `#ff0000`.',
      ephemeral: true,
    });
  }
  if (!color.startsWith('#')) color = `#${color}`;

  const botMember = await interaction.guild.members.fetchMe();

  const role = await interaction.guild.roles.create({
    name,
    color,
    reason: `Rol personalizado comprado por ${interaction.user.tag}`,
  });

  try {
    await role.setPosition(Math.max(botMember.roles.highest.position - 1, 1));
  } catch (err) {
    console.error('No se pudo reposicionar el rol personalizado:', err.message);
  }

  await interaction.member.roles.add(role);

  updateGuild(interaction.guild.id, (g) => {
    g.economy = g.economy || {};
    g.economy[interaction.user.id] = g.economy[interaction.user.id] || { balance: 0, messageCount: 0, exclusivo: false };
    g.economy[interaction.user.id].balance -= price;
    g.nicknameRoles = g.nicknameRoles || {};
    g.nicknameRoles[role.id] = name;
  });

  return interaction.reply({ content: `✅ Se ha creado tu rol ${role} y se te ha asignado.`, ephemeral: true });
}

// ---------- Votos de sugerencias ----------

async function handleSuggestionVote(interaction, suggestionId, choice) {
  const guildData = getGuild(interaction.guild.id);
  const suggestion = guildData.suggestions && guildData.suggestions[suggestionId];

  if (!suggestion) {
    return interaction.reply({ content: 'Esta sugerencia ya no está disponible para votar.', ephemeral: true });
  }

  updateGuild(interaction.guild.id, (g) => {
    g.suggestions = g.suggestions || {};
    g.suggestions[suggestionId] = g.suggestions[suggestionId] || { votes: {} };
    g.suggestions[suggestionId].votes[interaction.user.id] = choice;
  });

  const updated = getGuild(interaction.guild.id).suggestions[suggestionId];
  const votesArray = Object.values(updated.votes);
  const wCount = votesArray.filter((v) => v === 'w').length;
  const lCount = votesArray.filter((v) => v === 'l').length;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`suggestion_vote|${suggestionId}|w`)
      .setLabel(`W (${wCount})`)
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`suggestion_vote|${suggestionId}|l`)
      .setLabel(`L (${lCount})`)
      .setStyle(ButtonStyle.Danger)
  );

  await interaction.update({ components: [row] });
}
