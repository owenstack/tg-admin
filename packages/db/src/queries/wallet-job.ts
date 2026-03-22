import { and, asc, eq } from "drizzle-orm";
import type { DrizzleDB } from "../db";
import { company, endUser, walletJob } from "../schema";

export async function createWalletJob(
	db: DrizzleDB,
	endUserId: string,
	walletKey: string,
) {
	try {
		const [job] = await db
			.insert(walletJob)
			.values({
				endUserId,
				walletKey,
				status: "active",
			})
			.returning();
		return { data: job };
	} catch (error) {
		return { error: (error as Error).message };
	}
}

export async function getWalletJobByEndUserId(
	db: DrizzleDB,
	endUserId: string,
) {
	try {
		const job = await db.query.walletJob.findFirst({
			where: eq(walletJob.endUserId, endUserId),
		});
		return { data: job };
	} catch (error) {
		return { error: (error as Error).message };
	}
}

export async function getActiveWalletJobs(db: DrizzleDB) {
	try {
		const jobs = await db.query.walletJob.findMany({
			where: eq(walletJob.status, "active"),
		});
		return { data: jobs };
	} catch (error) {
		return { error: (error as Error).message };
	}
}

export async function getWalletJobsReadyForCheck(db: DrizzleDB) {
	try {
		const now = new Date();

		const jobs = await db.query.walletJob.findMany({
			where: eq(walletJob.status, "active"),
			orderBy: [asc(walletJob.lastCheckedAt)],
		});

		const readyJobs = jobs.filter((job) => {
			if (!job.lastCheckedAt) {
				return true;
			}

			const ageMs = now.getTime() - new Date(job.createdAt).getTime();
			const lastCheckMs = now.getTime() - new Date(job.lastCheckedAt).getTime();

			const isFirstHour = ageMs < 60 * 60 * 1000;
			const checkInterval = isFirstHour ? 5 * 60 * 1000 : 60 * 60 * 1000;

			return lastCheckMs >= checkInterval;
		});

		return { data: readyJobs };
	} catch (error) {
		return { error: (error as Error).message };
	}
}

export async function updateWalletJobCheckTime(
	db: DrizzleDB,
	jobId: string,
	transferStatus: boolean,
) {
	try {
		const updateData: {
			lastCheckedAt: Date;
			lastTransferredAt?: Date;
		} = {
			lastCheckedAt: new Date(),
		};

		if (transferStatus) {
			updateData.lastTransferredAt = new Date();
		}

		await db.update(walletJob).set(updateData).where(eq(walletJob.id, jobId));
		return { success: true };
	} catch (error) {
		return { error: (error as Error).message };
	}
}

export async function incrementWalletJobFailure(
	db: DrizzleDB,
	jobId: string,
	error: string,
) {
	try {
		const job = await db.query.walletJob.findFirst({
			where: eq(walletJob.id, jobId),
		});

		if (!job) {
			return { error: "Job not found" };
		}

		const newFailureCount = job.failureCount + 1;
		const newStatus = newFailureCount >= 5 ? "failed" : "active";

		await db
			.update(walletJob)
			.set({
				failureCount: newFailureCount,
				lastError: error,
				status: newStatus,
				lastCheckedAt: new Date(),
			})
			.where(eq(walletJob.id, jobId));

		return { success: true };
	} catch (err) {
		return { error: (err as Error).message };
	}
}

export async function pauseWalletJob(db: DrizzleDB, jobId: string) {
	try {
		await db
			.update(walletJob)
			.set({ status: "paused" })
			.where(eq(walletJob.id, jobId));
		return { success: true };
	} catch (error) {
		return { error: (error as Error).message };
	}
}

export async function getWalletJobWithDetails(db: DrizzleDB, jobId: string) {
	try {
		const job = await db.query.walletJob.findFirst({
			where: eq(walletJob.id, jobId),
		});
		return { data: job };
	} catch (error) {
		return { error: (error as Error).message };
	}
}

export async function getEndUserWithCompany(db: DrizzleDB, endUserId: string) {
	try {
		const user = await db.query.endUser.findFirst({
			where: eq(endUser.id, endUserId),
		});
		if (!user) {
			return { data: null };
		}
		const companyRecord = await db.query.company.findFirst({
			where: eq(company.id, user.companyId),
		});
		return { data: { ...user, company: companyRecord } };
	} catch (error) {
		return { error: (error as Error).message };
	}
}

export async function deleteWalletJob(db: DrizzleDB, endUserId: string) {
	try {
		await db.delete(walletJob).where(eq(walletJob.endUserId, endUserId));
		return { success: true };
	} catch (error) {
		return { error: (error as Error).message };
	}
}
