const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  PermissionsBitField,
} = require('discord.js');

const PERMISSIONS = {
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

const permissionChoices = Object.keys(PERMISSIONS).map(name => ({
  name,
  value: name,
}));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Manage server roles')

    // /role create
    .addSubcommand(sub =>
      sub
        .setName('create')
        .setDescription('Create a role')
        .addStringOption(option =>
          option
            .setName('name')
            .setDescription('Name of the role')
            .setRequired(true)
        )
    )

    // /role delete
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

    // /role rename
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

    // /role give
    .addSubcommand(sub =>
      sub
        .setName('give')
        .setDescription('Give a role to a member')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('Member')
            .setRequired(true)
        )
        .addRoleOption(option =>
          option
            .setName('role')
            .setDescription('Role to give')
            .setRequired(true)
        )
    )

    // /role remove
    .addSubcommand(sub =>
      sub
        .setName('remove')
        .setDescription('Remove a role from a member')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('Member')
            .setRequired(true)
        )
        .addRoleOption(option =>
          option
            .setName('role')
            .setDescription('Role to remove')
            .setRequired(true)
        )
    )

    // /role perm add
    .addSubcommand(sub =>
      sub
        .setName('perm')
        .setDescription('Add or remove permissions from a role')
        .addStringOption(option =>
          option
            .setName('action')
            .setDescription('Add or remove the permission')
            .setRequired(true)
            .addChoices(
              { name: 'Add', value: 'add' },
              { name: 'Remove', value: 'remove' }
            )
        )
        .addRoleOption(option =>
          option
            .setName('role')
            .setDescription('Role to modify')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('permission')
            .setDescription('Permission')
            .setRequired(true)
            .addChoices(...permissionChoices)
        )
    ),

  async execute(interaction) {
    const ownerId = process.env.OWNER_ID;

    const isOwner =
      ownerId && interaction.user.id === ownerId;

    const isAdministrator =
      interaction.memberPermissions?.has(
        PermissionFlagsBits.Administrator
      );

    if (!isOwner && !isAdministrator) {
      return interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true,
      });
    }

    const subcommand =
      interaction.options.getSubcommand();

    const botMember =
      interaction.guild.members.me;

    if (!botMember) {
      return interaction.reply({
        content: '❌ Tribunal could not find itself in this server.',
        ephemeral: true,
      });
    }

    // =====================================================
    // CREATE
    // =====================================================

    if (subcommand === 'create') {
      const name =
        interaction.options.getString('name');

      try {
        const role =
          await interaction.guild.roles.create({
            name,
            reason: `Created by ${interaction.user.tag}`,
          });

        return interaction.reply({
          content: `✅ Created ${role}.`,
          ephemeral: true,
        });
      } catch (error) {
        console.error(error);

        return interaction.reply({
          content:
            '❌ Failed to create the role. Tribunal needs Manage Roles.',
          ephemeral: true,
        });
      }
    }

    // =====================================================
    // DELETE
    // =====================================================

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
          content: '❌ Managed roles cannot be deleted.',
          ephemeral: true,
        });
      }

      if (role.position >= botMember.roles.highest.position) {
        return interaction.reply({
          content:
            '❌ Tribunal cannot modify a role above its highest role.',
          ephemeral: true,
        });
      }

      try {
        const name = role.name;

        await role.delete(
          `Deleted by ${interaction.user.tag}`
        );

        return interaction.reply({
          content: `✅ Deleted **${name}**.`,
          ephemeral: true,
        });
      } catch (error) {
        console.error(error);

        return interaction.reply({
          content: '❌ Failed to delete the role.',
          ephemeral: true,
        });
      }
    }

    // =====================================================
    // RENAME
    // =====================================================

    if (subcommand === 'rename') {
      const role =
        interaction.options.getRole('role');

      const name =
        interaction.options.getString('name');

      if (!role) {
        return interaction.reply({
          content: '❌ Role not found.',
          ephemeral: true,
        });
      }

      if (role.managed) {
        return interaction.reply({
          content: '❌ Managed roles cannot be renamed.',
          ephemeral: true,
        });
      }

      if (role.position >= botMember.roles.highest.position) {
        return interaction.reply({
          content:
            '❌ Tribunal cannot modify a role above its highest role.',
          ephemeral: true,
        });
      }

      try {
        await role.setName(
          name,
          `Renamed by ${interaction.user.tag}`
        );

        return interaction.reply({
          content: `✅ Renamed role to **${name}**.`,
          ephemeral: true,
        });
      } catch (error) {
        console.error(error);

        return interaction.reply({
          content: '❌ Failed to rename the role.',
          ephemeral: true,
        });
      }
    }

    // =====================================================
    // GIVE
    // =====================================================

    if (subcommand === 'give') {
      const member =
        interaction.options.getMember('user');

      const role =
        interaction.options.getRole('role');

      if (!member || !role) {
        return interaction.reply({
          content: '❌ Member or role not found.',
          ephemeral: true,
        });
      }

      if (role.managed) {
        return interaction.reply({
          content:
            '❌ Managed roles cannot be manually assigned.',
          ephemeral: true,
        });
      }

      if (role.position >= botMember.roles.highest.position) {
        return interaction.reply({
          content:
            '❌ Tribunal cannot assign a role above its highest role.',
          ephemeral: true,
        });
      }

      try {
        await member.roles.add(
          role,
          `Given by ${interaction.user.tag}`
        );

        return interaction.reply({
          content: `✅ Gave ${role} to ${member}.`,
          ephemeral: true,
        });
      } catch (error) {
        console.error(error);

        return interaction.reply({
          content:
            '❌ Failed to give the role. Tribunal needs Manage Roles.',
          ephemeral: true,
        });
      }
    }

    // =====================================================
    // REMOVE
    // =====================================================

    if (subcommand === 'remove') {
      const member =
        interaction.options.getMember('user');

      const role =
        interaction.options.getRole('role');

      if (!member || !role) {
        return interaction.reply({
          content: '❌ Member or role not found.',
          ephemeral: true,
        });
      }

      if (role.position >= botMember.roles.highest.position) {
        return interaction.reply({
          content:
            '❌ Tribunal cannot remove a role above its highest role.',
          ephemeral: true,
        });
      }

      try {
        await member.roles.remove(
          role,
          `Removed by ${interaction.user.tag}`
        );

        return interaction.reply({
          content: `✅ Removed ${role} from ${member}.`,
          ephemeral: true,
        });
      } catch (error) {
        console.error(error);

        return interaction.reply({
          content:
            '❌ Failed to remove the role. Tribunal needs Manage Roles.',
          ephemeral: true,
        });
      }
    }

    // =====================================================
    // PERMISSION ADD / REMOVE
    // =====================================================

    if (subcommand === 'perm') {
      const action =
        interaction.options.getString('action');

      const role =
        interaction.options.getRole('role');

      const permissionName =
        interaction.options.getString('permission');

      if (!role) {
        return interaction.reply({
          content: '❌ Role not found.',
          ephemeral: true,
        });
      }

      if (role.managed) {
        return interaction.reply({
          content:
            '❌ Managed roles cannot have their permissions changed.',
          ephemeral: true,
        });
      }

      if (role.position >= botMember.roles.highest.position) {
        return interaction.reply({
          content:
            '❌ Tribunal cannot modify a role above its highest role.',
          ephemeral: true,
        });
      }

      const permission =
        PERMISSIONS[permissionName];

      if (!permission) {
        return interaction.reply({
          content: '❌ Unknown permission.',
          ephemeral: true,
        });
      }

      try {
        const permissions =
          new PermissionsBitField(role.permissions);

        if (action === 'add') {
          permissions.add(permission);
        } else {
          permissions.remove(permission);
        }

        await role.setPermissions(
          permissions,
          `${permissionName} ${action}ed by ${interaction.user.tag}`
        );

        return interaction.reply({
          content:
            `✅ **${permissionName}** ${action === 'add' ? 'added to' : 'removed from'} ${role}.`,
          ephemeral: true,
        });
      } catch (error) {
        console.error(error);

        return interaction.reply({
          content:
            '❌ Failed to change the role permissions. Tribunal needs Manage Roles.',
          ephemeral: true,
        });
      }
    }
  },
};
