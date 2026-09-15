import { TextChannel } from 'discord.js';
import { getAssistantClient } from '../client';
import { nukeEmbed, getGuildIconUrl } from '../embeds';
import { config } from '../config/env';

let bombInterval: NodeJS.Timeout | null = null;

export function startNukeService(): void {
  const channelId = config.BOMB_CHANNEL_ID;
  if (!channelId) return;

  const run = async () => {
    try {
      const client = getAssistantClient();
      const channel = await client.channels.fetch(channelId);
      if (!channel || !channel.isTextBased()) return;

      const textChannel = channel as TextChannel;
      const guild = textChannel.guild;
      const guildIconUrl = getGuildIconUrl(guild);
      const nextNuke = new Date(Date.now() + 60 * 60 * 1000);

      await textChannel.send({
        embeds: [nukeEmbed(textChannel.name, nextNuke, guildIconUrl)],
      });
    } catch (err) {
      console.error('Nuke service error:', err);
    }
  };

  run();
  bombInterval = setInterval(run, 60 * 60 * 1000);
}

export function stopNukeService(): void {
  if (bombInterval) {
    clearInterval(bombInterval);
    bombInterval = null;
  }
}
