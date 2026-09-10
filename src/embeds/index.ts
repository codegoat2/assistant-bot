import { EmbedBuilder } from 'discord.js';
import { COLORS } from './colors';

export function giveawayEmbed(title: string, description: string, endsAt: Date, winners: number) {
  return new EmbedBuilder()
    .setColor(COLORS.GIVEAWAY)
    .setTitle(`🎉 ${title}`)
    .setDescription(description)
    .addFields(
      { name: 'Ends', value: `<t:${Math.floor(endsAt.getTime() / 1000)}:R>`, inline: true },
      { name: 'Winners', value: String(winners), inline: true },
    )
    .setTimestamp();
}

export function nukeEmbed(channelName: string, nextNuke: Date) {
  return new EmbedBuilder()
    .setColor(COLORS.NUKE)
    .setTitle('Channel BOMBED')
    .setDescription(
      `This channel gets nuked **every hour** to maintain a clean environment.\n\nLearn More About Easy Exchange`,
    )
    .addFields(
      { name: 'Next Nuking', value: `<t:${Math.floor(nextNuke.getTime() / 1000)}:R>`, inline: true },
    )
    .setFooter({ text: 'Advertising is strictly prohibited' });
}

export function ltcRatesEmbed(eurPrice: string, usdPrice: string, nextNuke: Date) {
  return new EmbedBuilder()
    .setColor(COLORS.INFO)
    .setTitle('Current LTC Rates:')
    .addFields(
      { name: 'EUR', value: `€${eurPrice}`, inline: true },
      { name: 'USD', value: `$${usdPrice}`, inline: true },
    )
    .addFields(
      { name: 'Do you know that?', value: 'The average person laughs 10 times a day!' },
    )
    .setFooter({ text: 'Easy System — Fast & Safe Support!' });
}

export function announcementEmbed(title: string, content: string) {
  return new EmbedBuilder()
    .setColor(COLORS.EMBED)
    .setTitle(title)
    .setDescription(content)
    .setTimestamp();
}
