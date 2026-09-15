import { TextChannel, EmbedBuilder } from 'discord.js';
import { getAssistantClient } from '../client';

type GiveawayData = {
  messageId: string;
  channelId: string;
  endsAt: Date;
  winners: number;
  prize: string;
};

const giveaways = new Map<string, GiveawayData>();

export function createGiveaway(
  channelId: string,
  prize: string,
  durationMinutes: number,
  winners: number,
): GiveawayData {
  const messageId = `giveaway-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const endsAt = new Date(Date.now() + durationMinutes * 60 * 1000);
  const data: GiveawayData = { messageId, channelId, endsAt, winners, prize };
  giveaways.set(messageId, data);
  return data;
}

export function getGiveaway(messageId: string): GiveawayData | undefined {
  return giveaways.get(messageId);
}

export function getAllGiveaways(): GiveawayData[] {
  return Array.from(giveaways.values());
}

export function deleteGiveaway(messageId: string): boolean {
  return giveaways.delete(messageId);
}

export async function endGiveaway(messageId: string): Promise<string | null> {
  const giveaway = giveaways.get(messageId);
  if (!giveaway) return null;

  try {
    const client = getAssistantClient();
    const channel = await client.channels.fetch(giveaway.channelId);
    if (!channel || !channel.isTextBased()) return null;

    await (channel as TextChannel).send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x22C55E)
          .setTitle('🎉 Giveaway Ended')
          .setDescription(`Prize: **${giveaway.prize}**\nWinners: **${giveaway.winners}**`)
          .toJSON(),
      ],
    });
  } catch (err) {
    console.error('End giveaway error:', err);
  }

  giveaways.delete(messageId);
  return giveaway.prize;
}

export function startGiveawayCleanupWorker(): void {
  setInterval(() => {
    const now = Date.now();
    for (const [id, g] of giveaways.entries()) {
      if (now >= g.endsAt.getTime()) {
        endGiveaway(id);
      }
    }
  }, 30 * 1000);
}
