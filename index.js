require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // Necesario para autorole (miembros existentes y nuevos)
    GatewayIntentBits.GuildMessages, // Necesario para contar mensajes en el canal de farmeo de la tienda
    GatewayIntentBits.MessageContent, // Necesario para el canal de risa (revisar enlaces/adjuntos) y la IA
  ],
  partials: [Partials.GuildMember],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

client.once('ready', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
});

client.on('interactionCreate', require('./handlers/interactionCreate'));
client.on('guildMemberAdd', require('./handlers/guildMemberAdd'));
client.on('guildMemberRemove', require('./handlers/guildMemberRemove')); // Mensaje de despedida
client.on('guildMemberUpdate', require('./handlers/guildMemberUpdate')); // Apodo automático 「Rol」Usuario + boosts
client.on('messageCreate', require('./handlers/messageCreate')); // Dinero, AFK, canal de risa, IA

client.login(process.env.DISCORD_TOKEN);
