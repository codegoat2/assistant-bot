import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
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

    // Get guild icon for thumbnail
    const guild = interaction.guild;
    const guildIconUrl = getGuildIconUrl(guild);

    // Create fee information embed
    const embed = new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle(`${E.ARROW} RapidEx Fee Structure`)
      .setDescription(
        `Welcome to **RapidEx**! Here's our transparent fee structure for all cryptocurrency exchanges.`
      )
      .addFields(
        {
          name: `${E.BUY} Base Exchange Fee`,
          value: `**${DEFAULT_FEE_PERCENTAGE}%** on all transactions`,
          inline: false,
        },
        {
          name: `${E.REVOLUT} Revolut`,
          value: `Minimum Fee: **$${MINIMUM_FEES.REVOLUT} USD**`,
          inline: true,
        },
        {
          name: `${E.BANK} Bank Transfer`,
          value: `Minimum Fee: **$${MINIMUM_FEES.BANK_TRANSFER} USD**`,
          inline: true,
        },
        {
          name: `${E.PAYPAL} PayPal`,
          value: `Minimum Fee: **$${MINIMUM_FEES.PAYPAL} USD**`,
          inline: true,
        },
        {
          name: `${E.DEBTCARD} Wise`,
          value: `Minimum Fee: **$${MINIMUM_FEES.WISE} USD**`,
          inline: true,
        },
        {
          name: `${E.BINANCE} Binance Gift Card`,
          value: `Minimum Fee: **$${MINIMUM_FEES.OTHER} USD**`,
          inline: true,
        },
        {
          name: `${E.PAYSAFE} Paysafe Card`,
          value: `Minimum Fee: **$${MINIMUM_FEES.OTHER} USD**`,
          inline: true,
        },
        {
          name: `${E.APPLE} Apple Pay`,
          value: `Minimum Fee: **$${MINIMUM_FEES.OTHER} USD**`,
          inline: true,
        },
        {
          name: `${E.CASHAPP} CashApp`,
          value: `Minimum Fee: **$${MINIMUM_FEES.OTHER} USD**`,
          inline: true,
        }
      )
      .addFields({
        name: `${E.CHECK} How It Works`,
        value: `The final fee is the **higher of**:
• **${DEFAULT_FEE_PERCENTAGE}%** of your transaction amount
• The **minimum fee** for your payment method

This ensures competitive rates while maintaining service quality.`,
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

    // Send the embed to the channel (not ephemeral)
    if (interaction.channel && 'send' in interaction.channel) {
      await interaction.channel.send({
        embeds: [embed],
      });
    }

    // Confirm to the user (ephemeral)
    await interaction.editReply({
      content: '✅ Fee information embed posted successfully!',
    });

    logger.info(
      `Fee embed posted to channel ${interaction.channelId} in guild ${interaction.guildId}`
    );
  } catch (err) {
    logger.error(
      `Failed to post fee embed: ${String(err)}`
    );
    await interaction.editReply(
      `❌ Failed to post fee embed: ${String(err)}`
    );
  }
}
