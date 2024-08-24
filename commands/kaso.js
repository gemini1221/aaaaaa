const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'kaso',
    description: '完全なネタコマンド',
    options: [],
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setAuthor({ name: '過疎', iconURL: 'https://i.imgur.com/CdLNK6q.gif' })
            .setTitle('サーバーが過疎な状態です！！')
            .setImage('https://media1.tenor.com/m/8Z7arHajdFsAAAAd/%E9%81%8E%E7%96%8E-%E3%82%B5%E3%83%BC%E3%83%90%E3%83%BC.gif')
            .setFooter({
                text: `kaso | ${new Date().toLocaleString()}`,
                iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }),
            });
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('招待リンク')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://discord.com/oauth2/authorize?client_id=1268605819390525543')
            );
            await interaction.reply({ embeds: [embed], components: [row] });

    },
};
