import { TextChannel } from 'discord.js';
import { getAssistantClient } from '../client';
import { nukeEmbed, getGuildIconUrl } from '../embeds';
import { config } from '../config/env';

let bombInterval: NodeJS.Timeout | null = null;

/**
 * Bulk-deletes all messages in a TextChannel.
 * Discord's bulkDelete only handles messages < 14 days old and max 100 at a time,
 * so we loop until nothing is left (or only old messages remain).
 */
export async function purgeChannel(textChannel: TextChannel): Promise<void> {
  let deleted = 0;

  while (true) {
    const messages = await textChannel.messages.fetch({ limit: 100 });
    if (messages.size === 0) break;

    // Filter out messages that can't be deleted (system messages, ephemeral, etc.)
    const deletable = messages.filter(m => m.deletable);
    if (deletable.size === 0) break;

    if (deletable.size === 1) {
      try {
        await deletable.first()!.delete();
        deleted += 1;
      } catch { /* ignore individual delete failures */ }
      break;
    }

    // bulkDelete with filterOld=true silently skips messages >14 days old
    const result = await textChannel.bulkDelete(deletable, true);
    deleted += result.size;

    // If nothing was deleted (all remaining are >14 days old), stop to avoid infinite loop
    if (result.size === 0) break;

    // Small pause to avoid hitting rate limits on large channels
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`[NukeService] Purged ${deleted} messages from #${textChannel.name}`);
}

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

      // Delete all messages first, then post the nuke embed
      await purgeChannel(textChannel);

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
