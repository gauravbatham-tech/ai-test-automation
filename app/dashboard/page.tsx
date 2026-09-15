"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
    const [repos, setRepos] = useState<any[]>([]);
    const [error, setError] = useState("");
    const [selectedRepo, setSelectedRepo] = useState<any>(null);

    useEffect(() => {
        fetch("/api/auth/github/repos")
            .then((res) => res.json())
            .then((data) => {
                if (data.error) setError(data.error);
                else setRepos(data);
            });
    }, []);

    return (
        <main className="min-h-screen p-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>

            <h2 className="mt-8 text-xl font-semibold">Your GitHub Repositories</h2>

            {error && <p className="mt-4 text-red-500">{error}</p>}

            <div className="mt-4 space-y-3">
                {repos.map((repo) => (
                    <div
                        key={repo.id}
                        onClick={() => setSelectedRepo(repo)}
                        className="cursor-pointer rounded-lg border p-4 hover:bg-gray-50"
                    >
                        <p className="font-semibold">{repo.name}</p>
                        <p className="text-sm text-gray-500">{repo.description}</p>
                    </div>
                ))}
            </div>

            {selectedRepo && (
                <div className="mt-8 rounded-lg border p-6">
                    <h2 className="text-xl font-bold">Selected Repository</h2>
                    <p className="mt-2">{selectedRepo.full_name}</p>
                </div>
            )}
        </main>
    );
}