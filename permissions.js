const { PermissionsBitField } = require('discord.js');

/**
 * Central permission gate for every command.
 *
 * - The user in OWNER_ID always passes, no matter what role they hold.
 * - Everyone else needs the actual Discord permission for that action.
 *
 * This does NOT and CANNOT let anyone bypass Discord's role hierarchy.
 * Discord's API itself refuses actions on members/roles positioned at or
 * above the bot's own highest role - that check happens server-side on
 * Discord's end, not in this bot's code, so there's no way to code around it.
 */
function isOwner(interaction) {
  return interaction.user.id === process.env.OWNER_ID;
}

function hasPermission(interaction, permission) {
  if (isOwner(interaction)) return true;
  return interaction.memberPermissions?.has(permission) ?? false;
}

/**
 * Checks whether the bot itself is even able to act on a given target member,
 * based on Discord's real role hierarchy. Returns a reason string if blocked,
 * or null if the action is allowed to proceed.
 */
function checkBotCanActOn(interaction, targetMember) {
  const botMember = interaction.guild.members.me;

  if (targetMember.id === interaction.guild.ownerId) {
    return "I can't take action on the Server Owner — Discord blocks this for every bot, no exceptions.";
  }
  if (targetMember.id === botMember.id) {
    return "I can't take action on myself.";
  }
  if (botMember.roles.highest.position <= targetMember.roles.highest.position) {
    return `I can't act on **${targetMember.user.tag}** — their highest role is at or above my highest role. Move my bot role above theirs in Server Settings → Roles, then try again.`;
  }
  return null;
}

/**
 * Same idea, but for a role object (used by /role commands) instead of a member.
 */
function checkBotCanActOnRole(interaction, targetRole) {
  const botMember = interaction.guild.members.me;
  if (targetRole.managed) {
    return "That role is managed by an integration/bot and can't be edited manually.";
  }
  if (botMember.roles.highest.position <= targetRole.position) {
    return `I can't manage **${targetRole.name}** — it's at or above my highest role. Move my bot role above it in Server Settings → Roles, then try again.`;
  }
  return null;
}

module.exports = {
  isOwner,
  hasPermission,
  checkBotCanActOn,
  checkBotCanActOnRole,
  PermissionsBitField,
};
