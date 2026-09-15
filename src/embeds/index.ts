import { EmbedBuilder, Guild } from 'discord.js';
import { COLORS, BANNER_URL } from './colors';

/**
 * Extract guild icon URL to use as embed thumbnail (logo)
 */
export function getGuildIconUrl(guild: Guild | null): string | null {
  if (!guild || !guild.icon) return null;
  return guild.iconURL({ size: 512 }) ?? null;
}

export function giveawayEmbed(title: string, description: string, endsAt: Date, winners: number, guildIconUrl?: string | null) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.GIVEAWAY)
    .setTitle(`🎉 ${title}`)
    .setDescription(description)
    .addFields(
      { name: 'Ends', value: `<t:${Math.floor(endsAt.getTime() / 1000)}:R>`, inline: true },
      { name: 'Winners', value: String(winners), inline: true },
    )
    .setTimestamp()
    .setImage(BANNER_URL)
    .setFooter({ text: 'RapidEx · Giveaway' });

  if (guildIconUrl) {
    embed.setThumbnail(guildIconUrl);
  }

  return embed.toJSON();
}

export function nukeEmbed(channelName: string, nextNuke: Date, guildIconUrl?: string | null) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.NUKE)
    .setTitle('🧹 Channel Bombed')
    .setDescription(
      `This channel gets **cleaned every hour** to maintain a professional environment.\n\n` +
      `**Why?** This ensures clean, organized communication for all members.\n\n` +
      `All messages are removed to start fresh. Follow server guidelines to avoid deletion.\n\n` +
      `${COLORS.WARNING && '✨'} Next cleaning: <t:${Math.floor(nextNuke.getTime() / 1000)}:R>`,
    )
    .addFields(
      { name: '📋 Channel', value: `#${channelName || 'unknown'}`, inline: true },
      { name: '⏰ Next Bomb', value: `<t:${Math.floor(nextNuke.getTime() / 1000)}:R>`, inline: true },
    )
    .setFooter({ text: 'RapidEx · Automatic Channel Maintenance' })
    .setImage(BANNER_URL)
    .setTimestamp();

  if (guildIconUrl) {
    embed.setThumbnail(guildIconUrl);
  }

  return embed.toJSON();
}

export function ltcRatesEmbed(eurPrice: string, usdPrice: string, nextNuke: Date, guildIconUrl?: string | null) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.INFO)
    .setTitle('💱 Current LTC Rates')
    .addFields(
      { name: '€ EUR', value: `**€${eurPrice}**`, inline: true },
      { name: '$ USD', value: `**$${usdPrice}**`, inline: true },
      { name: '📝 Fun Fact', value: 'The average person laughs 10 times a day!' },
    )
    .setFooter({ text: 'RapidEx · Live Crypto Rates' })
    .setImage(BANNER_URL)
    .setTimestamp();

  if (guildIconUrl) {
    embed.setThumbnail(guildIconUrl);
  }

  return embed.toJSON();
}

export function announcementEmbed(title: string, content: string, guildIconUrl?: string | null) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.EMBED)
    .setTitle(`📢 ${title}`)
    .setDescription(content)
    .setFooter({ text: 'RapidEx · Announcement' })
    .setImage(BANNER_URL)
    .setTimestamp();

  if (guildIconUrl) {
    embed.setThumbnail(guildIconUrl);
  }

  return embed.toJSON();
}
