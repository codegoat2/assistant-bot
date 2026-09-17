import {
  Guild,
  TextChannel,
  CategoryChannel,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  GuildMember,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction,
  ButtonInteraction,
} from 'discord.js';
import { COLORS, BANNER_URL } from '../embeds/colors';
import { getGuildIconUrl } from '../embeds';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TicketType = 'support' | 'mm' | 'apply_exchanger' | 'apply_staff';

interface TicketConfig {
  label: string;
  /** partial match against category channel name */
  categorySearch: string;
  channelPrefix: string;
  staffRoles: string[];
  color: number;
  welcomeText: string;
}

const TICKET_CONFIGS: Record<TicketType, TicketConfig> = {
  support: {
    label: 'Support Ticket',
    categorySearch: '§ Support Center',
    channelPrefix: 'support',
    staffRoles: ['★ Admin', '✦ Staff', '◇ Trial Staff'],
    color: COLORS.INFO,
    welcomeText:
      'A staff member will assist you shortly.\n' +
      'Please describe your issue clearly and include any relevant screenshots.',
  },
  mm: {
    label: 'Middleman Request',
    categorySearch: '§ Support Center',
    channelPrefix: 'mm',
    staffRoles: ['★ Admin', '✦ Staff', '◆ Middleman'],
    color: COLORS.ESCROW,
    welcomeText:
      'A middleman will join shortly to oversee your trade.\n' +
      'Please state: **trade value**, **payment method**, and **the other party\'s username**.',
  },
  apply_exchanger: {
    label: 'Exchanger Application',
    categorySearch: '§ Exchanger Applications',
    channelPrefix: 'exch-app',
    staffRoles: ['★ Admin', '✦ Staff'],
    color: COLORS.PRIMARY,
    welcomeText:
      'Your exchanger application has been received.\n' +
      'Staff will review it and get back to you shortly.',
  },
  apply_staff: {
    label: 'Staff Application',
    categorySearch: '§ Staff Applications',
    channelPrefix: 'staff-app',
    staffRoles: ['★ Admin'],
    color: COLORS.WARNING,
    welcomeText:
      'Your staff application has been received.\n' +
      'Management will review it and contact you.',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

async function findCategory(guild: Guild, search: string): Promise<CategoryChannel | null> {
  const channels = await guild.channels.fetch();
  for (const [, ch] of channels) {
    if (ch?.type === ChannelType.GuildCategory && ch.name.includes(search)) {
      return ch as CategoryChannel;
    }
  }
  return null;
}

function findRole(guild: Guild, name: string) {
  return guild.roles.cache.find(r => r.name === name) ?? null;
}

function ticketControlRow(claimed = false, claimedBy = ''): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_close')
      .setLabel('✖  Close Ticket')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('ticket_claim')
      .setLabel(claimed ? `◈ Claimed by ${claimedBy}` : '◈ Claim')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(claimed),
  );
}

// ---------------------------------------------------------------------------
// Create ticket channel (shared logic)
// ---------------------------------------------------------------------------

export async function createTicketChannel(
  guild: Guild,
  member: GuildMember,
  type: TicketType,
): Promise<TextChannel> {
  const cfg = TICKET_CONFIGS[type];

  // Prevent duplicates
  const safeUser = member.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16);
  const channelName = `${cfg.channelPrefix}-${safeUser}`;

  const duplicate = guild.channels.cache.find(
    ch => ch.type === ChannelType.GuildText && ch.name === channelName,
  );
  if (duplicate) return duplicate as TextChannel;

  const category = await findCategory(guild, cfg.categorySearch);

  const overwrites: any[] = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: member.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
      ],
    },
  ];

  for (const roleName of cfg.staffRoles) {
    const role = findRole(guild, roleName);
    if (role) {
      overwrites.push({
        id: role.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageMessages,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks,
        ],
      });
    }
  }

  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: category?.id,
    topic: `${cfg.label} · ${member.user.tag} · <t:${Math.floor(Date.now() / 1000)}:R>`,
    permissionOverwrites: overwrites,
    reason: `${cfg.label} opened by ${member.user.tag}`,
  }) as TextChannel;

  return channel;
}

// ---------------------------------------------------------------------------
// Send welcome embed into ticket channel
// ---------------------------------------------------------------------------

export async function sendTicketWelcome(
  channel: TextChannel,
  member: GuildMember,
  type: TicketType,
): Promise<void> {
  const cfg = TICKET_CONFIGS[type];
  const guild = channel.guild;
  const guildIconUrl = getGuildIconUrl(guild);

  const staffMentions = cfg.staffRoles
    .map(n => findRole(guild, n))
    .filter(Boolean)
    .map(r => `<@&${r!.id}>`)
    .join(' ');

  const embed = new EmbedBuilder()
    .setColor(cfg.color as any)
    .setTitle(`» ${cfg.label}`)
    .setDescription(
      `Welcome ${member}, your **${cfg.label}** has been opened.\n\n` +
      `${cfg.welcomeText}\n\n` +
      `» **Opened by:** ${member.user.tag}\n` +
      `» **Opened at:** <t:${Math.floor(Date.now() / 1000)}:F>`,
    )
    .setThumbnail(member.user.displayAvatarURL())
    .setImage(BANNER_URL)
    .setFooter({ text: 'RapidEx · Ticket System' })
    .setTimestamp();

  await channel.send({
    content: staffMentions ? `${member} — ${staffMentions}` : `${member}`,
    embeds: [embed as any],
    components: [ticketControlRow() as any],
  });
}

// ---------------------------------------------------------------------------
// Modals
// ---------------------------------------------------------------------------

/** Shown when user clicks "◆ Request Middleman" */
export function mmRequestModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId('modal_mm_request')
    .setTitle('Middleman Request')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('mm_trade_value')
          .setLabel('Trade value (approximate)')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('e.g. $500 worth of BTC')
          .setRequired(true),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('mm_payment_method')
          .setLabel('Payment method')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('e.g. PayPal → Bitcoin')
          .setRequired(true),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('mm_other_party')
          .setLabel("Other party's Discord username")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('e.g. username or @mention')
          .setRequired(true),
      ),
    );
}

/** Shown when user clicks "» Open Support Ticket" */
export function supportRequestModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId('modal_support_request')
    .setTitle('Support Request')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('support_subject')
          .setLabel('Subject')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Brief summary of your issue')
          .setRequired(true),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('support_description')
          .setLabel('Full description')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Describe your issue in detail...')
          .setRequired(true),
      ),
    );
}

/** Shown when user clicks "◈ Apply — Exchanger" */
export function exchangerApplicationModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId('modal_apply_exchanger')
    .setTitle('Exchanger Application')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('exch_payment_methods')
          .setLabel('What payment methods can you offer?')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('e.g. PayPal, Revolut, Bank Transfer')
          .setRequired(true),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('exch_volume')
          .setLabel('Monthly exchange volume (approx.)')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('e.g. $5,000 / month')
          .setRequired(true),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('exch_experience')
          .setLabel('Previous exchange experience?')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Describe any experience with crypto/fiat exchanges...')
          .setRequired(true),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('exch_why')
          .setLabel('Why do you want to join RapidEx?')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Tell us why you want to be a RapidEx exchanger...')
          .setRequired(true),
      ),
    );
}

/** Shown when user clicks "◇ Apply — Staff" */
export function staffApplicationModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId('modal_apply_staff')
    .setTitle('Staff Application')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('staff_age')
          .setLabel('Age')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('e.g. 20')
          .setRequired(true),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('staff_timezone')
          .setLabel('Timezone & daily availability')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('e.g. GMT+1 — 6 hours/day')
          .setRequired(true),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('staff_experience')
          .setLabel('Previous moderation experience?')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('List servers/platforms you have moderated...')
          .setRequired(true),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('staff_why')
          .setLabel('Why do you want to be staff at RapidEx?')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Tell us why you would be a great addition...')
          .setRequired(true),
      ),
    );
}

// ---------------------------------------------------------------------------
// Handle modal submissions → create ticket + post application summary
// ---------------------------------------------------------------------------

export async function handleTicketModal(interaction: ModalSubmitInteraction): Promise<void> {
  const { customId, user, guild } = interaction;
  if (!guild) return;

  const member = await guild.members.fetch(user.id).catch(() => null);
  if (!member) return;

  await interaction.deferReply({ ephemeral: true });

  let ticketType: TicketType;
  let summaryEmbed: EmbedBuilder;

  if (customId === 'modal_mm_request') {
    ticketType = 'mm';
    const tradeValue     = interaction.fields.getTextInputValue('mm_trade_value');
    const paymentMethod  = interaction.fields.getTextInputValue('mm_payment_method');
    const otherParty     = interaction.fields.getTextInputValue('mm_other_party');

    summaryEmbed = new EmbedBuilder()
      .setColor(COLORS.ESCROW as any)
      .setTitle('◆ Middleman Request — Details')
      .addFields(
        { name: '» Trade Value',    value: tradeValue,    inline: true },
        { name: '» Payment Method', value: paymentMethod, inline: true },
        { name: '» Other Party',    value: otherParty,    inline: true },
      )
      .setThumbnail(user.displayAvatarURL())
      .setFooter({ text: `User ID: ${user.id}` })
      .setTimestamp();

  } else if (customId === 'modal_support_request') {
    ticketType = 'support';
    const subject     = interaction.fields.getTextInputValue('support_subject');
    const description = interaction.fields.getTextInputValue('support_description');

    summaryEmbed = new EmbedBuilder()
      .setColor(COLORS.INFO as any)
      .setTitle('» Support Request — Details')
      .addFields(
        { name: '» Subject',     value: subject },
        { name: '» Description', value: description },
      )
      .setThumbnail(user.displayAvatarURL())
      .setFooter({ text: `User ID: ${user.id}` })
      .setTimestamp();

  } else if (customId === 'modal_apply_exchanger') {
    ticketType = 'apply_exchanger';
    const paymentMethods = interaction.fields.getTextInputValue('exch_payment_methods');
    const volume         = interaction.fields.getTextInputValue('exch_volume');
    const experience     = interaction.fields.getTextInputValue('exch_experience');
    const why            = interaction.fields.getTextInputValue('exch_why');

    summaryEmbed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY as any)
      .setTitle('◈ Exchanger Application — Details')
      .addFields(
        { name: '» Payment Methods', value: paymentMethods },
        { name: '» Monthly Volume',  value: volume },
        { name: '» Experience',      value: experience },
        { name: '» Why RapidEx?',    value: why },
      )
      .setThumbnail(user.displayAvatarURL())
      .setFooter({ text: `User ID: ${user.id}` })
      .setTimestamp();

  } else if (customId === 'modal_apply_staff') {
    ticketType = 'apply_staff';
    const age        = interaction.fields.getTextInputValue('staff_age');
    const timezone   = interaction.fields.getTextInputValue('staff_timezone');
    const experience = interaction.fields.getTextInputValue('staff_experience');
    const why        = interaction.fields.getTextInputValue('staff_why');

    summaryEmbed = new EmbedBuilder()
      .setColor(COLORS.WARNING as any)
      .setTitle('◇ Staff Application — Details')
      .addFields(
        { name: '» Age',                          value: age,        inline: true },
        { name: '» Timezone & Availability',      value: timezone,   inline: true },
        { name: '» Moderation Experience',        value: experience },
        { name: '» Why RapidEx Staff?',           value: why },
      )
      .setThumbnail(user.displayAvatarURL())
      .setFooter({ text: `User ID: ${user.id}` })
      .setTimestamp();

  } else {
    await interaction.editReply({ content: '❌ Unknown form type.' });
    return;
  }

  try {
    const ticketChannel = await createTicketChannel(guild, member, ticketType);
    await sendTicketWelcome(ticketChannel, member, ticketType);
    await ticketChannel.send({ embeds: [summaryEmbed as any] });
    await interaction.editReply({ content: `✔ Ticket opened: ${ticketChannel}` });
  } catch (err) {
    await interaction.editReply({ content: `❌ Failed to open ticket: ${String(err)}` });
  }
}

// ---------------------------------------------------------------------------
// Button handlers: close / claim
// ---------------------------------------------------------------------------

export async function handleTicketClose(interaction: ButtonInteraction): Promise<void> {
  const channel = interaction.channel as TextChannel;
  if (!channel || !interaction.guild) return;

  const member = interaction.member as GuildMember;
  const isStaff = member.roles.cache.some(r =>
    ['★ Admin', '✦ Staff', '◇ Trial Staff', '◆ Middleman'].includes(r.name),
  );
  const isOpener = channel.permissionOverwrites.cache.has(member.id);

  if (!isStaff && !isOpener) {
    await interaction.reply({ content: '❌ You cannot close this ticket.', ephemeral: true });
    return;
  }

  await interaction.reply({ content: '◈ Closing ticket in 5 seconds...' });

  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(COLORS.ERROR as any)
        .setTitle('✖ Ticket Closed')
        .setDescription(
          `Closed by ${interaction.user} at <t:${Math.floor(Date.now() / 1000)}:F>`,
        )
        .setFooter({ text: 'RapidEx · Ticket System' })
        .setTimestamp() as any,
    ],
  });

  await sleep(5000);
  await channel.delete(`Ticket closed by ${interaction.user.tag}`).catch(() => null);
}

export async function handleTicketClaim(interaction: ButtonInteraction): Promise<void> {
  const channel = interaction.channel as TextChannel;
  if (!channel || !interaction.guild) return;

  const member = interaction.member as GuildMember;
  const isStaff = member.roles.cache.some(r =>
    ['★ Admin', '✦ Staff', '◇ Trial Staff', '◆ Middleman'].includes(r.name),
  );

  if (!isStaff) {
    await interaction.reply({ content: '❌ Only staff can claim tickets.', ephemeral: true });
    return;
  }

  await interaction.update({
    components: [ticketControlRow(true, interaction.user.username) as any],
  });

  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(COLORS.SUCCESS as any)
        .setTitle('◈ Ticket Claimed')
        .setDescription(
          `${interaction.user} has claimed this ticket and will assist you shortly.`,
        )
        .setFooter({ text: 'RapidEx · Ticket System' })
        .setTimestamp() as any,
    ],
  });
}
