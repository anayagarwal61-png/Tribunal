const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { hasPermission, checkBotCanActOnRole, checkBotCanActOn } = require('../permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Create, edit, delete, or assign roles')
    .addSubcommand(sub =>
      sub.setName('create')
        .setDescription('Create a new role')
        .addStringOption(o => o.setName('name').setDescription('Role name').setRequired(true))
        .addStringOption(o => o.setName('color').setDescription('Hex color, e.g. #ff0000').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('delete')
        .setDescription('Delete a role')
        .addRoleOption(o => o.setName('role').setDescription('Role to delete').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('edit')
        .setDescription('Rename or recolor a role')
        .addRoleOption(o => o.setName('role').setDescription('Role to edit').setRequired(true))
        .addStringOption(o => o.setName('name').setDescription('New name').setRequired(false))
        .addStringOption(o => o.setName('color').setDescription('New hex color, e.g. #00ff00').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('perms')
        .setDescription('View a role\'s key permissions')
        .addRoleOption(o => o.setName('role').setDescription('Role to inspect').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('give')
        .setDescription('Give a role to a member')
        .addUserOption(o => o.setName('member').setDescription('Member to give the role to').setRequired(true))
        .addRoleOption(o => o.setName('role').setDescription('Role to give').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove a role from a member')
        .addUserOption(o => o.setName('member').setDescription('Member to remove the role from').setRequired(true))
        .addRoleOption(o => o.setName('role').setDescription('Role to remove').setRequired(true))
    ),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({ content: "You need the **Manage Roles** permission to use this.", ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();

    try {
      if (sub === 'create') {
        const name = interaction.options.getString('name');
        const color = interaction.options.getString('color') || undefined;
        const role = await interaction.guild.roles.create({ name, color, reason: `Created by ${interaction.user.tag}` });
        return interaction.reply(`✅ Created role ${role}.`);
      }

      if (sub === 'delete') {
        const role = interaction.options.getRole('role');
        const blocked = checkBotCanActOnRole(interaction, role);
        if (blocked) return interaction.reply({ content: `⚠️ ${blocked}`, ephemeral: true });
        await role.delete(`Deleted by ${interaction.user.tag}`);
        return interaction.reply(`✅ Deleted role **${role.name}**.`);
      }

      if (sub === 'edit') {
        const role = interaction.options.getRole('role');
        const blocked = checkBotCanActOnRole(interaction, role);
        if (blocked) return interaction.reply({ content: `⚠️ ${blocked}`, ephemeral: true });
        const name = interaction.options.getString('name');
        const color = interaction.options.getString('color');
        const updates = {};
        if (name) updates.name = name;
        if (color) updates.color = color;
        if (Object.keys(updates).length === 0) {
          return interaction.reply({ content: 'Give me at least a new name or color to change.', ephemeral: true });
        }
        await role.edit(updates, `Edited by ${interaction.user.tag}`);
        return interaction.reply(`✅ Updated role ${role}.`);
      }

      if (sub === 'perms') {
        const role = interaction.options.getRole('role');
        const notable = [
          'Administrator', 'ManageGuild', 'ManageRoles', 'ManageChannels',
          'ManageMessages', 'KickMembers', 'BanMembers', 'ModerateMembers',
          'MentionEveryone', 'ManageWebhooks',
        ];
        const held = notable.filter(p => role.permissions.has(p));
        const embed = new EmbedBuilder()
          .setTitle(`Permissions — ${role.name}`)
          .setColor(role.color || 0x5865f2)
          .setDescription(held.length ? held.map(p => `• ${p}`).join('\n') : 'No notable elevated permissions.');
        return interaction.reply({ embeds: [embed] });
      }

      if (sub === 'give' || sub === 'remove') {
        const targetUser = interaction.options.getUser('member');
        const role = interaction.options.getRole('role');
        const targetMember = await interaction.guild.members.fetch(targetUser.id);

        const roleBlocked = checkBotCanActOnRole(interaction, role);
        if (roleBlocked) return interaction.reply({ content: `⚠️ ${roleBlocked}`, ephemeral: true });

        const memberBlocked = checkBotCanActOn(interaction, targetMember);
        if (memberBlocked) return interaction.reply({ content: `⚠️ ${memberBlocked}`, ephemeral: true });

        if (sub === 'give') {
          await targetMember.roles.add(role, `Given by ${interaction.user.tag}`);
          return interaction.reply(`✅ Gave ${role} to ${targetMember}.`);
        } else {
          await targetMember.roles.remove(role, `Removed by ${interaction.user.tag}`);
          return interaction.reply(`✅ Removed ${role} from ${targetMember}.`);
        }
      }
    } catch (err) {
      console.error(err);
      return interaction.reply({ content: `❌ Discord rejected that action: ${err.message}`, ephemeral: true });
    }
  },
};
