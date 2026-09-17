import {
  Guild,
  TextChannel,
  ChannelType,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} from 'discord.js';
import { COLORS, BANNER_URL } from '../embeds/colors';
import { getGuildIconUrl } from '../embeds';

// ---------------------------------------------------------------------------
// Helper — find a text channel by partial name match
// ---------------------------------------------------------------------------

function findChannel(guild: Guild, partialName: string): TextChannel | null {
  const ch = guild.channels.cache.find(
    c => c.type === ChannelType.GuildText && c.name.includes(partialName),
  );
  return (ch as TextChannel) ?? null;
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Individual panel senders
// ---------------------------------------------------------------------------

/** § Information » announcements — pinned welcome */
async function fillAnnouncements(guild: Guild): Promise<void> {
  const ch = findChannel(guild, 'announcements');
  if (!ch) return;
  const icon = getGuildIconUrl(guild);

  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY as any)
    .setTitle('★ Welcome to RapidEx')
    .setDescription(
      '**RapidEx** is a trusted peer-to-peer crypto & fiat exchange community.\n\n' +
      '» Use the channels in **§ Services** to start or request an exchange.\n' +
      '» Read **» terms-of-service** before trading.\n' +
      '» Check **» fees-and-rates** for up-to-date pricing.\n' +
      '» Open a ticket in **§ Support Center** for any issues.\n\n' +
      'All exchanges are conducted by verified, vetted exchangers.',
    )
    .setThumbnail(icon)
    .setImage(BANNER_URL)
    .setFooter({ text: 'RapidEx · Official Announcement' })
    .setTimestamp();

  const msg = await ch.send({ embeds: [embed as any] });
  await msg.pin().catch(() => null);
}

/** § Information » terms-of-service — ToS embed with URL button */
async function fillTerms(guild: Guild): Promise<void> {
  const ch = findChannel(guild, 'terms-of-service');
  if (!ch) return;
  const icon = getGuildIconUrl(guild);

  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY as any)
    .setTitle('§ Terms of Service')
    .setDescription(
      'By participating in any exchange on **RapidEx**, you agree to the following:\n\n' +
      '**» 1. Eligibility**\n' +
      'You must be 18+ years old to use RapidEx services.\n\n' +
      '**» 2. Honesty**\n' +
      'All parties must be honest about trade details. Misrepresentation is grounds for an immediate ban.\n\n' +
      '**» 3. No Chargebacks**\n' +
      'Initiating a chargeback after a completed trade will result in a permanent ban and may be reported.\n\n' +
      '**» 4. Verified Exchangers Only**\n' +
      'Only trade with members holding the **◈ Exchanger** role. RapidEx is not liable for trades with unverified users.\n\n' +
      '**» 5. Use Middleman for Large Trades**\n' +
      'For trades above $500, we strongly recommend using the **◆ Middleman** service.\n\n' +
      '**» 6. No Scamming**\n' +
      'Any attempt to scam will result in a permanent ban and public blacklist.\n\n' +
      '**» 7. Support**\n' +
      'For disputes or issues, open a ticket in **§ Support Center**.',
    )
    .setThumbnail(icon)
    .setImage(BANNER_URL)
    .setFooter({ text: 'RapidEx · Terms of Service' })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel('» Read Full Terms Online')
      .setStyle(ButtonStyle.Link)
      .setURL('https://velxoai.xyz/terms'),
  );

  await ch.send({ embeds: [embed as any], components: [row as any] });
}

/** § Information » fees-and-rates — fee table embed */
async function fillFees(guild: Guild): Promise<void> {
  const ch = findChannel(guild, 'fees-and-rates');
  if (!ch) return;
  const icon = getGuildIconUrl(guild);

  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY as any)
    .setTitle('§ Fees & Rates')
    .setDescription(
      'Below are the standard RapidEx exchange fees.\n' +
      'Use `/fees` in **» bot-commands** for a live calculation.\n\u200b',
    )
    .addFields(
      {
        name: '◑ PayPal',
        value:
          '· Crypto → PayPal: **5%**\n' +
          '· PayPal → Crypto: **5%**\n' +
          '· Minimum trade: **$20**',
        inline: true,
      },
      {
        name: '◐ Revolut',
        value:
          '· Crypto → Revolut: **4%**\n' +
          '· Revolut → Crypto: **4%**\n' +
          '· Minimum trade: **$20**',
        inline: true,
      },
      {
        name: '◒ Bank Transfer',
        value:
          '· Crypto → Bank: **3%**\n' +
          '· Bank → Crypto: **3%**\n' +
          '· Minimum trade: **$50**',
        inline: true,
      },
      {
        name: '◆ Middleman Fee',
        value: '· Flat fee: **$5** per escrow session\n· Free for trades above **$1,000**',
        inline: true,
      },
      {
        name: '» Notes',
        value:
          '· Fees are paid by the **buyer** unless otherwise agreed.\n' +
          '· Rates may vary by exchanger — always confirm before trading.\n' +
          '· Use `/fees` for a personalised breakdown.',
        inline: false,
      },
    )
    .setThumbnail(icon)
    .setImage(BANNER_URL)
    .setFooter({ text: 'RapidEx · Fee Schedule' })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('fee_calc_start')
      .setLabel('» Calculate My Fee')
      .setStyle(ButtonStyle.Primary),
  );

  await ch.send({ embeds: [embed as any], components: [row as any] });
}

/** § Information » backup-info */
async function fillBackup(guild: Guild): Promise<void> {
  const ch = findChannel(guild, 'backup-info');
  if (!ch) return;
  const icon = getGuildIconUrl(guild);

  const embed = new EmbedBuilder()
    .setColor(COLORS.WARNING as any)
    .setTitle('§ Backup & Contact Info')
    .setDescription(
      'If you cannot reach staff through this server, use the following backup channels:\n\n' +
      '» **Website:** https://velxoai.xyz\n' +
      '» **Support Email:** support@velxoai.xyz\n\n' +
      '**If this server goes down:**\n' +
      'A backup invite will be posted on the website above.\n\n' +
      '**Impersonation warning:**\n' +
      'RapidEx staff will **never** DM you first asking for money or crypto.',
    )
    .setThumbnail(icon)
    .setImage(BANNER_URL)
    .setFooter({ text: 'RapidEx · Backup Information' })
    .setTimestamp();

  await ch.send({ embeds: [embed as any] });
}

/** § Services » middleman-services — MM request panel */
async function fillMMServices(guild: Guild): Promise<void> {
  const ch = findChannel(guild, 'middleman-services');
  if (!ch) return;
  const icon = getGuildIconUrl(guild);

  const embed = new EmbedBuilder()
    .setColor(COLORS.ESCROW as any)
    .setTitle('◆ Middleman Services')
    .setDescription(
      '**What is a Middleman?**\n' +
      'A trusted RapidEx middleman acts as a neutral third party in high-value trades, holding funds in escrow until both sides confirm.\n\n' +
      '**» When to use MM:**\n' +
      '· Any trade above **$200**\n' +
      '· First time trading with someone\n' +
      '· Trading with someone you don\'t fully trust\n\n' +
      '**» How it works:**\n' +
      '1. Click the button below to open a private MM ticket\n' +
      '2. Fill in the trade details\n' +
      '3. A **◆ Middleman** will join your ticket\n' +
      '4. Funds are verified before the trade completes\n\n' +
      '**» Fee:** Flat $5 · Free for trades over $1,000',
    )
    .setThumbnail(icon)
    .setImage(BANNER_URL)
    .setFooter({ text: 'RapidEx · Middleman Services' })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('open_ticket_mm')
      .setLabel('◆ Request Middleman')
      .setStyle(ButtonStyle.Primary),
  );

  await ch.send({ embeds: [embed as any], components: [row as any] });
}

/** § Support Center » open-ticket — support panel with 3 buttons */
async function fillSupportPanel(guild: Guild): Promise<void> {
  const ch = findChannel(guild, 'open-ticket');
  if (!ch) return;
  const icon = getGuildIconUrl(guild);

  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY as any)
    .setTitle('§ Support Center')
    .setDescription(
      'Need help? Select the relevant option below to open a **private ticket**.\n' +
      'A staff member will assist you as soon as possible.\n\n' +
      '**» Support** — General questions, trade disputes, account issues\n' +
      '**» Apply: Exchanger** — Apply to become a verified RapidEx exchanger\n' +
      '**» Apply: Staff** — Apply to join the RapidEx moderation team\n\n' +
      '> Please do **not** ping staff directly — use tickets for all requests.',
    )
    .setThumbnail(icon)
    .setImage(BANNER_URL)
    .setFooter({ text: 'RapidEx · Support Center' })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('open_ticket_support')
      .setLabel('» Open Support Ticket')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('open_ticket_apply_exchanger')
      .setLabel('◈ Apply — Exchanger')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('open_ticket_apply_staff')
      .setLabel('◇ Apply — Staff')
      .setStyle(ButtonStyle.Secondary),
  );

  await ch.send({ embeds: [embed as any], components: [row as any] });
}

/** § Exchanger Zone » exchanger-guide */
async function fillExchangerGuide(guild: Guild): Promise<void> {
  const ch = findChannel(guild, 'exchanger-guide');
  if (!ch) return;
  const icon = getGuildIconUrl(guild);

  const embed = new EmbedBuilder()
    .setColor(COLORS.INFO as any)
    .setTitle('◈ Exchanger Guide')
    .setDescription(
      'Welcome to the RapidEx Exchanger Zone. Follow this guide to process exchanges correctly.\n\u200b',
    )
    .addFields(
      {
        name: '» Step 1 — Claim a Request',
        value:
          'Monitor **» claim-exchange** for incoming exchange requests.\n' +
          'Reply to claim it before another exchanger does.',
      },
      {
        name: '» Step 2 — Open a Trade Thread',
        value:
          'A ticket/thread will be created in **§ Opened Exchanges** with the client.\n' +
          'Introduce yourself and confirm the trade details.',
      },
      {
        name: '» Step 3 — Verify Details',
        value:
          'Confirm:\n· Exact amount\n· Payment method\n· Wallet address or payment details\n· Fee included or excluded',
      },
      {
        name: '» Step 4 — Execute the Trade',
        value:
          'Send/receive funds as agreed. Always send crypto **last** after confirming fiat receipt.\n' +
          'For trades above $200, use **◆ Middleman** or advise the client to.',
      },
      {
        name: '» Step 5 — Close & Log',
        value:
          'Once complete, post proof in **» completed-exchanges** and close the trade thread.',
      },
      {
        name: '» Rules',
        value:
          '· Never trade outside of RapidEx channels\n' +
          '· Never ask for payment before sending crypto\n' +
          '· Report suspicious users to **★ Admin** immediately\n' +
          '· Maintain a professional tone at all times',
      },
    )
    .setThumbnail(icon)
    .setImage(BANNER_URL)
    .setFooter({ text: 'RapidEx · Exchanger Guide' })
    .setTimestamp();

  await ch.send({ embeds: [embed as any] });
}

/** § Exchanger Applications » exchanger-requirements */
async function fillExchangerRequirements(guild: Guild): Promise<void> {
  const ch = findChannel(guild, 'exchanger-requirements');
  if (!ch) return;
  const icon = getGuildIconUrl(guild);

  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY as any)
    .setTitle('◈ Exchanger Requirements')
    .setDescription(
      'Read all requirements carefully before applying to become a verified exchanger.\n\u200b',
    )
    .addFields(
      {
        name: '» Eligibility',
        value:
          '· Must be 18 years or older\n' +
          '· Must have a valid, working payment method\n' +
          '· Must be able to exchange a minimum of **$500/month**',
      },
      {
        name: '» Documentation',
        value:
          '· You must provide proof of identity (KYC) upon request\n' +
          '· You must provide proof of previous exchange activity if available',
      },
      {
        name: '» Conduct',
        value:
          '· Professional behaviour at all times\n' +
          '· Respond to trade requests within 30 minutes during active hours\n' +
          '· Zero tolerance for scamming, chargebacks, or disputes caused by negligence',
      },
      {
        name: '» Trial Period',
        value:
          'All new exchangers undergo a **2-week trial** under staff supervision before full verification.',
      },
      {
        name: '» How to Apply',
        value: 'Open a ticket in **§ Support Center** using the **◈ Apply — Exchanger** button.',
      },
    )
    .setThumbnail(icon)
    .setImage(BANNER_URL)
    .setFooter({ text: 'RapidEx · Exchanger Requirements' })
    .setTimestamp();

  await ch.send({ embeds: [embed as any] });
}

/** § Staff Applications » staff-requirements */
async function fillStaffRequirements(guild: Guild): Promise<void> {
  const ch = findChannel(guild, 'staff-requirements');
  if (!ch) return;
  const icon = getGuildIconUrl(guild);

  const embed = new EmbedBuilder()
    .setColor(COLORS.WARNING as any)
    .setTitle('◇ Staff Requirements')
    .setDescription(
      'Read all requirements before applying to join the RapidEx moderation team.\n\u200b',
    )
    .addFields(
      {
        name: '» Eligibility',
        value:
          '· Must be 16 years or older\n' +
          '· Must be active in the server for at least 1 week\n' +
          '· Must be available at least **4 hours per day**',
      },
      {
        name: '» Skills Required',
        value:
          '· Mature and professional communication\n' +
          '· Conflict resolution experience\n' +
          '· Basic understanding of crypto exchange processes',
      },
      {
        name: '» Responsibilities',
        value:
          '· Handle support tickets promptly\n' +
          '· Monitor channels and enforce server rules\n' +
          '· Assist with exchanger verification',
      },
      {
        name: '» Trial Staff',
        value:
          'New staff start as **◇ Trial Staff** for 2 weeks before full promotion to **✦ Staff**.',
      },
      {
        name: '» How to Apply',
        value: 'Open a ticket in **§ Support Center** using the **◇ Apply — Staff** button.',
      },
    )
    .setThumbnail(icon)
    .setImage(BANNER_URL)
    .setFooter({ text: 'RapidEx · Staff Requirements' })
    .setTimestamp();

  await ch.send({ embeds: [embed as any] });
}

/** § Public » general-chat — welcome message */
async function fillGeneralChat(guild: Guild): Promise<void> {
  const ch = findChannel(guild, 'general-chat');
  if (!ch) return;
  const icon = getGuildIconUrl(guild);

  const embed = new EmbedBuilder()
    .setColor(COLORS.SUCCESS as any)
    .setTitle('» Welcome to General Chat')
    .setDescription(
      'Feel free to chat, ask questions, and get to know the community.\n\n' +
      '**» Rules:**\n' +
      '· Be respectful to all members\n' +
      '· No spamming or flooding\n' +
      '· No advertising without permission\n' +
      '· Keep discussion in the appropriate channels\n\n' +
      'Enjoy your stay at **RapidEx**!',
    )
    .setThumbnail(icon)
    .setImage(BANNER_URL)
    .setFooter({ text: 'RapidEx · General Chat' })
    .setTimestamp();

  await ch.send({ embeds: [embed as any] });
}

// ---------------------------------------------------------------------------
// Master fill function — called after server setup completes
// ---------------------------------------------------------------------------

export interface FillProgress {
  onStep: (msg: string) => Promise<void>;
}

export async function fillAllChannels(guild: Guild, progress: FillProgress): Promise<void> {
  const { onStep } = progress;

  const tasks: Array<[string, () => Promise<void>]> = [
    ['Filling » announcements',           () => fillAnnouncements(guild)],
    ['Filling » terms-of-service',        () => fillTerms(guild)],
    ['Filling » fees-and-rates',          () => fillFees(guild)],
    ['Filling » backup-info',             () => fillBackup(guild)],
    ['Filling » middleman-services',      () => fillMMServices(guild)],
    ['Filling » open-ticket (support)',   () => fillSupportPanel(guild)],
    ['Filling » exchanger-guide',         () => fillExchangerGuide(guild)],
    ['Filling » exchanger-requirements',  () => fillExchangerRequirements(guild)],
    ['Filling » staff-requirements',      () => fillStaffRequirements(guild)],
    ['Filling » general-chat',            () => fillGeneralChat(guild)],
  ];

  for (const [label, fn] of tasks) {
    await onStep(label);
    try {
      await fn();
    } catch (err) {
      console.error(`[ChannelFill] Failed — ${label}:`, err);
    }
    await sleep(500);
  }

  await onStep('All channels filled.');
}
