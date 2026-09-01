const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { hasPermission } = require('../permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('channel')
    .setDescription('Lock or unlock a channel')
    .addSubcommand(sub =>
      sub.setName('lock')
        .setDescription('Prevent @everyone from sending messages here')
        .addChannelOption(o => o.setName('channel').setDescription('Channel to lock (defaults to current)').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('unlock')
        .setDescription('Restore @everyone\'s ability to send messages here')
        .addChannelOption(o => o.setName('channel').setDescription('Channel to unlock (defaults to current)').setRequired(false))
    ),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ content: "You need the **Manage Channels** permission to use this.", ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const everyoneRole = interaction.guild.roles.everyone;

    try {
      if (sub === 'lock') {
        await channel.permissionOverwrites.edit(everyoneRole, { SendMessages: false }, { reason: `Locked by ${interaction.user.tag}` });
        return interaction.reply(`🔒 Locked ${channel}. Only members with an override or elevated role can send messages now.`);
      }

      if (sub === 'unlock') {
        await channel.permissionOverwrites.edit(everyoneRole, { SendMessages: null }, { reason: `Unlocked by ${interaction.user.tag}` });
        return interaction.reply(`🔓 Unlocked ${channel}. Everyone can send messages again.`);
      }
    } catch (err) {
      console.error(err);
      return interaction.reply({ content: `❌ Discord rejected that action: ${err.message}`, ephemeral: true });
    }
  },
};
