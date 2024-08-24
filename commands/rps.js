// commands/rps.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'rps',
    description: 'じゃんけんをします',
    options: [
        {
            name: 'choice',
            type: 3, // STRING type
            description: 'グー、チョキ、パーのいずれかを選んでください',
            required: true,
            choices: [
                { name: 'グー', value: 'rock' },
                { name: 'チョキ', value: 'scissors' },
                { name: 'パー', value: 'paper' }
            ],
        },
    ],
    async execute(interaction) {
        const userChoice = interaction.options.getString('choice');
        const choices = ['rock', 'paper', 'scissors'];
        const botChoice = choices[Math.floor(Math.random() * choices.length)];

        const result = getResult(userChoice, botChoice);

        const embed = new EmbedBuilder()
            .setColor('#f07d0d')
            .setTitle('じゃんけん結果')
            .addFields(
                { name: '👤┃あなたの選択', value: `${getEmoji(userChoice)} ${getJapanese(userChoice)}`, inline: true },
                { name: '🤖┃ボットの選択', value: `${getEmoji(botChoice)} ${getJapanese(botChoice)}`, inline: true },
                { name: '結果', value: result }
            )
            .setTimestamp()
            .setFooter({
                text: `${interaction.user.username} | ${new Date().toLocaleString()}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            });

        await interaction.reply({ embeds: [embed] });
    },
};

function getResult(user, bot) {
    if (user === bot) return 'あいこ！';
    if ((user === 'rock' && bot === 'scissors') ||
        (user === 'scissors' && bot === 'paper') ||
        (user === 'paper' && bot === 'rock')) {
        return 'あなたの勝ち！ 🎉';
    }
    return 'ボットの勝ち！ 🤖';
}

function getEmoji(choice) {
    switch (choice) {
        case 'rock': return '✊';
        case 'paper': return '✋';
        case 'scissors': return '✌️';
        default: return '';
    }
}

function getJapanese(choice) {
    switch (choice) {
        case 'rock': return 'グー';
        case 'paper': return 'パー';
        case 'scissors': return 'チョキ';
        default: return '';
    }
}