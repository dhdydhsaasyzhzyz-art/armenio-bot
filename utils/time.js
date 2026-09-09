// Convierte texto tipo "30m", "2h", "1d" a milisegundos, y milisegundos a texto legible.

function parseDuration(input) {
  if (!input) return null;
  const match = /^(\d+)\s*(s|m|h|d)$/i.exec(input.trim());
  if (!match) return null;

  const amount = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };

  return amount * multipliers[unit];
}

function formatDuration(ms) {
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts = [];
  if (days > 0) parts.push(`${days} día${days === 1 ? '' : 's'}`);
  if (hours > 0) parts.push(`${hours} hora${hours === 1 ? '' : 's'}`);
  if (parts.length === 0 || minutes > 0) parts.push(`${minutes} minuto${minutes === 1 ? '' : 's'}`);

  return parts.join(', ');
}

module.exports = { parseDuration, formatDuration };
