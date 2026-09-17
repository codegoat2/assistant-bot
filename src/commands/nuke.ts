import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import { startNukeService, stopNukeService, purgeChannel } from '../services/nukeService';
import { getGuildIconUrl, nukeEmbed, E } from '../embeds';
import { config } from '../config/env';

export const bombCommand = new SlashCommandBuilder()
  .setName('bomb')
  .setDescription('Trigger a channel bomb/nuke manually')
  .setDefaultMemberPermissions(0);

export const toggleBombCommand = new SlashCommandBuilder()
  .setName('toggle-bomb')
  .setDescription('Start or stop automatic nuking')
  .addStringOption(o => o.setName('action').setDescription('start or stop').setRequired(true).addChoices(
    { name: 'start', value: 'start' },
    { name: 'stop', value: 'stop' },
  ))
  .setDefaultMemberPermissions(0);

export async function handleBomb(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const channelId = config.BOMB_CHANNEL_ID || interaction.channelId;

  try {
    const client = interaction.client;
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      await interaction.editReply(`${E.NO} Channel not found.`);
      return;
    }

    const textChannel = channel as TextChannel;
    const guild = textChannel.guild;
    const guildIconUrl = getGuildIconUrl(guild);
    const nextNuke = new Date(Date.now() + 60 * 60 * 1000);

    // Purge all messages first, then post the nuke embed
    await purgeChannel(textChannel);

    await textChannel.send({ 
      embeds: [nukeEmbed(textChannel.name ?? 'channel', nextNuke, guildIconUrl)] 
    });

    await interaction.editReply(`${E.LOCK} Channel bombed!`);
  } catch (err) {
    await interaction.editReply(`${E.NO} Failed: ${String(err)}`);
  }
}

export async function handleToggleBomb(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const action = interaction.options.getString('action', true);

  if (action === 'start') {
    startNukeService();
    await interaction.editReply(`${E.CHECK} Automatic nuking started.`);
  } else {
    stopNukeService();
    await interaction.editReply(`${E.CHECK} Automatic nuking stopped.`);
  }
}
