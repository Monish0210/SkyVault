import React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Clock } from 'lucide-react'
import { toast } from 'sonner'
import api from '../lib/axios.js'
import { formatBytes, formatDate } from '../utils/formatters.js'
import { Badge } from './ui/badge.jsx'
import { Button } from './ui/button.jsx'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from './ui/dialog.jsx'

/**
 * Version history dialog for a file.
 * @param {{ fileId: string }} props
 * @returns {import('react').JSX.Element}
 */
function VersionHistory({ fileId }) {
	const queryClient = useQueryClient()
	const [isOpen, setIsOpen] = React.useState(false)

	const versionsQuery = useQuery({
		queryKey: ['versions', fileId],
		queryFn: () => api.get(`/files/${fileId}/versions`).then((response) => response.data),
		enabled: isOpen,
	})

	const restoreMutation = useMutation({
		mutationFn: (targetS3VersionId) => api.post(`/files/${fileId}/restore-version`, { targetS3VersionId }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['files'] })
			toast.success('Version restored successfully')
			setIsOpen(false)
		},
		onError: (error) => {
			const message = error?.response?.data?.error || 'Failed to restore version'
			toast.error(message)
		},
	})

	const versions = versionsQuery.data || []

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm" className="border-slate-300" aria-label="View version history">
					<Clock className="mr-1 size-4" />
					Versions
				</Button>
			</DialogTrigger>

			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Version History</DialogTitle>
					<DialogDescription>Review previous versions and restore any snapshot.</DialogDescription>
				</DialogHeader>

				<div className="max-h-80 space-y-3 overflow-y-auto pr-1">
					{versionsQuery.isLoading ? (
						<div className="space-y-2">
							<div className="h-12 animate-pulse rounded-lg bg-slate-200" />
							<div className="h-12 animate-pulse rounded-lg bg-slate-200" />
						</div>
					) : null}

					{!versionsQuery.isLoading && versions.length === 0 ? (
						<p className="text-sm text-slate-600">No versions found.</p>
					) : null}

					{versions.map((version, index) => (
						<div key={version._id} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
							<div className="mb-2 flex items-center justify-between gap-2">
								<p className="text-sm font-medium">Version {index + 1}</p>
								{version.isCurrent ? <Badge>Current</Badge> : null}
							</div>

							<p className="text-xs text-slate-600">{formatDate(version.createdAt)}</p>
							<p className="mb-3 text-xs text-slate-600">{formatBytes(version.size)}</p>

							<Button
								size="sm"
								variant="outline"
								className="border-slate-300"
								disabled={restoreMutation.isPending || version.isCurrent}
								onClick={() => restoreMutation.mutate(version.s3VersionId)}
							>
								Restore
							</Button>
						</div>
					))}
				</div>
			</DialogContent>
		</Dialog>
	)
}

export default VersionHistory

