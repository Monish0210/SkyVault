import React from 'react'
import { UploadCloud } from 'lucide-react'
import { toast } from 'sonner'
import { Progress } from './ui/progress.jsx'
import { useUpload } from '../hooks/useFiles.js'

/**
 * Drag-and-drop file upload area.
 * @returns {import('react').JSX.Element}
 */
function DropZone() {
	const inputRef = React.useRef(null)
	const [isDragging, setIsDragging] = React.useState(false)
	const [isUploading, setIsUploading] = React.useState(false)
	const [progressValue, setProgressValue] = React.useState(0)
	const uploadMutation = useUpload()

	const uploadFiles = async (files) => {
		if (!files || files.length === 0) {
			return
		}

		setIsUploading(true)
		setProgressValue(10)

		for (let index = 0; index < files.length; index += 1) {
			const file = files[index]
			const formData = new FormData()
			formData.append('file', file)

			try {
				await uploadMutation.mutateAsync(formData)
				toast.success(`${file.name} uploaded successfully`)
			} catch (error) {
				const message = error?.response?.data?.error || `Failed to upload ${file.name}`
				toast.error(message)
			}

			const completedPercent = Math.round(((index + 1) / files.length) * 100)
			setProgressValue(completedPercent)
		}

		setTimeout(() => {
			setIsUploading(false)
			setProgressValue(0)
		}, 250)
	}

	const onDrop = async (event) => {
		event.preventDefault()
		setIsDragging(false)
		await uploadFiles(Array.from(event.dataTransfer.files || []))
	}

	const onFileInputChange = async (event) => {
		await uploadFiles(Array.from(event.target.files || []))
		event.target.value = ''
	}

	const stateClassName = isDragging
		? 'border-blue-500 bg-blue-50 shadow-sm'
		: 'border-slate-300 bg-white hover:border-blue-300'

	return (
		<section
			role="button"
			tabIndex={0}
			className={`rounded-xl border-2 border-dashed p-8 text-center transition-all ${stateClassName}`}
			onDragOver={(event) => {
				event.preventDefault()
				setIsDragging(true)
			}}
			onDragLeave={() => setIsDragging(false)}
			onDrop={onDrop}
			onClick={() => inputRef.current?.click()}
			onKeyDown={(event) => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault()
					inputRef.current?.click()
				}
			}}
			aria-label="File upload dropzone"
		>
			<input
				ref={inputRef}
				type="file"
				className="hidden"
				onChange={onFileInputChange}
				multiple
			/>

			{!isUploading ? (
				<div className="mx-auto flex max-w-sm flex-col items-center gap-3">
					<div className="rounded-full bg-blue-100 p-3">
						<UploadCloud className="size-8 text-blue-600" aria-hidden="true" />
					</div>
					<p className="text-sm font-semibold text-slate-800">Drop files here or click to browse</p>
					<p className="text-xs text-slate-500">Uploads are encrypted and linked to your account</p>
				</div>
			) : (
				<div className="mx-auto max-w-sm space-y-3">
					<p className="text-sm font-medium text-slate-700">Uploading files...</p>
					<Progress value={progressValue} className="h-2" />
				</div>
			)}
		</section>
	)
}

export default DropZone

