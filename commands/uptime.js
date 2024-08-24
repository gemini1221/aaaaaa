const { EmbedBuilder } = require('discord.js');
const os = require('os');

module.exports = {
    name: 'uptime',
    description: 'ボットの稼働時間を表示します',
    async execute(interaction) {
        try {
            const formatUptime = (uptime) => {
                const seconds = Math.floor((uptime / 1000) % 60);
                const minutes = Math.floor((uptime / (1000 * 60)) % 60);
                const hours = Math.floor((uptime / (1000 * 60 * 60)) % 24);
                const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
                return { days, hours, minutes, seconds };
            };

            const getCpuUsage = () => {
                const cpuUsage = process.cpuUsage();
                return ((cpuUsage.user + cpuUsage.system) / 1000000).toFixed(2);
            };

            const getMemoryUsage = () => {
                const totalMemory = os.totalmem();
                const freeMemory = os.freemem();
                const usedMemory = totalMemory - freeMemory;
                return ((usedMemory / totalMemory) * 100).toFixed(2);
            };

            const { days, hours, minutes, seconds } = formatUptime(interaction.client.uptime);
            const startTime = new Date(interaction.client.readyTimestamp);
            const startDate = startTime.toLocaleDateString();
            const startTimeStr = startTime.toLocaleTimeString();
            const totalSeconds = Math.floor(interaction.client.uptime / 1000);
            const cpuPercentage = getCpuUsage();
            const memoryUsagePercentage = getMemoryUsage();

            const embed = new EmbedBuilder()
                .setColor(0x7fff7f)
                .setTitle('⏳ ボット稼働時間')
                .setDescription(`稼働時間: ${days}日 ${hours}時間 ${minutes}分 ${seconds}秒\n` +
                                `稼働開始日時: ${startDate} ${startTimeStr}\n` +
                                `総稼働秒数: ${totalSeconds}秒\n` +
                                `CPU使用率: ${cpuPercentage}%\n` +
                                `メモリ使用率: ${memoryUsagePercentage}%`)
                 .setFooter({
                                    text: `${interaction.user.username} | ${new Date().toLocaleString()}`,
                                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                                })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error("Error fetching uptime:", error);
            await interaction.reply("エラーが発生しました。後でもう一度お試しください。");
        }
    },
};