import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  TextChannel,
} from 'discord.js';
import { getGuildIconUrl } from '../embeds';
import { COLORS, BANNER_URL } from '../embeds/colors';
import { E } from '../embeds';
import { logger } from '../utils/logger';
import { MINIMUM_FEES, DEFAULT_FEE_PERCENTAGE } from '../services/feeService';

export const postFeeEmbedCommand = new SlashCommandBuilder()
  .setName('postfeeembed')
  .setDescription('Post permanent fee information embed (Admin only)')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function handlePostFeeEmbed(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  try {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const guildIconUrl = getGuildIconUrl(guild);

    const embed = new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle(`${E.ARROW} RapidEx Fee Structure`)
      .setDescription(
        `Welcome to **RapidEx**! Here's our transparent fee structure for all cryptocurrency exchanges.\n\n**Click the button below to calculate your fees!**`
      )
      .addFields(
        {
          name: `${E.BUY} Base Exchange Fee`,
          value: `**${DEFAULT_FEE_PERCENTAGE}%** on all transactions`,
          inline: false,
        },
        {
          name: `${E.PAYPAL} PayPal`,
          value: `Minimum Fee: **$${MINIMUM_FEES['PAYPAL']} USD**`,
          inline: true,
        },
        {
          name: `${E.REVOLUT} Revolut`,
          value: `Minimum Fee: **$${MINIMUM_FEES['REVOLUT']} USD**`,
          inline: true,
        },
        {
          name: `💳 Wise`,
          value: `Minimum Fee: **$${MINIMUM_FEES['WISE']} USD**`,
          inline: true,
        },
        {
          name: `${E.BANK} Bank Transfer`,
          value: `Minimum Fee: **$${MINIMUM_FEES['BANK_TRANSFER']} USD**`,
          inline: true,
        },
        {
          name: `${E.CASHAPP} Cash In Person`,
          value: `Minimum Fee: **$${MINIMUM_FEES['CASH_IN_PERSON']} USD**`,
          inline: true,
        },
        {
          name: `💬 Other Methods`,
          value: `Minimum Fee: **$${MINIMUM_FEES['OTHER']} USD**`,
          inline: true,
        }
      )
      .addFields({
        name: `${E.CHECK} How It Works`,
        value: `The final fee is the **higher of**:\n• **${DEFAULT_FEE_PERCENTAGE}%** of your transaction amount\n• The **minimum fee** for your payment method\n\nThis ensures competitive rates while maintaining service quality.`,
        inline: false,
      })
      .setFooter({
        text: 'RapidEx · Fair & Transparent Fees',
        iconURL: interaction.client.user?.displayAvatarURL(),
      })
      .setImage(BANNER_URL)
      .setTimestamp();

    if (guildIconUrl) {
      embed.setThumbnail(guildIconUrl);
    }

    const button = new ButtonBuilder()
      .setCustomId('fee_calc_start')
      .setLabel('💱 Calculate Fees')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    // Cast to TextChannel to access send() — only usable in guild text channels
    const channel = interaction.channel as TextChannel;
    await channel.send({
      embeds: [embed],
      components: [row],
    });

    await interaction.editReply({ content: '✅ Fee information embed posted successfully!' });

    logger.info(`Fee embed posted in channel ${interaction.channelId}`);
  } catch (err) {
    logger.error(`Failed to post fee embed: ${String(err)}`);
    await interaction.editReply(`❌ Failed to post fee embed: ${String(err)}`);
  }
}
