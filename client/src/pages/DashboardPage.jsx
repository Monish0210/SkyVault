import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Cloud, Loader2, X } from 'lucide-react'
import { Button } from '../components/ui/button.jsx'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert.jsx'
import { Progress } from '../components/ui/progress.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs.jsx'
import DropZone from '../components/DropZone.jsx'
import FileList from '../components/FileList.jsx'
import { useFilesList, useStorageInfo, useTrashList } from '../hooks/useFiles.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Toaster } from 'sonner'

/**
 * Dashboard page placeholder for Phase 1 shell.
 * @returns {import('react').JSX.Element}
 */
function DashboardPage() {
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const { user, logout } = useAuth()
	const [showCriticalAlert, setShowCriticalAlert] = React.useState(true)

	const { data: files = [], isLoading: filesLoading } = useFilesList()
	const { data: trash = [], isLoading: trashLoading } = useTrashList()
	const { data: storageInfo, isLoading: storageLoading } = useStorageInfo()
	const [isFirstLoad, setIsFirstLoad] = React.useState(true)

	React.useEffect(() => {
		if (!filesLoading && !trashLoading && !storageLoading) {
			setIsFirstLoad(false)
		}
	}, [filesLoading, trashLoading, storageLoading])

	const storagePercent = storageInfo?.storagePercent ?? 0
	const storageUsed = storageInfo?.storageUsed ?? 0
	const storageLimit = storageInfo?.storageLimit ?? 2147483648

	let progressIndicatorClass = 'storage-progress-safe'
	if (storagePercent >= 70 && storagePercent <= 90) {
		progressIndicatorClass = 'storage-progress-warning'
	}
	if (storagePercent > 90) {
		progressIndicatorClass = 'storage-progress-danger'
	}

	const handleLogout = () => {
		logout()
		queryClient.clear()
		navigate('/login')
	}

	if (isFirstLoad && (filesLoading || trashLoading || storageLoading)) {
		return (
			<main className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-700">
				<div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
					<Loader2 className="h-8 w-8 animate-spin" />
					<p className="text-sm font-medium">Loading your files...</p>
				</div>
			</main>
		)
	}

	return (
		<main className="min-h-screen bg-slate-50 text-slate-900">
			<Toaster richColors position="top-right" />
			<header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
				<div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5">
					<div className="flex items-center gap-3">
						<div className="rounded-md bg-blue-600 p-2 text-white">
							<Cloud className="size-5" aria-hidden="true" />
						</div>
						<div>
							<p className="text-xl font-semibold tracking-tight">SkyVault</p>
							<p className="text-sm text-slate-500">Your secure file workspace</p>
						</div>
					</div>
					<div className="flex items-center gap-4">
						<span className="hidden text-base text-slate-600 sm:inline">{user?.email || storageInfo?.email}</span>
						<Button variant="outline" className="border-slate-300 text-base" onClick={handleLogout}>
							Logout
						</Button>
					</div>
				</div>
			</header>

			<div className="mx-auto w-full max-w-7xl px-5 py-8">
				<section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
					<div className="mb-2 flex items-center justify-between text-base text-slate-600">
						<span>Storage used</span>
						<span>
							{storageLoading ? 'Loading...' : `${storageUsed.toLocaleString()} / ${storageLimit.toLocaleString()} bytes (${storagePercent}%)`}
						</span>
					</div>
					<Progress value={storagePercent} className={`h-2 ${progressIndicatorClass}`} />
				</section>

				{storagePercent > 95 && showCriticalAlert ? (
					<Alert variant="destructive" className="mb-6">
						<div className="flex w-full items-start justify-between gap-3">
							<div>
								<AlertTitle>Storage almost full</AlertTitle>
								<AlertDescription>
									Your storage usage is above 95%. Delete files or empty trash to continue uploading.
								</AlertDescription>
							</div>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="h-7 w-7"
								onClick={() => setShowCriticalAlert(false)}
								aria-label="Dismiss storage alert"
							>
								<X className="size-4" />
							</Button>
						</div>
					</Alert>
				) : null}

				<Tabs defaultValue="files" className="w-full">
					<TabsList className="border border-slate-200 bg-white">
						<TabsTrigger value="files">My Files</TabsTrigger>
						<TabsTrigger value="trash">Trash</TabsTrigger>
					</TabsList>

					<TabsContent value="files" className="space-y-4 pt-2">
						<DropZone />
						<FileList files={files} mode="files" isLoading={filesLoading} />
					</TabsContent>

					<TabsContent value="trash" className="pt-2">
						<FileList files={trash} mode="trash" isLoading={trashLoading} />
					</TabsContent>
				</Tabs>
			</div>
		</main>
	)
}

export default DashboardPage

