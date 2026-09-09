const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'storage.json');

function loadData() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return {};
  }
}

function saveData(data) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function defaultGuildData() {
  return {
    autoroleId: null,
    ticketWelcome: null,
    tickets: {},
  };
}

/**
 * Devuelve los datos guardados de un servidor (los crea si no existen).
 */
function getGuild(guildId) {
  const data = loadData();
  if (!data[guildId]) {
    data[guildId] = defaultGuildData();
    saveData(data);
  }
  return data[guildId];
}

/**
 * Modifica los datos de un servidor de forma segura y los guarda.
 * updater recibe el objeto del servidor y lo muta directamente.
 */
function updateGuild(guildId, updater) {
  const data = loadData();
  if (!data[guildId]) {
    data[guildId] = defaultGuildData();
  }
  updater(data[guildId]);
  saveData(data);
  return data[guildId];
}

module.exports = {
  getGuild,
  updateGuild,
};
