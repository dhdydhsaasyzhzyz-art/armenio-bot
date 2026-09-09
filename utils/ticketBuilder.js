const crypto = require('crypto');
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require('discord.js');

// Sesiones de configuración del panel de tickets (en memoria, no persistente).
// Solo viven mientras un admin está montando el panel con /desktop ticket.
const drafts = new Map();

function generateId() {
  return crypto.randomBytes(4).toString('hex');
}

function createDraft(authorId) {
  const draft = {
    id: generateId(),
    authorId,
    title: 'Sistema de tickets',
    description: 'Elige una opción del menú de abajo para abrir un ticket.',
    options: [],
  };

  drafts.set(draft.id, draft);

  // Auto-limpieza si el admin abandona la configuración a medias
  const timeout = setTimeout(() => drafts.delete(draft.id), 15 * 60 * 1000);
  timeout.unref();

  return draft;
}

function getDraft(id) {
  return drafts.get(id);
}

function deleteDraft(id) {
  drafts.delete(id);
}

function renderBuilderUI(draft) {
  const optionsText =
    draft.options.length > 0
      ? draft.options
          .map((o, i) => `**${i + 1}.** ${o.label}${o.description ? ` — ${o.description}` : ''}`)
          .join('\n')
      : '_Aún no has añadido ninguna opción._';

  const embed = new EmbedBuilder()
    .setTitle('🎫 Configurar panel de tickets')
    .setDescription(
      `**Vista previa:**\n\n**${draft.title}**\n${draft.description}\n\n**Opciones para el ticket:**\n${optionsText}`
    )
    .setColor(0x5865f2)
    .setFooter({ text: 'Esto es solo una vista previa privada. Pulsa "Enviar panel" cuando esté listo.' });

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ticketbuilder_edit_text|${draft.id}`)
      .setLabel('✏️ Editar texto')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`ticketbuilder_add_option|${draft.id}`)
      .setLabel('➕ Añadir opción')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`ticketbuilder_remove_option|${draft.id}`)
      .setLabel('➖ Eliminar opción')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(draft.options.length === 0)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ticketbuilder_send|${draft.id}`)
      .setLabel('✅ Enviar panel')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(draft.options.length === 0)
  );

  return { embeds: [embed], components: [row1, row2] };
}

function renderRemoveSelect(draft) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(`ticketbuilder_removeselect|${draft.id}`)
    .setPlaceholder('Elige qué opción quitar')
    .addOptions(
      draft.options.map((o) => ({
        label: o.label.slice(0, 100),
        description: (o.description || 'Sin descripción').slice(0, 100),
        value: o.id,
      }))
    );

  const embed = new EmbedBuilder()
    .setTitle('🎫 Eliminar una opción')
    .setDescription('Elige en el menú de abajo qué opción quieres quitar del panel.')
    .setColor(0xed4245);

  return { embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] };
}

function slugify(text) {
  const slug = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'ticket';
}

module.exports = {
  generateId,
  createDraft,
  getDraft,
  deleteDraft,
  renderBuilderUI,
  renderRemoveSelect,
  slugify,
};
