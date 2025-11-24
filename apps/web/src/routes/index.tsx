import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Building2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersTable } from "@/components/users";
import { userColumns } from "@/components/users/columns";
import { getSession } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/")({
	component: RouteComponent,
	beforeLoad: async () => {
		const session = await getSession();
		if (!session.data) {
			redirect({
				to: "/login",
				throw: true,
			});
		}
		return { session };
	},
});

function RouteComponent() {
	const { session } = Route.useRouteContext();

	const { data } = useQuery(orpc.admin.getAll.queryOptions());
	const tableData =
		data?.users.map((user) => ({
			...user,
			company: data?.companies.find((c) => c.id === user.companyId)?.name || "",
		})) || [];

	return (
		<main className="flex flex-col gap-2 p-4">
			<div>
				<div className="container py-6">
					<h1 className="font-semibold text-3xl text-foreground tracking-tight">
						Dashboard
					</h1>
					<p className="mt-1 text-lg text-muted-foreground">
						Welcome back,{" "}
						<span className="font-medium text-foreground">
							{session.data?.user.name}
						</span>
					</p>
				</div>
			</div>
			<div className="container space-y-8 py-8">
				<div className="grid grid-cols-2 gap-6">
					<Card className="transition-all duration-200 hover:shadow-md">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Active Users
							</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent className="items-center-safe flex gap-2">
							<div className="font-semibold text-2xl">
								{data?.users.length || 0}
							</div>
							<p className="text-muted-foreground text-xs">
								Total registered users
							</p>
						</CardContent>
					</Card>
					<Card className="transition-all duration-200 hover:shadow-md">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Active Companies
							</CardTitle>
							<Building2 className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent className="items-center-safe flex gap-2">
							<div className="font-semibold text-2xl">
								{data?.companies.length || 0}
							</div>
							<p className="text-muted-foreground text-xs">
								Total registered companies
							</p>
						</CardContent>
					</Card>
				</div>
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="font-semibold text-2xl tracking-tight">Users</h2>
					</div>
					<UsersTable columns={userColumns} data={tableData} />
				</div>
			</div>
		</main>
	);
}
