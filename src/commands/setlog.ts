import { SlashCommandBuilder, ChatInputCommandInteraction, ChannelType, TextChannel } from 'discord.js';
import { setLogChannel, getLogChannelId } from '../services/logService';
import { E } from '../embeds';

export const setlogCommand = new SlashCommandBuilder()
  .setName('setlog')
  .setDescription('Set or view the server log channel')
  .addSubcommand(sub =>
    sub
      .setName('set')
      .setDescription('Set the channel where all server logs will be sent')
      .addChannelOption(o =>
        o
          .setName('channel')
          .setDescription('The text channel to send logs to')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true),
      ),
  )
  .addSubcommand(sub =>
    sub.setName('view').setDescription('Show the current log channel'),
  )
  .setDefaultMemberPermissions(0); // admin only

export async function handleSetlog(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const sub = interaction.options.getSubcommand(true);

  if (sub === 'set') {
    const channel = interaction.options.getChannel('channel', true) as TextChannel;
    setLogChannel(channel.id);
    await interaction.editReply(
      `${E.CHECK} Log channel set to <#${channel.id}>. All server events will be logged there.`,
    );
    return;
  }

  // sub === 'view'
  const current = getLogChannelId();
  if (!current) {
    await interaction.editReply(
      `${E.NO} No log channel is configured. Use \`/setlog set\` to set one.`,
    );
    return;
  }

  await interaction.editReply(`${E.CHECK} Current log channel: <#${current}>`);
}
