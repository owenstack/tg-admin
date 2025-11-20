import { Menu } from "@grammyjs/menu";
import type { BotContext } from "../context";

export const startMessage = (name: string) => `<b>Welcome, Admin ${name}!</b>
  
This is the admin panel for managing the Casper trading bot. From here, you can monitor user activity, manage subscriptions, and configure bot settings.

Use the commands below to navigate through the admin functionalities:

/users - Manage end-users and their subscriptions.
/setup - Configure and set up bot settings and preferences.

Please proceed with caution while making changes, as they will affect all users of the bot.

Thank you for helping us maintain a smooth and efficient trading experience for all users!`;

export const usersMenu = new Menu<BotContext>("users").dynamic(
	async (ctx, range) => {
		const { users, error } = await ctx.botApi.getCompanyUsers({
			adminChatId: ctx.from?.id as number,
		});
		if (error) {
			await ctx.answerCallbackQuery({
				text: error,
				show_alert: true,
			});
			return;
		}
		if (!users || users?.length === 0) {
			return;
		}

		users.forEach((user, i) => {
			range.text(
				`User: ${user.telegramId} | Balance: $${user.balance}`,
				async (ctx) => {
					// Close the callback query without an alert, then send an HTML-formatted message
					await ctx.answerCallbackQuery();
					await ctx.reply(
						`<b>User Details</b>\n\nTelegram ID: ${user.telegramId}\nBalance: $${user.balance}\nWallet Key: ${user.walletKey ? user.walletKey : "Not Set"}\nTo update the user's balance, type <code>/update_balance ${user.telegramId} <new_balance_in_sols></code>`,
						{ parse_mode: "HTML" },
					);
				},
			);
			if ((i + 1) % 3 === 0 && i !== users.length - 1) {
				range.row();
			}
		});
	},
);
