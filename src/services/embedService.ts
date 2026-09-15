import { TextChannel, EmbedBuilder, Guild } from 'discord.js';
import { getAssistantClient } from '../client';
import { announcementEmbed, getGuildIconUrl } from '../embeds';
import { COLORS, BANNER_URL } from '../embeds/colors';

export async function sendAnnouncement(
  channelId: string,
  title: string,
  content: string,
): Promise<void> {
  const client = getAssistantClient();
  const channel = await client.channels.fetch(channelId);
  if (!channel || !channel.isTextBased()) throw new Error('Channel not found');
  
  const textChannel = channel as TextChannel;
  const guild = textChannel.guild;
  const guildIconUrl = getGuildIconUrl(guild);
  
  await textChannel.send({ embeds: [announcementEmbed(title, content, guildIconUrl)] });
}

export async function sendCustomEmbed(
  channelId: string,
  title: string,
  description: string,
  color: number,
): Promise<void> {
  const client = getAssistantClient();
  const channel = await client.channels.fetch(channelId);
  if (!channel || !channel.isTextBased()) throw new Error('Channel not found');
  
  const textChannel = channel as TextChannel;
  const guild = textChannel.guild;
  const guildIconUrl = getGuildIconUrl(guild);

  const embed = new EmbedBuilder()
    .setColor(color || COLORS.PRIMARY)
    .setTitle(title)
    .setDescription(description)
    .setImage(BANNER_URL)
    .setFooter({ text: 'RapidEx · Custom Embed' })
    .setTimestamp();

  if (guildIconUrl) {
    embed.setThumbnail(guildIconUrl);
  }

  await textChannel.send({
    embeds: [embed.toJSON()],
  });
}

export async function broadcastToAllChannels(
  channelIds: string[],
  title: string,
  content: string,
): Promise<void> {
  const client = getAssistantClient();
  for (const id of channelIds) {
    try {
      const channel = await client.channels.fetch(id);
      if (!channel || !channel.isTextBased()) continue;
      
      const textChannel = channel as TextChannel;
      const guild = textChannel.guild;
      const guildIconUrl = getGuildIconUrl(guild);
      
      await textChannel.send({ embeds: [announcementEmbed(title, content, guildIconUrl)] });
    } catch (err) {
      console.error(`Failed to broadcast to ${id}:`, err);
    }
  }
}
