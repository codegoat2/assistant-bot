import { TextChannel, EmbedBuilder } from 'discord.js';
import { getAssistantClient } from '../client';
import { announcementEmbed } from '../embeds';

export async function sendAnnouncement(
  channelId: string,
  title: string,
  content: string,
): Promise<void> {
  const client = getAssistantClient();
  const channel = await client.channels.fetch(channelId);
  if (!channel || !channel.isTextBased()) throw new Error('Channel not found');
  await (channel as TextChannel).send({ embeds: [announcementEmbed(title, content)] });
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
  await (channel as TextChannel).send({
    embeds: [
      new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .setTimestamp()
        .toJSON(),
    ],
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
      await (channel as TextChannel).send({ embeds: [announcementEmbed(title, content)] });
    } catch (err) {
      console.error(`Failed to broadcast to ${id}:`, err);
    }
  }
}
