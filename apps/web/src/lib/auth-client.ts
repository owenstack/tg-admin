import type { auth } from "@tg-admin/auth";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient({
	baseURL: import.meta.env.VITE_SERVER_URL,
	plugins: [inferAdditionalFields<typeof auth>()],
});

export const { signIn, signUp, signOut, getSession, useSession } = authClient;
