import { EmbedBuilder, TextChannel } from 'discord.js';
import { getAssistantClient } from '../client';
import { logger } from '../utils/logger';

/** The channel ID where logs are sent. Set via /setlog. */
let logChannelId: string | null = null;

export function setLogChannel(channelId: string): void {
  logChannelId = channelId;
  logger.info(`[LogService] Log channel set to ${channelId}`);
}

export function getLogChannelId(): string | null {
  return logChannelId;
}

/**
 * Send an embed to the configured log channel.
 * Silently drops the log if no channel is configured or if it fails.
 */
export async function sendLog(embed: EmbedBuilder): Promise<void> {
  if (!logChannelId) return;

  try {
    const client = getAssistantClient();
    const channel = await client.channels.fetch(logChannelId);
    if (!channel || !channel.isTextBased()) return;
    await (channel as TextChannel).send({ embeds: [embed.toJSON()] });
  } catch (err) {
    logger.warn(`[LogService] Failed to send log: ${String(err)}`);
  }
}
