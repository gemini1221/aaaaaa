const { EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    name: 'server',
    description: 'サーバーの詳細情報を表示します。',
    async execute(interaction) {
        const { guild } = interaction;
        const owner = await guild.fetchOwner();
        
        const roles = guild.roles.cache.sort((a, b) => b.position - a.position).map(role => role.toString());
        const members = guild.members.cache;
        const channels = guild.channels.cache;
        const emojis = guild.emojis.cache;

        const embed = new EmbedBuilder()
            .setColor(0x7fff7f)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: 'サーバー名', value: guild.name, inline: true },
                { name: 'サーバーID', value: guild.id, inline: true },
                { name: 'オーナー', value: `${owner.user.tag} (${owner.id})`, inline: true },
                { name: '作成日', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                { name: 'サーバーブースト', value: `レベル ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0} ブースト)`, inline: true },
                { name: 'コンテンツフィルター', value: getContentFilterLevel(guild.explicitContentFilter), inline: true },
                { name: '認証レベル', value: getVerificationLevel(guild.verificationLevel), inline: true },
                { name: 'メンバー数', value: `総数: ${guild.memberCount}\nオンライン: ${members.filter(m => m.presence?.status === 'online').size}\nボット: ${members.filter(m => m.user.bot).size}`, inline: true },
                { name: 'チャンネル数', value: `カテゴリ: ${channels.filter(c => c.type === ChannelType.GuildCategory).size}\nテキスト: ${channels.filter(c => c.type === ChannelType.GuildText).size}\nボイス: ${channels.filter(c => c.type === ChannelType.GuildVoice).size}`, inline: true },
                { name: '絵文字数', value: `通常: ${emojis.filter(emoji => !emoji.animated).size}\nアニメーション: ${emojis.filter(emoji => emoji.animated).size}`, inline: true },
                { name: `役職 [${roles.length - 1}]`, value: roles.length < 10 ? roles.join(', ') : roles.length > 10 ? `${roles.slice(0, 10).join(', ')}...` : 'なし' },
            )
            .setImage(guild.bannerURL({ dynamic: true, size: 1024 }))
            .setFooter({
                text: `server info | ${new Date().toLocaleString()}`,
                iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }),
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};

function getContentFilterLevel(level) {
    const levels = ['無効', 'メンバー未設定のみ', '全員'];
    return levels[level];
}

function getVerificationLevel(level) {
    const levels = ['無し', '低', '中', '高', '最高'];
    return levels[level];
}