const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'nuke',
    description: 'チャンネルを初期化します',
    options: [],
    async execute(interaction) {
        if (!interaction.member.permissions.has('MANAGE_CHANNELS')) {
            return interaction.reply({ content: 'このコマンドを使用する権限がありません。', ephemeral: true });
        }
        const user = interaction.user;
        const channel = interaction.channel;
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setAuthor({ name: 'nuke', iconURL: 'https://i.imgur.com/0qRNT3X.gif' })
            .setTitle('チャンネルリセット')
            .setDescription('このチャンネルをリセットしますか？\nこの操作は元に戻せません。')
            .setFooter({ text: `${user.username} | ${new Date().toLocaleString()}`, iconURL: user.displayAvatarURL({ dynamic: true }) });
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm-nuke')
                    .setLabel('リセット')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('cancel-nuke')
                    .setLabel('キャンセル')
                    .setStyle(ButtonStyle.Secondary)
            );

        const response = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
        const collector = response.createMessageComponentCollector({ 
            filter: i => i.user.id === interaction.user.id,
            time: 15000 
        });

        collector.on('collect', async i => {
            if (i.customId === 'confirm-nuke') {
                await i.update({ content: 'チャンネルを初期化中...', embeds: [], components: [] });
                try {
                    const { position, parent } = channel;
                    const newChannel = await channel.clone({
                        reason: `Nuked by ${interaction.user.tag}`
                    });
                    await channel.delete(`Nuked by ${interaction.user.tag}`);
                    await newChannel.setPosition(position);
                    if (parent) await newChannel.setParent(parent.id);

                    const nukeEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('チャンネル初期化完了')
                        .setImage('https://i.imgur.com/ywupAhZ.gif')
                        .setFooter({
                            text: `nuke | ${new Date().toLocaleString()}`,
                            iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }),
                        })
                        .setTimestamp();

                    await newChannel.send({ embeds: [nukeEmbed]});
                } catch (error) {
                    console.error('Nuke error:', error);
                    await i.editReply({ content: 'チャンネルの初期化中にエラーが発生しました。', embeds: [], components: [] });
                }
            } else if (i.customId === 'cancel-nuke') {
                await i.update({ content: 'チャンネルの初期化をキャンセルしました。', embeds: [], components: [] });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: '時間切れになりました。チャンネルの初期化をキャンセルしました。', embeds: [], components: [] });
            }
        });
    },
};