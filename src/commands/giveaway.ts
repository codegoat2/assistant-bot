import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import { createGiveaway, getGiveaway, deleteGiveaway, getAllGiveaways, endGiveaway } from '../services/giveawayService';
import { giveawayEmbed } from '../embeds';
import { config } from '../config/env';

export const startGiveawayCommand = new SlashCommandBuilder()
  .setName('giveaway-start')
  .setDescription('Start a giveaway')
  .addStringOption(o => o.setName('prize').setDescription('Prize name').setRequired(true))
  .addIntegerOption(o => o.setName('duration').setDescription('Duration in minutes').setRequired(true).setMinValue(1))
  .addIntegerOption(o => o.setName('winners').setDescription('Number of winners').setRequired(true).setMinValue(1))
  .setDefaultMemberPermissions(0);

export const endGiveawayCommand = new SlashCommandBuilder()
  .setName('giveaway-end')
  .setDescription('End a giveaway early')
  .addStringOption(o => o.setName('message_id').setDescription('Giveaway message ID').setRequired(true))
  .setDefaultMemberPermissions(0);

export const listGiveawaysCommand = new SlashCommandBuilder()
  .setName('giveaway-list')
  .setDescription('List active giveaways')
  .setDefaultMemberPermissions(0);

export async function handleStartGiveaway(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const prize = interaction.options.getString('prize', true);
  const duration = interaction.options.getInteger('duration', true);
  const winners = interaction.options.getInteger('winners', true);

  const channelId = config.GIVEAWAY_CHANNEL_ID || interaction.channelId;
  const giveaway = createGiveaway(channelId, prize, duration, winners);

  try {
    const client = interaction.client;
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      await interaction.editReply('❌ Giveaway channel not found.');
      return;
    }

    const textChannel = channel as TextChannel;
    const endsAt = giveaway.endsAt;

    const embed = giveawayEmbed(`${prize}`, 'React with 🎉 to enter!', endsAt, winners);

    const message = await textChannel.send({
      embeds: [embed],
    });

    await message.react('🎉');

    await interaction.editReply({
      embeds: [
        new (await import('discord.js')).EmbedBuilder()
          .setColor(0x22C55E)
          .setTitle('✅ Giveaway Started')
          .addFields(
            { name: 'Prize', value: prize, inline: true },
            { name: 'Duration', value: `${duration} minutes`, inline: true },
            { name: 'Winners', value: String(winners), inline: true },
          )
          .setTimestamp(),
      ],
    });
  } catch (err) {
    deleteGiveaway(giveaway.messageId);
    await interaction.editReply(`❌ Failed to start giveaway: ${String(err)}`);
  }
}

export async function handleEndGiveaway(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const messageId = interaction.options.getString('message_id', true);
  const prize = await endGiveaway(messageId);

  if (!prize) {
    await interaction.editReply('❌ Giveaway not found or already ended.');
    return;
  }

  await interaction.editReply({
    embeds: [
      new (await import('discord.js')).EmbedBuilder()
        .setColor(0x22C55E)
        .setTitle('✅ Giveaway Ended')
        .setDescription(`Prize: **${prize}**`),
    ],
  });
}

export async function handleListGiveaways(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const giveaways = getAllGiveaways();

  if (giveaways.length === 0) {
    await interaction.editReply('No active giveaways.');
    return;
  }

  const lines = giveaways.map(g => {
    const timeLeft = Math.max(0, Math.floor((g.endsAt.getTime() - Date.now()) / 1000));
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `**${g.prize}** — ${mins}m ${secs}s left | Winners: ${g.winners} | ID: \`${g.messageId.slice(0, 8)}\``;
  }).join('\n\n');

  await interaction.editReply({
    embeds: [
      new (await import('discord.js')).EmbedBuilder()
        .setColor(0xEAB308)
        .setTitle('🎉 Active Giveaways')
        .setDescription(lines)
        .setTimestamp(),
    ],
  });
}
