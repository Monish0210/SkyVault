import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Clock, Download } from 'lucide-react'
import { toast } from 'sonner'
import api from '../lib/axios.js'
import { formatBytes, formatDate } from '../utils/formatters.js'
import { Badge } from './ui/badge.jsx'
import { Button } from './ui/button.jsx'
import ShareDialog from './ShareDialog.jsx'
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
	const [isOpen, setIsOpen] = React.useState(false)

	const versionsQuery = useQuery({
		queryKey: ['versions', fileId],
		queryFn: () => api.get(`/files/${fileId}/versions`).then((response) => response.data),
		enabled: isOpen,
	})

	const versions = [...(versionsQuery.data || [])].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
	)

	const fileName = versions[0]?.originalName || 'Unknown file'

	const onDownloadVersion = async (version) => {
		try {
			const response = await api.get(`/files/${version._id}/download`, {
				params: {
					versionId: version.s3VersionId,
				},
			})

			window.open(response.data.url, '_blank', 'noopener,noreferrer')
		} catch (error) {
			toast.error('Unable to generate download link for this version')
		}
	}

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
					<DialogTitle>Version history for: {fileName}</DialogTitle>
					<DialogDescription>Newest versions appear first.</DialogDescription>
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
								<p className="text-sm font-medium">Version {versions.length - index}</p>
								{version.isCurrent ? <Badge>Current</Badge> : null}
							</div>

							<p className="text-xs text-slate-600">{formatDate(version.createdAt)}</p>
							<p className="mb-3 text-xs text-slate-600">{formatBytes(version.size)}</p>

							<div className="flex flex-wrap gap-2">
								<Button
									size="sm"
									variant="outline"
									className="border-slate-300"
									onClick={() => onDownloadVersion(version)}
								>
									<Download className="mr-1 size-4" />
									Download
								</Button>
								<ShareDialog
									fileId={version._id}
									versionId={version.s3VersionId}
									sharingLabel={`Version ${versions.length - index} (uploaded on ${formatDate(version.createdAt)})`}
								/>
							</div>
						</div>
					))}
				</div>

				<p className="text-xs text-slate-500">All versions are stored securely in AWS S3</p>
			</DialogContent>
		</Dialog>
	)
}

export default VersionHistory

