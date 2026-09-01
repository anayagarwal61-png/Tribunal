const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { hasPermission, checkBotCanActOn } = require('../permissions');

const MS_PER_MINUTE = 60_000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('member')
    .setDescription('Moderate a member')
    .addSubcommand(sub =>
      sub.setName('timeout')
        .setDescription('Timeout a member (they can\'t send messages/speak for a set time)')
        .addUserOption(o => o.setName('member').setDescription('Member to timeout').setRequired(true))
        .addIntegerOption(o => o.setName('minutes').setDescription('Timeout duration in minutes (max 40320 = 28 days)').setRequired(true))
        .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('kick')
        .setDescription('Kick a member from the server')
        .addUserOption(o => o.setName('member').setDescription('Member to kick').setRequired(true))
        .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('ban')
        .setDescription('Ban a member from the server')
        .addUserOption(o => o.setName('member').setDescription('Member to ban').setRequired(true))
        .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false))
        .addIntegerOption(o => o.setName('delete_days').setDescription('Delete their messages from the last N days (0-7)').setRequired(false))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser('member');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const permMap = {
      timeout: PermissionFlagsBits.ModerateMembers,
      kick: PermissionFlagsBits.KickMembers,
      ban: PermissionFlagsBits.BanMembers,
    };
    if (!hasPermission(interaction, permMap[sub])) {
      return interaction.reply({ content: `You need the required permission to ${sub} members.`, ephemeral: true });
    }

    try {
      if (sub === 'ban') {
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (targetMember) {
          const blocked = checkBotCanActOn(interaction, targetMember);
          if (blocked) return interaction.reply({ content: `⚠️ ${blocked}`, ephemeral: true });
        }
        const deleteDays = interaction.options.getInteger('delete_days') ?? 0;
        await interaction.guild.members.ban(targetUser.id, {
          deleteMessageSeconds: Math.min(Math.max(deleteDays, 0), 7) * 86400,
          reason: `${reason} — by ${interaction.user.tag}`,
        });
        return interaction.reply(`🔨 Banned **${targetUser.tag}**. Reason: ${reason}`);
      }

      const targetMember = await interaction.guild.members.fetch(targetUser.id);
      const blocked = checkBotCanActOn(interaction, targetMember);
      if (blocked) return interaction.reply({ content: `⚠️ ${blocked}`, ephemeral: true });

      if (sub === 'timeout') {
        const minutes = interaction.options.getInteger('minutes');
        const capped = Math.min(minutes, 40320);
        await targetMember.timeout(capped * MS_PER_MINUTE, `${reason} — by ${interaction.user.tag}`);
        return interaction.reply(`⏱️ Timed out ${targetMember} for ${capped} minute(s). Reason: ${reason}`);
      }

      if (sub === 'kick') {
        await targetMember.kick(`${reason} — by ${interaction.user.tag}`);
        return interaction.reply(`👢 Kicked **${targetUser.tag}**. Reason: ${reason}`);
      }
    } catch (err) {
      console.error(err);
      return interaction.reply({ content: `❌ Discord rejected that action: ${err.message}`, ephemeral: true });
    }
  },
};
