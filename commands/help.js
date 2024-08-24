const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'help',
    description: '利用可能なコマンドとその説明を表示します。',
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x7fff7f)
            .setTitle('ヘルプ - コマンド一覧')
            .setDescription('利用可能なコマンドの一覧です:')
            .addFields(
                { name: '/help', value: 'このメッセージを表示します。' },
                { name: '/avatar', value: '指定したユーザーのアバター、または自分のアバターを表示します。' },
                { name: '/ban', value: '指定したユーザーをサーバーから追放します。' },
                { name: '/clear', value: '指定した数のメッセージをチャットから削除します。' },
                { name: '/kick', value: '指定したユーザーをサーバーからキックします。' },
                { name: '/omikuji', value: 'おみくじを引いて運勢を占います。' },
                { name: '/nuke', value: 'チャンネルをリセットします。' },
                { name: '/rps', value: 'じゃんけんをします。' },
                { name: '/roll', value: 'ダイスを振ってランダムな数字を生成します。' },
                { name: '/server', value: 'サーバーに関する情報を表示します。' },
                { name: '/ticket', value: 'チケットシステムを管理します。' },
                { name: '/uptime', value: 'ボットの稼働時間を表示します。' },
                { name: '/user', value: 'ユーザーに関する情報を表示します。' },
                { name: '/invite', value: '招待リンクを作成します。' },
                { name: '/timeout', value: 'ユーザーをタイムアウトします。' },
                { name: '/snipe', value: 'ユーザーが削除したメッセージを表示します。' },
                { name: '/kaso', value: '過疎と表示します。' },
                { name: '/totuzenshi', value: '突然死を作成します。' },
                { name: '/verify', value: 'ユーザーを認証します。' }
            )
            .setFooter({
                text: `help | ${new Date().toLocaleString()}`,
                iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }),
            });
            const links = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('招待リンク')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://discord.com/oauth2/authorize?client_id=1268605819390525543'),
                new ButtonBuilder()
                    .setLabel('ホームページ')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://sizuki.top/raybot')
            );
        
        await interaction.reply({ embeds: [embed], components: [links] });
    },
};