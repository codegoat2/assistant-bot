import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { sendAnnouncement, sendCustomEmbed, broadcastToAllChannels } from '../services/embedService';
import { config } from '../config/env';
import { E } from '../embeds';

export const announceCommand = new SlashCommandBuilder()
  .setName('announce')
  .setDescription('Send an announcement embed')
  .addStringOption(o => o.setName('title').setDescription('Title').setRequired(true))
  .addStringOption(o => o.setName('content').setDescription('Content').setRequired(true))
  .addStringOption(o => o.setName('channel').setDescription('Channel ID (optional)').setRequired(false))
  .setDefaultMemberPermissions(0);

export const embedCommand = new SlashCommandBuilder()
  .setName('embed')
  .setDescription('Send a custom embed')
  .addStringOption(o => o.setName('title').setDescription('Title').setRequired(true))
  .addStringOption(o => o.setName('description').setDescription('Description').setRequired(true))
  .addStringOption(o => o.setName('channel').setDescription('Channel ID (optional)').setRequired(false))
  .setDefaultMemberPermissions(0);

export const broadcastCommand = new SlashCommandBuilder()
  .setName('broadcast')
  .setDescription('Broadcast to multiple channels')
  .addStringOption(o => o.setName('title').setDescription('Title').setRequired(true))
  .addStringOption(o => o.setName('content').setDescription('Content').setRequired(true))
  .addStringOption(o => o.setName('channels').setDescription('Channel IDs separated by comma').setRequired(true))
  .setDefaultMemberPermissions(0);

export async function handleAnnounce(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const title = interaction.options.getString('title', true);
  const content = interaction.options.getString('content', true);
  const channelId = interaction.options.getString('channel') || config.ANNOUNCEMENT_CHANNEL_ID || interaction.channelId;

  try {
    await sendAnnouncement(channelId, title, content);
    await interaction.editReply(`${E.CHECK} Announcement sent.`);
  } catch (err) {
    await interaction.editReply(`${E.NO} Failed: ${String(err)}`);
  }
}

export async function handleEmbed(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const title = interaction.options.getString('title', true);
  const description = interaction.options.getString('description', true);
  const channelId = interaction.options.getString('channel') || interaction.channelId;

  try {
    await sendCustomEmbed(channelId, title, description, 0x8B5CF6);
    await interaction.editReply(`${E.CHECK} Embed sent.`);
  } catch (err) {
    await interaction.editReply(`${E.NO} Failed: ${String(err)}`);
  }
}

export async function handleBroadcast(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const title = interaction.options.getString('title', true);
  const content = interaction.options.getString('content', true);
  const channelsRaw = interaction.options.getString('channels', true);
  const channelIds = channelsRaw.split(',').map(id => id.trim()).filter(Boolean);

  if (channelIds.length === 0) {
    await interaction.editReply(`${E.NO} No valid channel IDs provided.`);
    return;
  }

  try {
    await broadcastToAllChannels(channelIds, title, content);
    await interaction.editReply(`${E.CHECK} Broadcasted to ${channelIds.length} channel(s).`);
  } catch (err) {
    await interaction.editReply(`${E.NO} Failed: ${String(err)}`);
  }
}
