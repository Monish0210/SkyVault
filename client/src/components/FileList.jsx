import React from 'react'
import { Download, Inbox, RotateCcw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import api from '../lib/axios.js'
import { usePermanentDelete, useRestore, useSoftDelete } from '../hooks/useFiles.js'
import { formatBytes, formatDate, getMimeIcon } from '../utils/formatters.js'
import ShareDialog from './ShareDialog.jsx'
import VersionHistory from './VersionHistory.jsx'
import { Button } from './ui/button.jsx'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from './ui/table.jsx'

/**
 * File listing table for active files or trash.
 * @param {{ files?: Array<any>, mode?: 'files' | 'trash', isLoading?: boolean }} props
 * @returns {import('react').JSX.Element}
 */
function FileList({ files = [], mode = 'files', isLoading = false }) {
	const softDeleteMutation = useSoftDelete()
	const restoreMutation = useRestore()
	const permanentDeleteMutation = usePermanentDelete()

	const onDownload = async (file) => {
		try {
			const response = await api.get(`/files/${file._id}/download`)
			window.open(response.data.url, '_blank', 'noopener,noreferrer')
		} catch (error) {
			toast.error('Unable to generate download link')
		}
	}

	const onSoftDelete = async (file) => {
		const confirmed = window.confirm(`Move ${file.originalName} to trash?`)

		if (!confirmed) {
			return
		}

		try {
			await softDeleteMutation.mutateAsync(file._id)
			toast.success('File moved to trash')
		} catch (error) {
			toast.error(error?.response?.data?.error || 'Failed to move file to trash')
		}
	}

	const onRestore = async (file) => {
		try {
			await restoreMutation.mutateAsync(file._id)
			toast.success('File restored')
		} catch (error) {
			toast.error(error?.response?.data?.error || 'Failed to restore file')
		}
	}

	const onPermanentDelete = async (file) => {
		const confirmed = window.confirm(`Permanently delete ${file.originalName}? This cannot be undone.`)

		if (!confirmed) {
			return
		}

		try {
			await permanentDeleteMutation.mutateAsync(file._id)
			toast.success('File permanently deleted')
		} catch (error) {
			toast.error(error?.response?.data?.error || 'Failed to permanently delete file')
		}
	}

	if (isLoading) {
		return (
			<div className="space-y-2" aria-label="files-loading">
				<div className="h-12 animate-pulse rounded-lg bg-slate-200" />
				<div className="h-12 animate-pulse rounded-lg bg-slate-200" />
				<div className="h-12 animate-pulse rounded-lg bg-slate-200" />
			</div>
		)
	}

	if (!files.length) {
		return (
			<div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
				<Inbox className="mb-3 size-10 text-slate-400" aria-hidden="true" />
				<p className="text-sm font-medium text-slate-700">No files here</p>
			</div>
		)
	}

	return (
		<div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
			<Table>
				<TableHeader>
					<TableRow className="bg-slate-50">
						<TableHead>Type</TableHead>
						<TableHead>Name</TableHead>
						<TableHead>Size</TableHead>
						<TableHead>Date</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{files.map((file) => {
						const Icon = getMimeIcon(file.mimeType)

						return (
							<TableRow key={file._id} className="hover:bg-slate-50/80">
								<TableCell>
									<Icon className="size-4 text-blue-600" aria-hidden="true" />
								</TableCell>
								<TableCell className="max-w-70 truncate">{file.originalName}</TableCell>
								<TableCell>{formatBytes(file.size)}</TableCell>
								<TableCell>{formatDate(file.createdAt)}</TableCell>
								<TableCell className="text-right">
									{mode === 'files' ? (
										<div className="flex justify-end gap-2">
											<ShareDialog fileId={file._id} />
											<VersionHistory fileId={file._id} />
											<Button variant="outline" size="sm" className="border-slate-300" onClick={() => onDownload(file)}>
												<Download className="mr-1 size-4" />
												Download
											</Button>
											<Button variant="destructive" size="sm" onClick={() => onSoftDelete(file)}>
												<Trash2 className="mr-1 size-4" />
												Delete
											</Button>
										</div>
									) : (
										<div className="flex justify-end gap-2">
											<Button variant="outline" size="sm" className="border-slate-300" onClick={() => onRestore(file)}>
												<RotateCcw className="mr-1 size-4" />
												Restore
											</Button>
											<Button variant="destructive" size="sm" onClick={() => onPermanentDelete(file)}>
												<Trash2 className="mr-1 size-4" />
												Permanent Delete
											</Button>
										</div>
									)}
								</TableCell>
							</TableRow>
						)
					})}
				</TableBody>
			</Table>
		</div>
	)
}

export default FileList

