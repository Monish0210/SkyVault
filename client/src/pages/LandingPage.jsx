import React from 'react'
import { Link } from 'react-router-dom'
import { HardDrive, History, Share2 } from 'lucide-react'
import { Button } from '../components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx'

/**
 * Landing page placeholder for Phase 1 shell.
 * @returns {import('react').JSX.Element}
 */
function LandingPage() {
	return (
		<main className="min-h-screen bg-slate-900 text-slate-100">
			<div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-6 py-16">
				<section className="mb-12 text-center">
					<h1 className="mb-4 text-5xl font-extrabold tracking-tight text-white md:text-6xl">SkyVault</h1>
					<p className="mb-8 text-lg text-slate-300">Your files, secured in the cloud</p>
					<div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
						<Button asChild className="h-10 px-6">
							<Link to="/register">Get Started</Link>
						</Button>
						<Button asChild variant="outline" className="h-10 border-slate-500 bg-transparent px-6 text-slate-100 hover:bg-slate-800">
							<Link to="/login">Sign In</Link>
						</Button>
					</div>
				</section>

				<section className="grid w-full gap-4 md:grid-cols-3">
					<Card className="bg-slate-800/90 text-slate-100 ring-slate-700">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-base text-white">
								<HardDrive className="size-4" aria-hidden="true" />
								2 GB Free Storage
							</CardTitle>
						</CardHeader>
						<CardContent className="text-slate-300">Store important files in your private cloud space.</CardContent>
					</Card>

					<Card className="bg-slate-800/90 text-slate-100 ring-slate-700">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-base text-white">
								<History className="size-4" aria-hidden="true" />
								File Versioning
							</CardTitle>
						</CardHeader>
						<CardContent className="text-slate-300">Keep older versions available whenever you need to roll back.</CardContent>
					</Card>

					<Card className="bg-slate-800/90 text-slate-100 ring-slate-700">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-base text-white">
								<Share2 className="size-4" aria-hidden="true" />
								Secure Sharing
							</CardTitle>
						</CardHeader>
						<CardContent className="text-slate-300">Share files with expiring links and controlled access.</CardContent>
					</Card>
				</section>
			</div>
		</main>
	)
}

export default LandingPage

