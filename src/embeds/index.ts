import { EmbedBuilder, Guild } from 'discord.js';
import { COLORS, BANNER_URL } from './colors';

// ---------------------------------------------------------------------------
// Custom server emojis from main bot
// ---------------------------------------------------------------------------

export const E = {
  BTC:      '<:1425bitcoin:1546527437406343299>',
  LTC:      '<:2625crypto:1546528103176601712>',
  ETH:      '<:3031ethereum:1546527560328941669>',
  SOL:      '<:19845solana:1546527612694831184>',
  USDT:     '<:7541tetherusdt:1546527696937291796>',
  REVOLUT:  '<:6383revolut:1546528170130407564>',
  BANK:     '<:bank:1546528985406636113>',
  BINANCE:  '<:Binance:1546528855886659678>',
  PAYSAFE:  '<:3459paysafecard:1546531852414623774>',
  APPLE:    '<:9823applepaylogo:1546528385470304276>',
  CASHAPP:  '<:55778cashapp:1546528307242340462>',
  PAYPAL:   '<:51891paypal:1546528262531059825>',
  DEBTCARD: '<:DebtCard:1547332209684381756>',
  LOCK:     '<:lock:1547331951877165128>',
  ARROW:    '<:Arrow:1547330759571017768>',
  BUY:      '<:emojigg_Buy:1547330997002043404>',
  CHECK:    '<:GreenCheckmark:1547332810048667659>',
  NO:       '<:emojigg_no:1547332976201830441>',
} as const;

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
    .setTitle(`${E.BUY} ${title}`)
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
    .setTitle(`${E.LOCK} Channel Bombed`)
    .setDescription(
      `This channel gets **cleaned every hour** to maintain a professional environment.\n\n` +
      `**Why?** This ensures clean, organized communication for all members.\n\n` +
      `All messages are removed to start fresh. Follow server guidelines to avoid deletion.\n\n` +
      `${E.CHECK} Next cleaning: <t:${Math.floor(nextNuke.getTime() / 1000)}:R>`,
    )
    .addFields(
      { name: `${E.ARROW} Channel`, value: `#${channelName || 'unknown'}`, inline: true },
      { name: `${E.LOCK} Next Bomb`, value: `<t:${Math.floor(nextNuke.getTime() / 1000)}:R>`, inline: true },
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
    .setTitle(`${E.LTC} Current LTC Rates`)
    .addFields(
      { name: '€ EUR', value: `**€${eurPrice}**`, inline: true },
      { name: '$ USD', value: `**$${usdPrice}**`, inline: true },
      { name: `${E.CHECK} Fun Fact`, value: 'The average person laughs 10 times a day!' },
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
    .setTitle(`${E.ARROW} ${title}`)
    .setDescription(content)
    .setFooter({ text: 'RapidEx · Announcement' })
    .setImage(BANNER_URL)
    .setTimestamp();

  if (guildIconUrl) {
    embed.setThumbnail(guildIconUrl);
  }

  return embed.toJSON();
}
