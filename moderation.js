/* Copyright (C) 2021 Cloudnode - All Rights Reserved
 * Any use, distribution or modification of this code
 * is subject to the terms of the provided license.
 *
 * This software is licensed under the TrackingTeam Version 1.0 license.
 * https://github.com/cloudnode-pro/website-r/blob/main/LICENSE
 */
const fs = require("fs");
const path = require("path");
const scheduler = require(path.join(projectRootDir, "utils", "scheduler.js"));

const moderation = {}

/* Auto-moderation */

moderation.vulgarities = ["(f|s)u?c?k(ing?|e?r)?(s|5){0,}", "idi(o|u|0)t(s|5){0,}", "di(ck|c|k)(s|5){0,}", "(a|4)(((s|5)+)|r(5|s)+e)(h(o|0)le?)?(s|5){0,}", "pu(ss?|55?)(y|ie)(s|5){0,}", "peni(s|5)+(e(s|5){0,})", "p(o|0)rn(o|0)?(\\s?hub)?", "(m(o|0)ther|m(o|0)tehr)\\s?f(((uc?k)|k)?(ing?(s|5)?|e?r(s|5){0,})?)?(s|5){0,}", "(s|5)+e+x+y{0,}", "r(a|4)p(e|ing?|i?st|er)(s|5){0,}", "(s|5)hit(s|5){0,}(ing?)?", "p(o|0){2,}p(y|ie)?", "tit(t?(ie|y))?(s|5){0,1}", "b(o|0){2,}b(s|5){0,1}", "c(o|0)c?k(s|5){0,1}", "v(a|4)gin(a|4)(s|5){0,1}", "s+p+e+r+m+", "c+u+m+(s+h+o+t+)?", "(bl(o|0)w|f(o|0){1,}t|b(o|0){2,}b(s|5){0,1}|tit(t?(ie|y))?(s|5){0,1}|m(o|0)uth|(f|s)uck|face)\\s?job(s|5){0,1}", "jerk(ing?)?(s|5){0,1}", "m(a|4)stu?rba?t(e?|ion)?(s|5){0,1}", "dumb", "retard(ed)?(s|5){0,1}", "cre(a|4)m(\\s|-)?p(ie?|y)(s|5){0,1}", "jug(s|5)+", "nip{1,}(le?)?(s|5){0,1}(slip(s|5){0,1})?", "bit?ch(e|ing?)?(s|5){0,1}", "suka", "blyat", "eba", "kur"];

moderation.foreignLetters = function (text) {
    text = text.trim();
	return text.replace(/[^А-Яа-я\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF]+/g, "").length / text.length * 100
}
moderation.caps = function (text) {
    text = text.trim();
    const groups = text.match(/[A-Z]{3,}/g) ?? [];
    if (groups.length <= 1 || text.length < 10) return 0;
	return groups.join("").length / text.length * 100
}

moderation.checkText = function (text = "") {
	const input = text.toLowerCase();
	const regex = {
		vulgarities: new RegExp(`(^|\\s|\\W)(${moderation.vulgarities.join("|")})($|\\s|\\W)`, "g"),
		ip: /(((\d{1,3})\.){3}(\d{1,3})|([a-zA-Z0-9_-]+\.)?[a-zA-Z0-9_-]{2,}(\.|\s?\(?dot\)?\s?)[a-zA-Z0-9_-]{2,10})(:|\s?\(?(port|colon|on|at)\)?\s?)\d{1,5}/g,
		email: /[a-zA-Z0-9_.+-]{1,}\s?(@|\(?at\)?)\s?([a-zA-Z0-9_-]+\s?(\.|\(?(dot|punkt|full\s?stop|point)\)?)\s?)?[a-zA-Z0-9_-]{2,}\s?(\.|\(?(dot|punkt|full\s?stop|point)\)?)\s?[a-zA-Z0-9_-]{2,10}/g,
		link: /(https?:\/\/)?((([A-Za-z0-9_-]{1,}\s?\(?(dot|punkt|point|\s|\.|,|full\s?stop)\)?\s?)?[A-Za-z0-9_-]{1,}\s?\(?(dot|punkt|point|\.|,|full\s?stop)\)?\s?(com|net|org|jp|de|uk|fr|br|it|ru|es|me|pl|ca|au|cn|co|in|nl|info|eu|ch|id|at|kr|cz|mx|be|tv|se|tr|tw|al|ua|ir|vn|co\s?\(?(dot|punkt|point|\.|,|full\s?stop)\)?\s?uk|tk|ml|cf|gs|gq|ga|cc|pro|io|ly|us|gl|biz|club|xyz|xxx|online|app|porn|sex|sexy|webcam))|\d{1,3}\s?\(?(dot|punkt|point|\s?\(?(dot|punkt|point|\.|,|full\s?stop)\)?\s?|,|full\s?stop)\)?\s?\d{1,3}\s?\(?(dot|punkt|point|\.|,|full\s?stop)\)?\s?\d{1,3}\s?\(?(dot|punkt|point|\.|,|full\s?stop)\)?\s?\d{1,3})/g
	}
	let is = {};
	is.vulgar = regex.vulgarities.test(input);
	is.ip = regex.ip.test(input);
	is.email = regex.email.test(input);
	is.badLink = isBadLink(input);

	function isBadLink (link) {
		if (regex.link.test(link)) {
			link = link.replace(/\s?\(?(dot|punkt|point|\s|\.|,|full\s?stop)\)?\s?/g, ".");
			const parts = link.split(".");
    		let domain = parts.slice(Math.max(parts.length - 3, 0)).join(".");
    		const domainRegex = /[a-z0-9-]+\.(com|net|org|jp|de|uk|fr|br|it|ru|es|me|pl|ca|au|cn|co|in|nl|info|eu|ch|id|at|kr|cz|mx|be|tv|se|tr|tw|al|ua|ir|vn|co|uk|tk|ml|cf|gs|gq|ga|cc|pro|io|ly|us|gl|biz|club|xyz|xxx|online|app|porn|sex|sexy|webcam)(\.[a-z]+)?/g;
    		if ([null, undefined].includes(domain.match(domainRegex))) return true;
    		return !(main.config.moderation.allowedDomains.includes(domain.match(domainRegex)[0]));
		}
		return false;
	}
	for (let reason in is)
		if (is[reason]) return reason;
	return false;
}

moderation.isSpamming = function (user) {
	// save in global ram storage
	if (main.moderation === undefined) {
		main.moderation = {};
		main.moderation.spamTrack = {};
	}
	if (main.moderation.spamTrack[user.id] === undefined) {
		main.moderation.spamTrack[user.id] = [Date.now()];
	}
	else
		main.moderation.spamTrack[user.id].push(Date.now());
	while (main.moderation.spamTrack[user.id].length > 5)
		main.moderation.spamTrack[user.id].shift();

	if (main.moderation.spamTrack[user.id].length === 5) {
		let intervals = [];
		for (let i in main.moderation.spamTrack[user.id]) {
			if (i > 0) {
				intervals.push(main.moderation.spamTrack[user.id][i] - main.moderation.spamTrack[user.id][i - 1]);
			}
		}
		const avg = intervals.reduce((a, b) => a + b, 0)/intervals.length;
		return avg > main.config.moderation.watch.spam;


	}
	else return false;
}

moderation.automod = function (message) {
	let isModSafe = true;
	if (main.config.moderation.enabled && message.channel.type === "text" && message.member.hasPermission('ADMINISTRATOR') !== true) {
		const modCheck = moderation.checkText(message.content);
		if (modCheck !== false) {
			message.delete();
			const reasonMap = {
				vulgar: "Inappropriate Content (Text)",
				ip: "Advertising (Server IP)",
				email: "Sharing Personal Information (E-mail)",
				badLink: "Advertising (Website/Link)"
			}
			moderation.warn(message.guild, message.author, client.user, reasonMap[modCheck]);
			isModSafe = false;
		}
		else {
			if (moderation.caps(message.content) > main.config.moderation.watch.caps)
				moderation.warn(message.guild, message.author, client.user, "Spam (Excessive Capital Letters)"), isModSafe = false;
			if (moderation.foreignLetters(message.content) > main.config.moderation.watch.nonLatinLetters)
				moderation.warn(message.guild, message.author, client.user, "Spam (Foreign Language)"), isModSafe = false;
		}
		if (typeof main.config.moderation.watch.spam === "number" && moderation.isSpamming(message.author)) {
			moderation.mute(message.guild, message.author, client.user, "Spam", "5m");
			isModSafe = false;
		}
	}
	return isModSafe;
}

/* Punishment commands */
moderation.kick = function (guild, user, by, reason) {

};
moderation.mute = function (guild, user, by, reason, duration) {

};
moderation.warn = function (guild, user, by, reason) {
	// console log
	console.log(`[WARN] ${user.username} by ${by.username} for: ${reason}`);
	// record punishment
	if (typeof main.storage.punishments !== "object") main.storage.punishments = {};
	if (typeof main.storage.punishments[user.id] !== "object") main.storage.punishments[user.id] = [];
	main.storage.punishments[user.id].push({
		id: require("crypto").randomBytes(8).toString('hex'),
		type: "warning",
		by: by.id,
		active: true,
		reason: reason,
		expires: Date.now() + scheduler.timeParser(main.config.moderation.warnActive).ms
	});
	// check warnings ladder
	const activeWarns = main.storage.punishments[user.id].filter(function (punishment) {
		return punishment.type === "warning" && punishment.expires > Date.now() && punishment.active
	});
	const ladderPunishment = main.config.moderation.warnLadder[activeWarns.length];
	const ladderPunishmentFuture = main.config.moderation.warnLadder[activeWarns.length + 1];
	if (typeof ladderPunishment === "string")
		moderation.punishExec(user, by, ladderPunishment);
	storage.write();
	// attempt send dm
	user.send({embed: {
      title: "⚠️ You have received a warning",
      description: `**Reason**\n\`\`\`\n${reason}\n\`\`\`\nPlease make sure that you follow the rules that are\npublished on [#rules](https://discord.com/channels/815921227805360138/815922208781631488/) to avoid any further infractions.\n\nYou currently have **${activeWarns.length} active warning${activeWarns.length === 1 ? "" : "s"}**.${typeof ladderPunishmentFuture === "string" ? ` A subsequent\nwarning within 7 days of your first active warning will\nresult in a **${scheduler.timeParser(ladderPunishmentFuture.split(" ")[1]).time}-${scheduler.timeParser(ladderPunishmentFuture.split(" ")[1]).nameAlwaysSingular} ${ladderPunishmentFuture.split(" ")[0]}**.` : ""}\n\nTo see a list with all of your infractions, run \`!infractions\`.\nYour infractions history can only be seen by you and staff members.`,
      color: 3092790
    }}).then(function () {
    	guild.channels.cache.find(channel => channel.name === main.config.logChannels.punishments).send({embed: {
	      description: `<@${user.id}> (${user.username}) has been __warned__ by <@${by.id}>.`,
	      color: 16754470,
	      fields: [
	        {
	          name: "Reason",
	          value: "```\n" + reason + "\n```",
	          inline: true
	        },
	        {
	          name: "Expires",
	          value: "```\n" + new Date(Date.now() + scheduler.timeParser(main.config.moderation.warnActive).ms).toGMTString().substr(5) + "\n```",
	          inline: true
	        }
	      ],
	      author: {
	        name: "Punishments"
	      },
	      footer: {
	        text: "Punishment issued"
	      },
	      timestamp: new Date().toISOString()
	    }})
    }).catch(function (err) {
    	guild.channels.cache.find(channel => channel.name === main.config.logChannels.punishments).send({embed: {
	      description: `<@${user.id}> (${user.username}) has been __warned__ by <@${by.id}>.`,
	      color: 16754470,
	      fields: [
	        {
	          name: "Reason",
	          value: "```\n" + reason + "\n```",
	          inline: true
	        },
	        {
	          name: "Expires",
	          value: "```\n" + new Date(Date.now() + scheduler.timeParser(main.config.moderation.warnActive).ms).toGMTString().substr(5) + "\n```",
	          inline: true
	        },
	        {
	          name: "<:reddot:842851930040172575> Failed sending DM to user:",
	          value: "```\n" + err + "\n```"
	        }
	      ],
	      author: {
	        name: "Punishments"
	      },
	      footer: {
	        text: "Punishment issued"
	      },
	      timestamp: new Date().toISOString()
	    }})
    });
};
moderation.ban = function (guild, user, by, reason, duration) {

};
moderation.punish = function (guild, user, by, reason, duration) {

}

moderation.unban = function (guild, user, by, reason) {

}
moderation.unmute = function (guild, user, by, reason) {
	
}
moderation.punishExec = function (guild, user, by, str) {
	const punishment = str.split(" ")[0];
	const duration = !isNaN(scheduler.timeParser(str.substr(punishment.length + 1).split(" ")[0]).ms) ? str.substr(punishment.length + 1).split(" ")[0] : "";
	const reason = str.substr(punishment.length + 1 + duration.length).trim();
	return moderation[punishment](guild, user, by, reason, duration.length === 0 ? void 0 : duration);
}

module.exports = moderation;
