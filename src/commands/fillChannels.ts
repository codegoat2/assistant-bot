import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import { fillAllChannels } from '../services/channelFillService';
import { COLORS, BANNER_URL } from '../embeds/colors';
import { logger } from '../utils/logger';

export const fillChannelsCommand = new SlashCommandBuilder()
  .setName('fill-channels')
  .setDescription('Post all panels and embeds into the server channels without rebuilding anything')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function handleFillChannels(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: '❌ Must be used inside a server.', ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const steps: string[] = [];

  try {
    await fillAllChannels(interaction.guild, {
      onStep: async (msg: string) => {
        logger.info(`[FillChannels] ${msg}`);
        steps.push(`\`${msg}\``);
        const visible = steps.slice(-8).join('\n');

        try {
          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(COLORS.INFO as any)
                .setTitle('◈ Filling Channels...')
                .setDescription(visible)
                .setFooter({ text: 'RapidEx · Channel Fill' })
                .setTimestamp() as any,
            ],
          });
        } catch { /* ignore if interaction expired */ }
      },
    });

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.SUCCESS as any)
          .setTitle('★ Channels Filled')
          .setDescription(
            'All panels and embeds have been posted into their channels.\n\n' +
            steps.join('\n'),
          )
          .setImage(BANNER_URL)
          .setFooter({ text: 'RapidEx · Channel Fill' })
          .setTimestamp() as any,
      ],
    });
  } catch (err) {
    logger.error(`[FillChannels] ${String(err)}`);
    await interaction.editReply({ content: `❌ Fill failed: ${String(err)}` });
  }
}
