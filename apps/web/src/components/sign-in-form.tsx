import { toast } from "sonner";
import { signIn, useSession } from "@/lib/auth-client";
import Loader from "./loader";
import { Button } from "./ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "./ui/card";
import { useState } from "react";

export function SignInForm() {
	const { isPending } = useSession();
	const [loading, setLoading] = useState(false);

	const handleGoogleSignIn = async () => {
		setLoading(true);
		toast.promise(
			signIn.social({
				provider: "google",
				callbackURL: window.location.origin,
			}),
			{
				loading: "Redirecting to Google...",
				success: "Successfully signed in!",
				error: "Failed to sign in.",
			},
		);
		setLoading(false);
	};

	if (isPending) {
		return <Loader />;
	}

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>
						<h1 className="mb-6 text-center font-bold text-3xl">
							Welcome Back
						</h1>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Button
						className="w-full"
						disabled={loading}
						onClick={handleGoogleSignIn}
					>
						Sign In with Google
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
