import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const uploadMutateAsyncMock = vi.hoisted(() => vi.fn())
const softDeleteMutateAsyncMock = vi.hoisted(() => vi.fn())
const restoreMutateAsyncMock = vi.hoisted(() => vi.fn())
const permanentDeleteMutateAsyncMock = vi.hoisted(() => vi.fn())
const apiGetMock = vi.hoisted(() => vi.fn())

vi.mock('../../hooks/useFiles.js', () => ({
	useUpload: () => ({ mutateAsync: uploadMutateAsyncMock }),
	useSoftDelete: () => ({ mutateAsync: softDeleteMutateAsyncMock }),
	useRestore: () => ({ mutateAsync: restoreMutateAsyncMock }),
	usePermanentDelete: () => ({ mutateAsync: permanentDeleteMutateAsyncMock }),
}))

vi.mock('../../lib/axios.js', () => ({
	default: {
		get: apiGetMock,
	},
}))

vi.mock('sonner', () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}))

import DropZone from '../DropZone.jsx'
import FileList from '../FileList.jsx'

function renderWithQueryClient(ui) {
	const queryClient = new QueryClient()
	return render(
		<QueryClientProvider client={queryClient}>
			{ui}
		</QueryClientProvider>
	)
}

describe('DropZone', () => {
	beforeEach(() => {
		uploadMutateAsyncMock.mockReset()
		uploadMutateAsyncMock.mockResolvedValue({})
	})

	it('renders idle dropzone message', () => {
		renderWithQueryClient(<DropZone />)

		expect(screen.getByText('Drop files here or click to browse')).toBeInTheDocument()
	})

	it('uploads selected files through mutation', async () => {
		const user = userEvent.setup()
		renderWithQueryClient(<DropZone />)

		const fileInput = document.querySelector('input[type="file"]')
		const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })

		await user.upload(fileInput, file)

		await waitFor(() => {
			expect(uploadMutateAsyncMock).toHaveBeenCalledTimes(1)
		})
	})
})

describe('FileList', () => {
	beforeEach(() => {
		apiGetMock.mockReset()
		softDeleteMutateAsyncMock.mockReset()
		restoreMutateAsyncMock.mockReset()
		permanentDeleteMutateAsyncMock.mockReset()

		apiGetMock.mockResolvedValue({ data: { url: 'https://example.com/download' } })
		softDeleteMutateAsyncMock.mockResolvedValue({})
		restoreMutateAsyncMock.mockResolvedValue({})
		permanentDeleteMutateAsyncMock.mockResolvedValue({})

		vi.spyOn(window, 'confirm').mockReturnValue(true)
		vi.spyOn(window, 'open').mockImplementation(() => null)
	})

	it('renders loading skeleton state', () => {
		renderWithQueryClient(<FileList files={[]} mode="files" isLoading />)

		expect(screen.getByLabelText('files-loading')).toBeInTheDocument()
	})

	it('renders empty state', () => {
		renderWithQueryClient(<FileList files={[]} mode="files" isLoading={false} />)

		expect(screen.getByText('No files here')).toBeInTheDocument()
	})

	it('downloads and soft deletes file in files mode', async () => {
		const user = userEvent.setup()
		const files = [
			{
				_id: 'f1',
				originalName: 'report.pdf',
				mimeType: 'application/pdf',
				size: 2048,
				createdAt: '2026-03-15T10:00:00.000Z',
			},
		]

		renderWithQueryClient(<FileList files={files} mode="files" isLoading={false} />)

		await user.click(screen.getByRole('button', { name: /download/i }))
		await waitFor(() => {
			expect(apiGetMock).toHaveBeenCalledWith('/files/f1/download')
			expect(window.open).toHaveBeenCalled()
		})

		await user.click(screen.getByRole('button', { name: /^delete$/i }))
		await waitFor(() => {
			expect(softDeleteMutateAsyncMock).toHaveBeenCalledWith('f1')
		})
	})

	it('restores and permanently deletes file in trash mode', async () => {
		const user = userEvent.setup()
		const files = [
			{
				_id: 't1',
				originalName: 'trashed.zip',
				mimeType: 'application/zip',
				size: 1024,
				createdAt: '2026-03-15T10:00:00.000Z',
			},
		]

		renderWithQueryClient(<FileList files={files} mode="trash" isLoading={false} />)

		await user.click(screen.getByRole('button', { name: /restore/i }))
		await waitFor(() => {
			expect(restoreMutateAsyncMock).toHaveBeenCalledWith('t1')
		})

		await user.click(screen.getByRole('button', { name: /permanent delete/i }))
		await waitFor(() => {
			expect(permanentDeleteMutateAsyncMock).toHaveBeenCalledWith('t1')
		})
	})
})

