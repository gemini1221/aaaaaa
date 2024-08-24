const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActivityType, PermissionsBitField, ChannelType, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs');
const config = require('./config.json');
const verifySettingsPath = './verify_settings.json';
const ticketSettingsPath = './ticket_settings.json';
const EMBED_COLOR = 0x7fff7f;
const ERROR_COLOR = 0xff0000;
const TICKET_DELETE_DELAY = 10000; 
// 未処理のプロセス拒否
process.on('uncaughtException', (error) => {
    console.error('未処理の例外:', error);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('未処理のプロミス拒否:', reason);
  });
  

function readVerifySettings() {
    if (!fs.existsSync(verifySettingsPath)) {
        return [];
    }
    const data = fs.readFileSync(verifySettingsPath, 'utf-8');
    return JSON.parse(data);
}

function readTicketSettings() {
    if (!fs.existsSync(ticketSettingsPath)) {
        return [];
    }
    const data = fs.readFileSync(ticketSettingsPath, 'utf-8');
    return JSON.parse(data);
}


function readVerifiedUsers() {
    if (!fs.existsSync('./verified_users.json')) {
        return [];
    }
    const data = fs.readFileSync('./verified_users.json', 'utf-8');
    return JSON.parse(data);
}


function checkVerifiedUser(userId, guildId) {
    const verifiedUsers = readVerifiedUsers();
    return verifiedUsers.find(user => user.user_id === userId && user.guild_id === guildId);
}


function insertVerifiedUser(userId, guildId) {
    const verifiedUsers = readVerifiedUsers();
    verifiedUsers.push({ user_id: userId, guild_id: guildId });
    fs.writeFileSync('./verified_users.json', JSON.stringify(verifiedUsers, null, 2)); 
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

    fs.writeFileSync(ticketSettingsPath, JSON.stringify(ticketSettings, null, 2));
}


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// コマンドをロードする
const snipeCommand = require('./commands/snipe.js');

// snipeコマンドの初期化
snipeCommand.init(client);


for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}


let isServerCount = true;

      
function updateServerCount() {
    const totalMembers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    client.user.setActivity({
        name: `${client.guilds.cache.size} server | ${totalMembers} members`,
        type: ActivityType.Competing
    });
}

function alternateStatus() {
    let isServerCount = true;
    setInterval(() => {
        if (isServerCount) {
            const totalMembers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
            client.user.setActivity({
                name: `${client.guilds.cache.size} server | ${totalMembers} members`,
                type: ActivityType.Competing
            });
        } else {
            client.user.setActivity({
                name: '', //ここは好きなメッセージにしてね
                type: ActivityType.Playing
            });
        }
        isServerCount = !isServerCount;
    }, 60000); 
}

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    updateServerCount();
    alternateStatus();


    const data = client.commands.map(command => ({
        name: command.name,
        description: command.description,
        options: command.options || []
    }));

    try {
        await client.application.commands.set(data);
        console.log('スラッシュコマンドがグローバルに登録されました');
    } catch (error) {
        console.error('スラッシュコマンドの登録中にエラーが発生しました:', error);
    }
    
    const ticketSettings = readTicketSettings();
    for (const setting of ticketSettings) {
        if (setting.category_id) {
            const channel = await client.channels.fetch(setting.channel_id);
            if (channel) {
                const message = await channel.messages.fetch(setting.message_id);

                
                const collector = message.createMessageComponentCollector({ filter: i => i.customId === 'create_ticket' });

                collector.on('collect', async (i) => {
                    try {
                        const ticketChannel = await createTicketChannel(i, setting.category_id, setting.support_role_id);
                        await sendWelcomeMessage(ticketChannel, i.user, setting.welcome_message, setting.support_role_id);
                        await i.reply({ content: `チケットが作成されました: ${ticketChannel}`, ephemeral: true });
                        setupCloseTicketCollector(ticketChannel);
                    } catch (error) {
                        console.error('チケット作成エラー:', error);
                        if (!i.replied) {
                            await i.reply({ content: 'チケットの作成中にエラーが発生しました。', ephemeral: true });
                        } else {
                            await i.followUp({ content: 'チケットの作成中にエラーが発生しました。', ephemeral: true });
                        }
                    }
                });
            }
        }
    }


    const verifySettings = await readVerifySettings();
    for (const setting of verifySettings) {
        try {
            const channel = await client.channels.fetch(setting.channel_id);
            if (channel) {
                const message = await channel.messages.fetch(setting.message_id);
                const collector = message.createMessageComponentCollector({ filter: i => i.customId === 'verify' });

                collector.on('collect', async (i) => {
                    try {
                        const role = i.guild.roles.cache.get(setting.role_id);
                        if (!role) {
                            const errorEmbed = new EmbedBuilder()
                            .setColor(0xff4d4d)
                                .setTitle('エラー')
                                .setDescription('ロールが見つかりませんでした。')
                                .setTimestamp();
                            await i.reply({ embeds: [errorEmbed], ephemeral: true });
                            return;
                        }

                        if (i.member.roles.cache.has(role.id)) {
                            const alreadyVerifiedEmbed = new EmbedBuilder()
                            .setColor(0x7fff7f)
                                .setTitle('既に認証済み')
                                .setDescription('あなたは既に認証済みです。')
                                .setTimestamp();
                            await i.reply({ embeds: [alreadyVerifiedEmbed], ephemeral: true });
                            return;
                        }

                        await i.member.roles.add(role);
                        const verificationSuccessEmbed = new EmbedBuilder()
                        .setColor(0x7fff7f)
                            .setTitle('認証成功')
                            .setDescription('認証が完了しました。')
                            .addFields({ name: '付与されたロール', value: role.name })
                            .setTimestamp();
                        await i.reply({ embeds: [verificationSuccessEmbed], ephemeral: true });
                    } catch (error) {
                        console.error('認証エラー:', error);
                        const errorEmbed = new EmbedBuilder()
                        .setColor(0xff4d4d)
                            .setTitle('エラー')
                            .setDescription('認証処理中にエラーが発生しました。')
                            .setTimestamp();
                        await i.reply({ embeds: [errorEmbed], ephemeral: true });
                    }
                });
            }
        } catch (error) {
            console.error('');
        }
    }
});


client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('コマンドの実行中にエラーが発生しました:', error);
        await interaction.reply({ content: 'コマンドの実行中にエラーが発生しました！', ephemeral: true });
    }
});


client.on('messageCreate', async (message) => {
    const globalChatCommand = client.commands.get('global_chat');
    if (globalChatCommand && globalChatCommand.handleMessageCreate) {
        await globalChatCommand.handleMessageCreate(message);
    }
});
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);

});


process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);

});

client.login(token);



async function createTicketChannel(interaction, categoryId, supportRoleId) {
    const category = await interaction.guild.channels.fetch(categoryId);
    const supportRole = await interaction.guild.roles.fetch(supportRoleId);

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


async function sendWelcomeMessage(channel, user, welcomeMessage, supportRoleId) {
    const supportRole = await channel.guild.roles.fetch(supportRoleId);
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
