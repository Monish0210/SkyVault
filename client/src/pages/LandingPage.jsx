import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Cloud, HardDrive, History, ShieldCheck, Share2 } from 'lucide-react'
import { Button } from '../components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx'
import BlueBubblesBackground from '../components/BlueBubblesBackground.jsx'

/**
 * Landing page placeholder for Phase 1 shell.
 * @returns {import('react').JSX.Element}
 */
function LandingPage() {
	return (
		<main className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900">
			<BlueBubblesBackground />
			<div className="relative border-b border-slate-200 bg-white/92 backdrop-blur">
				<div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5">
					<div className="flex items-center gap-2.5">
						<div className="rounded-md bg-blue-600 p-1.5 text-white">
							<Cloud className="size-4" aria-hidden="true" />
						</div>
						<p className="text-2xl font-semibold tracking-tight">SkyVault</p>
					</div>
					<Button asChild variant="outline" className="border-slate-300">
						<Link to="/login">Sign In</Link>
					</Button>
				</div>
			</div>

			<div className="relative mx-auto w-full max-w-7xl px-6 py-10 lg:py-12">
				<section className="grid items-center gap-8 lg:grid-cols-12">
					<div className="lg:col-span-7">
						<p className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
							<ShieldCheck className="size-3.5" aria-hidden="true" />
							Secure Cloud Storage
						</p>
						<h1 className="text-4xl leading-tight font-bold tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
							Keep every file organized, backed up, and ready to share
						</h1>
						<p className="mt-4 max-w-2xl text-lg text-slate-600 lg:text-xl">
							SkyVault gives your team a familiar workspace for uploads, version history, and secure links in one place.
						</p>
						<div className="mt-6 flex flex-col gap-3 sm:flex-row">
							<Button asChild className="h-12 bg-blue-600 px-8 text-base text-white hover:bg-blue-700">
								<Link to="/register" className="inline-flex items-center gap-2">
									Get Started
									<ArrowRight className="size-4" />
								</Link>
							</Button>
							<Button asChild variant="outline" className="h-12 border-slate-300 bg-white/80 px-8 text-base">
								<Link to="/login">Open Dashboard</Link>
							</Button>
						</div>
					</div>

					<div className="lg:col-span-5">
						<Card className="border-slate-200 bg-white/95 shadow-sm">
							<CardHeader>
								<CardTitle className="text-lg text-slate-900">Workspace Overview</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
									<p className="text-sm font-medium text-slate-500">Storage quota</p>
									<p className="mt-1 text-2xl font-semibold">2 GB included</p>
								</div>
								<div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
									<p className="text-sm font-medium text-slate-500">Version recovery</p>
									<p className="mt-1 text-2xl font-semibold">Instant restore</p>
								</div>
								<div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
									<p className="text-sm font-medium text-slate-500">Link sharing</p>
									<p className="mt-1 text-2xl font-semibold">Expires in 1 hour</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</section>

				<section className="mt-10 lg:mt-12">
					<div className="mb-5 flex items-center justify-between">
						<h2 className="text-2xl font-semibold tracking-tight text-slate-900">Why teams choose SkyVault</h2>
					</div>
					<div className="grid gap-5 md:grid-cols-3">
						<Card className="border-slate-200 bg-white/95 shadow-sm">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg text-slate-900">
									<HardDrive className="size-5 text-blue-600" aria-hidden="true" />
									2 GB Free Storage
								</CardTitle>
							</CardHeader>
							<CardContent className="text-slate-600">Store important files in your private cloud space.</CardContent>
						</Card>

						<Card className="border-slate-200 bg-white/95 shadow-sm">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg text-slate-900">
									<History className="size-5 text-blue-600" aria-hidden="true" />
									File Versioning
								</CardTitle>
							</CardHeader>
							<CardContent className="text-slate-600">Keep older versions available whenever you need to roll back.</CardContent>
						</Card>

						<Card className="border-slate-200 bg-white/95 shadow-sm">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg text-slate-900">
									<Share2 className="size-5 text-blue-600" aria-hidden="true" />
									Secure Sharing
								</CardTitle>
							</CardHeader>
							<CardContent className="text-slate-600">Share files with expiring links and controlled access.</CardContent>
						</Card>
					</div>
				</section>
			</div>
		</main>
	)
}

export default LandingPage

