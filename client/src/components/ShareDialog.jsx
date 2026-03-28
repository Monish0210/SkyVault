import React from 'react'
import { Share2 } from 'lucide-react'
import { toast } from 'sonner'
import api from '../lib/axios.js'
import { Alert, AlertDescription, AlertTitle } from './ui/alert.jsx'
import { Button } from './ui/button.jsx'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from './ui/dialog.jsx'
import { Input } from './ui/input.jsx'

/**
 * Generates and displays a one-hour expiring share URL.
 * @param {{ fileId: string }} props
 * @returns {import('react').JSX.Element}
 */
function ShareDialog({ fileId }) {
	const [isOpen, setIsOpen] = React.useState(false)
	const [isLoading, setIsLoading] = React.useState(false)
	const [shareUrl, setShareUrl] = React.useState('')

	React.useEffect(() => {
		if (!isOpen) {
			return
		}

		let active = true

		const generateShareLink = async () => {
			setIsLoading(true)

			try {
				const response = await api.post(`/files/${fileId}/share`)
				if (active) {
					setShareUrl(response.data.shareUrl || '')
				}
			} catch (error) {
				toast.error(error?.response?.data?.error || 'Failed to generate share link')
			} finally {
				if (active) {
					setIsLoading(false)
				}
			}
		}

		generateShareLink()

		return () => {
			active = false
		}
	}, [isOpen, fileId])

	const onCopyLink = async () => {
		if (!shareUrl) {
			return
		}

		try {
			await navigator.clipboard.writeText(shareUrl)
			toast.success('Copied!')
		} catch (error) {
			toast.error('Failed to copy link')
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm" aria-label="Share file">
					<Share2 className="mr-1 size-4" />
					Share
				</Button>
			</DialogTrigger>

			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Share File</DialogTitle>
					<DialogDescription>Generate a secure temporary link for this file.</DialogDescription>
				</DialogHeader>

				<Alert>
					<AlertTitle>Note</AlertTitle>
					<AlertDescription>Anyone with this link can download the file</AlertDescription>
				</Alert>

				<div className="space-y-2">
					<Input value={isLoading ? 'Generating share URL...' : shareUrl} readOnly aria-label="Share URL" />
					<p className="text-xs text-slate-600">Expires in 1 hour</p>
				</div>

				<Button type="button" onClick={onCopyLink} disabled={isLoading || !shareUrl}>
					Copy Link
				</Button>
			</DialogContent>
		</Dialog>
	)
}

export default ShareDialog

