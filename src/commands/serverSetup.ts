import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
  PermissionFlagsBits,
} from 'discord.js';
import {
  runServerSetup,
  setupSummaryEmbed,
  ROLE_DEFINITIONS,
  SERVER_STRUCTURE,
} from '../services/serverSetupService';
import { COLORS, BANNER_URL } from '../embeds/colors';
import { logger } from '../utils/logger';

export const setupServerCommand = new SlashCommandBuilder()
  .setName('setup-server')
  .setDescription('Wipe and rebuild the entire server structure — roles, categories, and channels')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function handleSetupServer(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: '❌ This command must be used inside a server.', ephemeral: true });
    return;
  }

  // ── Step 1: show confirmation prompt ─────────────────────────────────────
  const totalChannels = SERVER_STRUCTURE.reduce((acc, c) => acc + c.channels.length, 0);

  const warningEmbed = new EmbedBuilder()
    .setColor(COLORS.ERROR as any)
    .setTitle('⚠ Server Setup — Confirmation Required')
    .setDescription(
      '**This will permanently delete ALL existing channels, categories, and roles** ' +
      'then rebuild the full RapidEx server structure from scratch.\n\n' +
      '> This action **cannot be undone**. All message history in every channel will be lost.\n\n' +
      `**What will be created:**\n` +
      `» **${ROLE_DEFINITIONS.length} roles** — Admin, Staff, Trial Staff, Exchangers, Customer tiers, Member, Verified, Unverified\n` +
      `» **${SERVER_STRUCTURE.length} categories** — Information, Services, Public, Customer Lounge, Applications, Support, Exchanger Zone, Opened Exchanges, Staff, Admin\n` +
      `» **~${totalChannels} channels** — with role-specific permissions\n\n` +
      '**Click ✔ Confirm to proceed or ✖ Cancel to abort.**',
    )
    .setImage(BANNER_URL)
    .setFooter({ text: 'RapidEx · Server Setup' })
    .setTimestamp();

  const confirmBtn = new ButtonBuilder()
    .setCustomId('setup_confirm')
    .setLabel('✔ Confirm — Rebuild Server')
    .setStyle(ButtonStyle.Danger);

  const cancelBtn = new ButtonBuilder()
    .setCustomId('setup_cancel')
    .setLabel('✖ Cancel')
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmBtn, cancelBtn);

  // Use as any to avoid the discord-api-types version mismatch that affects the whole project
  await interaction.reply({
    embeds: [warningEmbed as any],
    components: [row as any],
    ephemeral: true,
  });

  // ── Step 2: wait for button response (60s) ────────────────────────────────
  const reply = await interaction.fetchReply();

  let confirmed = false;
  try {
    const btnInteraction = await reply.awaitMessageComponent({
      componentType: ComponentType.Button,
      filter: (i) => i.user.id === interaction.user.id,
      time: 60_000,
    });

    if (btnInteraction.customId === 'setup_cancel') {
      await btnInteraction.update({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.WARNING as any)
            .setTitle('✖ Setup Cancelled')
            .setDescription('No changes were made.')
            .setTimestamp() as any,
        ],
        components: [],
      });
      return;
    }

    confirmed = btnInteraction.customId === 'setup_confirm';

    // Acknowledge + switch to progress embed
    await btnInteraction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.INFO as any)
          .setTitle('◈ Setup In Progress')
          .setDescription('Starting server rebuild — this will take a minute...\n\n`Initialising...`')
          .setTimestamp()
          .setFooter({ text: 'RapidEx · Server Setup' }) as any,
      ],
      components: [],
    });
  } catch {
    // Timed out
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.ERROR as any)
          .setTitle('✖ Setup Timed Out')
          .setDescription('No response received. Setup was not started.')
          .setTimestamp() as any,
      ],
      components: [],
    });
    return;
  }

  if (!confirmed) return;

  // ── Step 3: run setup with live progress updates ──────────────────────────
  const steps: string[] = [];

  try {
    await runServerSetup(interaction.guild, {
      onStep: async (msg: string) => {
        logger.info(`[ServerSetup] ${msg}`);
        steps.push(`\`${msg}\``);
        const visible = steps.slice(-6).join('\n');

        try {
          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(COLORS.INFO as any)
                .setTitle('◈ Setup In Progress')
                .setDescription(`**Progress:**\n\n${visible}`)
                .setTimestamp()
                .setFooter({ text: 'RapidEx · Server Setup' }) as any,
            ],
            components: [],
          });
        } catch { /* interaction channel may have been deleted mid-setup */ }
      },
    });

    // ── Done ─────────────────────────────────────────────────────────────
    try {
      await interaction.editReply({
        embeds: [
          setupSummaryEmbed(ROLE_DEFINITIONS.length, totalChannels, SERVER_STRUCTURE.length)
            .setImage(BANNER_URL) as any,
        ],
        components: [],
      });
    } catch { /* channel gone — setup still completed successfully */ }

    logger.info(`[ServerSetup] Server "${interaction.guild.name}" rebuilt by ${interaction.user.tag}`);
  } catch (err) {
    logger.error(`[ServerSetup] Fatal error: ${String(err)}`);

    try {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.ERROR as any)
            .setTitle('✖ Setup Failed')
            .setDescription(
              `An error occurred during setup.\n\n**Error:** \`${String(err)}\`\n\n` +
              `The server may be partially rebuilt. Run \`/setup-server\` again to retry.`,
            )
            .setTimestamp()
            .setFooter({ text: 'RapidEx · Server Setup' }) as any,
        ],
        components: [],
      });
    } catch { /* nothing we can do */ }
  }
}
