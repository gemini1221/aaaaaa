const { EmbedBuilder } = require('discord.js');

const omikujiResults = [
    { 
        fortune: '大吉', 
        color: 0xFFD700, 
        emoji: '🌟',
        description: '最高の幸運が舞い降りています！',
        item: '四つ葉のクローバー',
        advice: '自信を持って新しいことに挑戦してみましょう。'
    },
    { 
        fortune: '中吉', 
        color: 0x7FFF00, 
        emoji: '✨',
        description: '良い運気に恵まれています。',
        item: 'お気に入りの本',
        advice: '知識を深めることで、さらなる幸運を引き寄せられるでしょう。'
    },
    { 
        fortune: '小吉', 
        color: 0x98FB98, 
        emoji: '🍀',
        description: 'ちょっとした幸運が待っています。',
        item: 'ハンカチ',
        advice: '小さな親切を心がけると、良いことがあるかもしれません。'
    },
    { 
        fortune: '吉', 
        color: 0xADD8E6, 
        emoji: '☺️',
        description: '穏やかな一日になりそうです。',
        item: 'お守り',
        advice: '日常の中に小さな幸せを見つけてみましょう。'
    },
    { 
        fortune: '末吉', 
        color: 0xFFFF00, 
        emoji: '😌',
        description: '大きな変化はありませんが、悪くはありません。',
        item: 'お気に入りの靴下',
        advice: '基本に立ち返ることで、安定した日々を過ごせるでしょう。'
    },
    { 
        fortune: '凶', 
        color: 0xFFA500, 
        emoji: '😓',
        description: '少し注意が必要かもしれません。',
        item: '鏡',
        advice: '自己反省の時間を持つことで、困難を乗り越えられるかもしれません。'
    },
    { 
        fortune: '大凶', 
        color: 0xFF0000, 
        emoji: '🌪️',
        description: '困難に直面するかもしれません。',
        item: 'お札',
        advice: '慎重に行動し、周りの人のサポートを大切にしましょう。ピンチをチャンスに変えられる日かもしれません。'
    }
];

module.exports = {
    name: 'omikuji',
    description: '今日の詳細なおみくじを引く',
    options: [],
    async execute(interaction) {
        try {
            const result = omikujiResults[Math.floor(Math.random() * omikujiResults.length)];
            const embed = new EmbedBuilder()
                .setColor(result.color)
                .setTitle(`${result.emoji} おみくじ: ${result.fortune}`)
                .setDescription(result.description)
                .addFields(
                    { name: '🍀 ラッキーアイテム', value: result.item, inline: true },
                    { name: '💡 今日のアドバイス', value: result.advice, inline: true }
                )
                .setFooter({
                    text: `omikuji | ${new Date().toLocaleString()}`,
                    iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }),
                })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply('おみくじを引くことができませんでした。もう一度お試しください。');
        }
    },
};