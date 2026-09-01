const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require('discord.js');

const permissionMap = {
  administrator: PermissionFlagsBits.Administrator,
  manage_guild: PermissionFlagsBits.ManageGuild,
  manage_roles: PermissionFlagsBits.ManageRoles,
  manage_channels: PermissionFlagsBits.ManageChannels,
  manage_messages: PermissionFlagsBits.ManageMessages,
  kick_members: PermissionFlagsBits.KickMembers,
  ban_members: PermissionFlagsBits.BanMembers,
  moderate_members: PermissionFlagsBits.ModerateMembers,
  manage_webhooks: PermissionFlagsBits.ManageWebhooks,
  manage_nicknames: PermissionFlagsBits.ManageNicknames,
  mention_everyone: PermissionFlagsBits.MentionEveryone,
  view_audit_log: PermissionFlagsBits.ViewAuditLog,
  view_channel: PermissionFlagsBits.ViewChannel,
  send_messages: PermissionFlagsBits.SendMessages,
  embed_links: PermissionFlagsBits.EmbedLinks,
  attach_files: PermissionFlagsBits.AttachFiles,
  read_message_history: PermissionFlagsBits.ReadMessageHistory,
  connect: PermissionFlagsBits.Connect,
  speak: PermissionFlagsBits.Speak,
};

const permissionChoices = Object.keys(permissionMap).map(name => ({
  name,
  value: name,
}));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Manage server roles')

    // -------------------------------------------------------
    // CREATE
    // -------------------------------------------------------
    .addSubcommand(sub =>
      sub
        .setName('create')
        .setDescription('Create a new role')
        .addStringOption(option =>
          option
            .setName('name')
            .setDescription('Name of the new role')
            .setRequired(true)
        )
    )

    // -------------------------------------------------------
    // DELETE
    // -------------------------------------------------------
    .addSubcommand(sub =>
      sub
        .setName('delete')
        .setDescription('Delete a role')
        .addRoleOption(option =>
          option
            .setName('role')
            .setDescription('Role to delete')
            .setRequired(true)
        )
    )

    // -------------------------------------------------------
    // RENAME
    // -------------------------------------------------------
    .addSubcommand(sub =>
      sub
        .setName('rename')
        .setDescription('Rename a role')
        .addRoleOption(option =>
          option
            .setName('role')
            .setDescription('Role to rename')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('name')
            .setDescription('New role name')
            .setRequired(true)
        )
    )

    // -------------------------------------------------------
    // GIVE
    // -------------------------------------------------------
    .addSubcommand(sub =>
      sub
        .setName('give')
        .setDescription('Give a role to a member')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('Member receiving the role')
            .setRequired(true)
        )
        .addRoleOption(option =>
          option
            .setName('role')
            .setDescription('Role to give')
            .setRequired(true)
        )
    )

    // -------------------------------------------------------
    // REMOVE
    // -------------------------------------------------------
    .addSubcommand(sub =>
      sub
        .setName('remove')
        .setDescription('Remove a role from a member')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('Member losing the role')
            .setRequired(true)
        )
        .addRoleOption(option =>
          option
            .setName('role')
            .setDescription('Role to remove')
            .setRequired(true)
        )
    )

    // -------------------------------------------------------
    // PERMISSIONS
    // -------------------------------------------------------
    .addSubcommand(sub =>
      sub
        .setName('permissions')
        .setDescription('Change a role permission')
        .addRoleOption(option =>
          option
            .setName('role')
            .setDescription('Role to modify')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('permission')
            .setDescription('Permission to change')
            .setRequired(true)
            .addChoices(...permissionChoices)
        )
        .addBooleanOption(option =>
          option
            .setName('enabled')
            .setDescription('Enable or disable the permission')
            .setRequired(true)
        )
    ),

  async execute(interaction) {

    // =======================================================
    // OWNER OVERRIDE
    // =======================================================

    const ownerId = process.env.OWNER_ID;

    const isOwner =
      ownerId &&
      interaction.user.id === ownerId;

    // Server administrators can also use the command.
    const isAdministrator =
      interaction.memberPermissions?.has(
        PermissionFlagsBits.Administrator
      );

    if (!isOwner && !isAdministrator) {
      return interaction.reply({
        content:
          '❌ You do not have permission to use this command.',
        ephemeral: true,
      });
    }

    const subcommand =
      interaction.options.getSubcommand();

    // =======================================================
    // CREATE
    // =======================================================

    if (subcommand === 'create') {

      const name =
        interaction.options.getString('name');

      try {

        const role =
          await interaction.guild.roles.create({
            name,
            reason:
              `Created by ${interaction.user.tag}`,
          });

        return interaction.reply({
          content:
            `✅ Created role ${role}.`,
          ephemeral: true,
        });

      } catch (error) {

        console.error(error);

        return interaction.reply({
          content:
            '❌ I could not create that role. Check my Manage Roles permission.',
          ephemeral: true,
        });
      }
    }

    // =======================================================
    // DELETE
    // =======================================================

    if (subcommand === 'delete') {

      const role =
        interaction.options.getRole('role');

      if (!role) {
        return interaction.reply({
          content: '❌ Role not found.',
          ephemeral: true,
        });
      }

      if (role.managed) {
        return interaction.reply({
          content:
            '❌ That is a managed/integration role and cannot be deleted.',
          ephemeral: true,
        });
      }

      if (
        role.position >=
        interaction.guild.members.me.roles.highest.position
      ) {
        return interaction.reply({
          content:
            '❌ That role is above my highest role. Discord will not let me modify it.',
          ephemeral: true,
        });
      }

      try {

        await role.delete(
          `Deleted by ${interaction.user.tag}`
        );

        return interaction.reply({
          content:
            `✅ Deleted **${role.name}**.`,
          ephemeral: true,
        });

      } catch (error) {

        console.error(error);

        return interaction.reply({
          content:
            '❌ I could not delete that role.',
          ephemeral: true,
        });
      }
    }

    // =======================================================
    // RENAME
    // =======================================================

    if (subcommand === 'rename') {

      const role =
        interaction.options.getRole('role');

      const name =
        interaction.options.getString('name');

      if (
        role.position >=
        interaction.guild.members.me.roles.highest.position
      ) {
        return interaction.reply({
          content:
            '❌ That role is above my highest role.',
          ephemeral: true,
        });
      }

      try {

        await role.setName(
          name,
          `Renamed by ${interaction.user.tag}`
        );

        return interaction.reply({
          content:
            `✅ Role renamed to **${name}**.`,
          ephemeral: true,
        });

      } catch (error) {

        console.error(error);

        return interaction.reply({
          content:
            '❌ I could not rename that role.',
          ephemeral: true,
        });
      }
    }

    // =======================================================
    // GIVE
    // =======================================================

    if (subcommand === 'give') {

      const user =
        interaction.options.getMember('user');

      const role =
        interaction.options.getRole('role');

      if (!user || !role) {
        return interaction.reply({
          content:
            '❌ User or role not found.',
          ephemeral: true,
        });
      }

      if (
        role.position >=
        interaction.guild.members.me.roles.highest.position
      ) {
        return interaction.reply({
          content:
            '❌ That role is above my highest role.',
          ephemeral: true,
        });
      }

      try {

        await user.roles.add(
          role,
          `Given by ${interaction.user.tag}`
        );

        return interaction.reply({
          content:
            `✅ Gave ${role} to ${user}.`,
          ephemeral: true,
        });

      } catch (error) {

        console.error(error);

        return interaction.reply({
          content:
            '❌ I could not give that role.',
          ephemeral: true,
        });
      }
    }

    // =======================================================
    // REMOVE
    // =======================================================

    if (subcommand === 'remove') {

      const user =
        interaction.options.getMember('user');

      const role =
        interaction.options.getRole('role');

      if (!user || !role) {
        return interaction.reply({
          content:
            '❌ User or role not found.',
          ephemeral: true,
        });
      }

      if (
        role.position >=
        interaction.guild.members.me.roles.highest.position
      ) {
        return interaction.reply({
          content:
            '❌ That role is above my highest role.',
          ephemeral: true,
        });
      }

      try {

        await user.roles.remove(
          role,
          `Removed by ${interaction.user.tag}`
        );

        return interaction.reply({
          content:
            `✅ Removed ${role} from ${user}.`,
          ephemeral: true,
        });

      } catch (error) {

        console.error(error);

        return interaction.reply({
          content:
            '❌ I could not remove that role.',
          ephemeral: true,
        });
      }
    }

    // =======================================================
    // PERMISSIONS
    // =======================================================

    if (subcommand === 'permissions') {

      const role =
        interaction.options.getRole('role');

      const permissionName =
        interaction.options.getString('permission');

      const enabled =
        interaction.options.getBoolean('enabled');

      if (!role) {
        return interaction.reply({
          content:
            '❌ Role not found.',
          ephemeral: true,
        });
      }

      if (role.managed) {
        return interaction.reply({
          content:
            '❌ Managed/integration roles cannot be edited.',
          ephemeral: true,
        });
      }

      const botMember =
        interaction.guild.members.me;

      if (!botMember) {
        return interaction.reply({
          content:
            '❌ I could not determine my server role.',
          ephemeral: true,
        });
      }

      if (
        role.position >=
        botMember.roles.highest.position
      ) {
        return interaction.reply({
          content:
            '❌ That role is above my highest role. Discord prevents me from editing it.',
          ephemeral: true,
        });
      }

      const permission =
        permissionMap[permissionName];

      if (!permission) {
        return interaction.reply({
          content:
            '❌ Unknown permission.',
          ephemeral: true,
        });
      }

      try {

        const permissions =
          new PermissionsBitField(
            role.permissions
          );

        if (enabled) {
          permissions.add(permission);
        } else {
          permissions.remove(permission);
        }

        await role.setPermissions(
          permissions,
          `${permissionName} ${enabled ? 'enabled' : 'disabled'} by ${interaction.user.tag}`
        );

        return interaction.reply({
          content:
            `✅ **${permissionName}** is now **${
              enabled ? 'ENABLED' : 'DISABLED'
            }** for ${role}.`,
          ephemeral: true,
        });

      } catch (error) {

        console.error(error);

        return interaction.reply({
          content:
            '❌ I could not change that role's permissions. Make sure Tribunal has **Manage Roles**.',
          ephemeral: true,
        });
      }
    }
  },
};
