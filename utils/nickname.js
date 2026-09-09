// Utilidades para el sistema de apodo automático "「Rol」Usuario"
// Se usa tanto al cambiar de roles (Vip+, roles personalizados) como en /nick

const PREFIX_REGEX = /^「[^」]*」/;

/**
 * Quita el prefijo "「Algo」" de un nombre, si lo tiene.
 */
function stripNicknamePrefix(name) {
  if (!name) return name;
  return name.replace(PREFIX_REGEX, '');
}

/**
 * Calcula qué apodo debería tener un miembro según los roles "de apodo"
 * (Vip+, roles personalizados comprados en la tienda, etc.) guardados en
 * guildData.nicknameRoles = { roleId: 'Etiqueta' }.
 *
 * baseNameOverride permite forzar el nombre base (usado por /nick).
 * Devuelve el nombre final que debería tener el usuario (con o sin prefijo).
 */
function computeNicknameForMember(member, guildData, baseNameOverride) {
  const nicknameRoles = guildData.nicknameRoles || {};
  const baseName = stripNicknamePrefix(baseNameOverride || member.nickname || member.user.username);

  const matching = member.roles.cache.filter((r) => nicknameRoles[r.id]);
  if (matching.size === 0) {
    return baseName;
  }

  const topRole = matching.sort((a, b) => b.position - a.position).first();
  const label = nicknameRoles[topRole.id];
  return `「${label}」${baseName}`.slice(0, 32);
}

module.exports = {
  stripNicknamePrefix,
  computeNicknameForMember,
};
