export default function Dashboard() {
    return (
        <main className="min-h-screen p-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="mt-2 text-muted-foreground">
                AI-powered QA testing platform
            </p>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
                <div className="rounded-xl border p-6">
                    <h2 className="text-xl font-semibold">Repositories</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Connect your GitHub repositories.
                    </p>
                </div>

                <div className="rounded-xl border p-6">
                    <h2 className="text-xl font-semibold">Test Cases</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Generate AI-powered tests.
                    </p>
                </div>

                <div className="rounded-xl border p-6">
                    <h2 className="text-xl font-semibold">Executions</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Run tests in the cloud browser.
                    </p>
                </div>
            </div>
        </main>
    );
}