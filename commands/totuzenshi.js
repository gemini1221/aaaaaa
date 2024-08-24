// commands/totuzen_die.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'totuzenshi',
    description: '突然の死を表示します。',
    options: [
        {
            name: 'text',
            type: 3,
            description: '突然の死の中に表示するテキスト',
            required: false,
        },
    ],
    async execute(interaction) {
        const text = interaction.options.getString('text') || '突然の死';
        
        const createSuddenDeath = (text) => {
            const topBottom = '＿' + '人'.repeat(text.length + 2) + '＿';
            const middle = '＞　' + text + '　＜';
            const bottom = '￣' + 'Y^'.repeat(text.length + 2) + '￣';
            return `${topBottom}\n${middle}\n${bottom}`;
        };

        const sudden_death = createSuddenDeath(text);

        try {
            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle('突然の死')
                .setDescription('```\n' + sudden_death + '\n```')
                .setTimestamp()
                .setFooter({
                    text: `${interaction.user.username} | ${new Date().toLocaleString()}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('エラー')
                .setDescription('突然の死の生成中にエラーが発生しました。')
                .setTimestamp()
                .setFooter({
                    text: `${interaction.user.username} | ${new Date().toLocaleString()}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                });
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};