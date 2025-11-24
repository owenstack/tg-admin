import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "../ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export type UserData = {
	id: string;
	telegramId: bigint;
	walletKey: string | null;
	balance: number;
	company: string;
};

export const userColumns: ColumnDef<UserData>[] = [
	{
		accessorKey: "telegramId",
		header: "Telegram ID",
	},
	{
		accessorKey: "walletKey",
		header: "Wallet Key",
		cell: ({ row }) => (
			<span className="flex-1">{row.getValue("walletKey")}</span>
		),
	},
	{
		accessorKey: "balance",
		header: () => <div className="text-right">Balance</div>,
		cell: ({ row }) => {
			const amount = Number.parseFloat(row.getValue("balance"));
			const formatted = new Intl.NumberFormat("en-US", {
				style: "currency",
				currency: "USD",
			}).format(amount);

			return <div className="text-right font-medium">{formatted}</div>;
		},
	},
	{
		accessorKey: "company",
		header: "Company",
	},
	{
		id: "actions",
		cell: ({ row }) => {
			const user = row.original;

			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-8 w-8 p-0">
							<span className="sr-only">Open menu</span>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>Actions</DropdownMenuLabel>
						<DropdownMenuItem
							onClick={() =>
								navigator.clipboard.writeText(user.telegramId.toString())
							}
						>
							Copy Telegram ID
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() =>
								navigator.clipboard.writeText(user.walletKey || "")
							}
						>
							Copy Wallet Key
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
