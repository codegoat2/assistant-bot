import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Interaction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
} from 'discord.js';
import {
  calculateFees,
  formatFeeBreakdown,
  PAYMENT_METHODS,
  CRYPTOCURRENCIES,
  FIAT_CURRENCIES,
} from '../services/feeService';
import { getGuildIconUrl } from '../embeds';
import { COLORS, BANNER_URL } from '../embeds/colors';
import { logger } from '../utils/logger';

export const feesCommand = new SlashCommandBuilder()
  .setName('fees')
  .setDescription('Calculate exchange fees')
  .setDefaultMemberPermissions(0); // Admin only

export async function handleFees(
  interaction: ChatInputCommandInteraction | any
): Promise<void> {
  // Handle both slash commands and button interactions
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply({ ephemeral: true });
  }

  try {
    // Step 1: Ask for crypto currency
    const cryptoSelect = new StringSelectMenuBuilder()
      .setCustomId('fees_select_crypto')
      .setPlaceholder('Select cryptocurrency')
      .addOptions(
        CRYPTOCURRENCIES.map(crypto =>
          new StringSelectMenuOptionBuilder()
            .setLabel(crypto.label)
            .setValue(crypto.value)
        )
      );

    const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      cryptoSelect
    );

    await interaction.editReply({
      content: 'Step 1: Select cryptocurrency',
      components: [row1],
    });
  } catch (err) {
    logger.error(`Fees command error: ${String(err)}`);
    await interaction.editReply(
      `❌ Failed to initialize fees command: ${String(err)}`
    );
  }
}

/**
 * Handle the cascading menu selections
 */
export async function handleFeesInteraction(interaction: Interaction): Promise<void> {
  if (!interaction.isStringSelectMenu()) return;

  const customId = interaction.customId;
  const userId = interaction.user.id;
  const channelId = interaction.channelId;

  // Store state in customId — format: fees_step_stepName_userId
  // This keeps state in the UI without external storage

  try {
    if (customId === 'fees_select_crypto') {
      const crypto = interaction.values[0];

      const fiatSelect = new StringSelectMenuBuilder()
        .setCustomId(`fees_select_fiat_${crypto}_${userId}`)
        .setPlaceholder('Select fiat currency')
        .addOptions(
          FIAT_CURRENCIES.map(fiat =>
            new StringSelectMenuOptionBuilder()
              .setLabel(fiat.label)
              .setValue(fiat.value)
          )
        );

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        fiatSelect
      );

      await interaction.update({
        content: `Step 2: Select fiat currency (${crypto} → ?)`,
        components: [row],
      });
    } else if (customId.startsWith('fees_select_fiat_')) {
      const [, , crypto, userId2] = customId.split('_');
      const fiat = interaction.values[0];

      if (userId2 !== userId) {
        await interaction.reply({
          content: '❌ You cannot use this interaction.',
          ephemeral: true,
        });
        return;
      }

      const paymentSelect = new StringSelectMenuBuilder()
        .setCustomId(`fees_select_payment_${crypto}_${fiat}_${userId}`)
        .setPlaceholder('Select payment method')
        .addOptions(
          PAYMENT_METHODS.map(method =>
            new StringSelectMenuOptionBuilder()
              .setLabel(method.label)
              .setValue(method.value)
          )
        );

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        paymentSelect
      );

      await interaction.update({
        content: `Step 3: Select payment method (${crypto} → ${fiat})`,
        components: [row],
      });
    } else if (customId.startsWith('fees_select_payment_')) {
      const parts = customId.split('_');
      const crypto = parts[3];
      const fiat = parts[4];
      const userId2 = parts[5];
      const paymentMethod = interaction.values[0];

      if (userId2 !== userId) {
        await interaction.reply({
          content: '❌ You cannot use this interaction.',
          ephemeral: true,
        });
        return;
      }

      // Show amount input modal
      const modal = new ModalBuilder()
        .setCustomId(`fees_amount_modal_${crypto}_${fiat}_${paymentMethod}_${userId}`)
        .setTitle('Enter Amount')
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('amount_input')
              .setLabel(`Amount in ${fiat}`)
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('e.g., 100')
              .setRequired(true)
          )
        );

      await interaction.showModal(modal);
    }
  } catch (err) {
    logger.error(`Fees interaction error: ${String(err)}`);
    try {
      await interaction.reply({
        content: `❌ Error processing selection: ${String(err)}`,
        ephemeral: true,
      });
    } catch { /* interaction already replied */ }
  }
}

/**
 * Handle modal submission (amount input)
 */
export async function handleFeesModal(
  interaction: ModalSubmitInteraction
): Promise<void> {
  const customId = interaction.customId;
  const userId = interaction.user.id;

  try {
    if (customId.startsWith('fees_amount_modal_')) {
      const parts = customId.split('_');
      const crypto = parts[3];
      const fiat = parts[4];
      const paymentMethod = parts[5];
      const userId2 = parts[6];

      if (userId2 !== userId) {
        await interaction.reply({
          content: '❌ You cannot use this interaction.',
          ephemeral: true,
        });
        return;
      }

      const amountStr = interaction.fields.getTextInputValue('amount_input');
      const amount = parseFloat(amountStr);

      if (isNaN(amount) || amount <= 0) {
        await interaction.reply({
          content: '❌ Please enter a valid amount.',
          ephemeral: true,
        });
        return;
      }

      // Calculate fees
      const fees = calculateFees(amount, paymentMethod);

      // Get guild icon for thumbnail
      const guild = interaction.guild;
      const guildIconUrl = getGuildIconUrl(guild);

      // Create embed with RapidEx branding
      const embed = new EmbedBuilder()
        .setColor(COLORS.SUCCESS)
        .setTitle('💱 RapidEx Fee Calculation')
        .setDescription(
          formatFeeBreakdown(crypto, fiat, paymentMethod, amount, fees)
        )
        .setFooter({
          text: `RapidEx · Secure Exchange`,
          iconURL: interaction.client.user?.displayAvatarURL(),
        })
        .setImage(BANNER_URL)
        .setTimestamp();

      if (guildIconUrl) {
        embed.setThumbnail(guildIconUrl);
      }

      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }
  } catch (err) {
    logger.error(`Fees modal error: ${String(err)}`);
    try {
      await interaction.reply({
        content: `❌ Error calculating fees: ${String(err)}`,
        ephemeral: true,
      });
    } catch { /* interaction already replied */ }
  }
}
