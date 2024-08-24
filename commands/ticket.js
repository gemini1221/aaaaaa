const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const fs = require('fs');

const EMBED_COLOR = 0x0099ff;
const ERROR_COLOR = 0xff0000;
const TICKET_DELETE_DELAY = 10000; 
const ticketSettingsPath = './ticket_settings.json';


if (!fs.existsSync(ticketSettingsPath)) {
    fs.writeFileSync(ticketSettingsPath, JSON.stringify([])); 
}


function readTicketSettings() {
    const data = fs.readFileSync(ticketSettingsPath, 'utf-8');
    return JSON.parse(data);
}


function writeTicketSettings(data) {
    fs.writeFileSync(ticketSettingsPath, JSON.stringify(data, null, 2)); 
}


function saveTicketSettings(guildId, channelId, messageId, supportRoleId, categoryId, welcomeMessage) {
    const ticketSettings = readTicketSettings();
    const existingIndex = ticketSettings.findIndex(setting => setting.guild_id === guildId);

    const newSetting = {
        guild_id: guildId,
        channel_id: channelId,
        message_id: messageId,
        support_role_id: supportRoleId,
        category_id: categoryId,
        welcome_message: welcomeMessage
    };

    if (existingIndex > -1) {
        ticketSettings[existingIndex] = newSetting;
    } else {
        ticketSettings.push(newSetting);
    }

    writeTicketSettings(ticketSettings);
}

module.exports = {
    name: 'ticket',
    description: 'チケットシステムを設定します',
    options: [
        {
            name: 'title',
            type: 3,
            description: '埋め込みタイトル',
            required: true
        },
        {
            name: 'description',
            type: 3,
            description: '埋め込み説明',
            required: true
        },
        {
            name: 'button_label',
            type: 3,
            description: 'ボタンラベル',
            required: true
        },
        {
            name: 'support_role',
            type: 8,
            description: 'サポートロール',
            required: true
        },
        {
            name: 'category',
            type: 7,
            description: 'チケットカテゴリ',
            required: true
        },
        {
            name: 'welcome_message',
            type: 3,
            description: 'チケット作成時のウェルカムメッセージ',
            required: true
        },
        {
            name: 'image',
            type: 11,
            description: '埋め込み画像',
            required: false
        }
    ],
    async execute(interaction) {
        try {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return await interaction.reply({ content: 'このコマンドを使用する権限がありません。', ephemeral: true });
            }

            const { title, description, buttonLabel, supportRole, category, welcomeMessage, image } = getCommandOptions(interaction);

            if (category.type !== ChannelType.GuildCategory) {
                return await interaction.reply({ content: 'カテゴリチャンネルを選択してください。', ephemeral: true });
            }

            const ticketEmbed = createTicketEmbed(interaction, title, description, image);
            const button = createTicketButton(buttonLabel);
            const row = new ActionRowBuilder().addComponents(button);

            const ticketMessage = await interaction.channel.send({ embeds: [ticketEmbed], components: [row] });

            saveTicketSettings(interaction.guild.id, interaction.channel.id, ticketMessage.id, supportRole.id, category.id, welcomeMessage);

            setupTicketCollector(interaction, ticketMessage, category, supportRole, welcomeMessage);

            await interaction.reply({ content: 'チケットシステムが正常に設定されました。', ephemeral: true });
        } catch (error) {
            console.error('Ticket command error:', error);
            await sendErrorEmbed(interaction, 'チケットシステムの設定中にエラーが発生しました。');
        }
    },
};

function getCommandOptions(interaction) {
    return {
        title: interaction.options.getString('title'),
        description: interaction.options.getString('description'),
        buttonLabel: interaction.options.getString('button_label'),
        supportRole: interaction.options.getRole('support_role'),
        category: interaction.options.getChannel('category'),
        welcomeMessage: interaction.options.getString('welcome_message'),
        image: interaction.options.getAttachment('image')
    };
}

function createTicketEmbed(interaction, title, description, image) {
    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle(title)
        .setDescription(description)
        .setTimestamp()
        .setFooter({
            text: `Ticket System | ${new Date().toLocaleString()}`,
            iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }),
        });

    if (image && image.contentType.startsWith('image/')) {
        embed.setImage(image.url);
    }

    return embed;
}

function createTicketButton(label) {
    return new ButtonBuilder()
        .setCustomId('create_ticket')
        .setLabel(label)
        .setStyle(ButtonStyle.Primary);
}

function setupTicketCollector(interaction, ticketMessage, category, supportRole, welcomeMessage) {
    const collector = ticketMessage.createMessageComponentCollector({ filter: i => i.customId === 'create_ticket' });

    collector.on('collect', async (i) => {
        try {
            const ticketChannel = await createTicketChannel(i, category, supportRole);
            await sendWelcomeMessage(ticketChannel, i.user, welcomeMessage, supportRole);
            await i.reply({ content: `チケットが作成されました: ${ticketChannel}`, ephemeral: true });
            setupCloseTicketCollector(ticketChannel);
        } catch (error) {
            console.error('チケット作成エラー:', error);
            await i.reply({ content: 'チケットの作成中にエラーが発生しました。', ephemeral: true });
        }
    });
}

async function createTicketChannel(interaction, category, supportRole) {
    return await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
            {
                id: interaction.guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
                id: interaction.user.id,
                allow: [PermissionsBitField.Flags.ViewChannel],
            },
            {
                id: supportRole.id,
                allow: [PermissionsBitField.Flags.ViewChannel],
            },
        ],
    });
}

async function sendWelcomeMessage(channel, user, welcomeMessage, supportRole) {
    const welcomeEmbed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle('チケットが作成されました')
        .setDescription(welcomeMessage)
        .setTimestamp();

    const closeButton = new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('チケットを閉じる')
        .setStyle(ButtonStyle.Danger);

    const closeRow = new ActionRowBuilder().addComponents(closeButton);

    await channel.send({ content: `${user} ${supportRole}`, embeds: [welcomeEmbed], components: [closeRow] });
}

function setupCloseTicketCollector(channel) {
    const closeCollector = channel.createMessageComponentCollector({ filter: interaction => interaction.customId === 'close_ticket' });

    closeCollector.on('collect', async (interaction) => {
        await interaction.reply('このチケットはすぐに削除されます。');
        setTimeout(() => {
            channel.delete('チケットが閉じられました').catch(console.error);
        }, TICKET_DELETE_DELAY);
    });
}

async function sendErrorEmbed(interaction, errorMessage) {
    const errorEmbed = new EmbedBuilder()
        .setColor(ERROR_COLOR)
        .setTitle('エラー')
        .setDescription(errorMessage)
        .setTimestamp()
        .setFooter({
            text: `Error | ${new Date().toLocaleString()}`,
            iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }),
        });

    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
}
