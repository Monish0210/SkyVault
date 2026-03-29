import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const navigateMock = vi.hoisted(() => vi.fn())
const logoutMock = vi.hoisted(() => vi.fn())
const useFilesListMock = vi.hoisted(() => vi.fn())
const useTrashListMock = vi.hoisted(() => vi.fn())
const useStorageInfoMock = vi.hoisted(() => vi.fn())

vi.mock('../../hooks/useFiles.js', () => ({
	useFilesList: useFilesListMock,
	useTrashList: useTrashListMock,
	useStorageInfo: useStorageInfoMock,
}))

vi.mock('../../context/AuthContext.jsx', () => ({
	useAuth: () => ({
		user: { email: 'user@example.com' },
		logout: logoutMock,
	}),
}))

vi.mock('../../components/DropZone.jsx', () => ({
	default: () => <div data-testid="dropzone-mock" />,
}))

vi.mock('../../components/FileList.jsx', () => ({
	default: () => <div data-testid="filelist-mock" />,
}))

vi.mock('react-router-dom', async () => {
	const actual = await vi.importActual('react-router-dom')
	return {
		...actual,
		useNavigate: () => navigateMock,
	}
})

import DashboardPage from '../DashboardPage.jsx'

function renderDashboard() {
	const queryClient = new QueryClient()
	return render(
		<QueryClientProvider client={queryClient}>
			<MemoryRouter>
				<DashboardPage />
			</MemoryRouter>
		</QueryClientProvider>
	)
}

describe('DashboardPage', () => {
	beforeEach(() => {
		navigateMock.mockReset()
		logoutMock.mockReset()

		useFilesListMock.mockReturnValue({
			data: [],
			isLoading: false,
		})

		useTrashListMock.mockReturnValue({
			data: [],
			isLoading: false,
		})

		useStorageInfoMock.mockReturnValue({
			data: {
				email: 'user@example.com',
				storageUsed: 100,
				storageLimit: 1000,
				storagePercent: 10,
			},
			isLoading: false,
		})
	})

	it('renders storage warning alert when storagePercent > 95', () => {
		useStorageInfoMock.mockReturnValue({
			data: {
				email: 'user@example.com',
				storageUsed: 960,
				storageLimit: 1000,
				storagePercent: 96,
			},
			isLoading: false,
		})

		renderDashboard()

		expect(screen.getByText('Storage almost full')).toBeInTheDocument()
	})

	it('logout button calls logout and navigates to /login', async () => {
		const user = userEvent.setup()
		renderDashboard()

		await user.click(screen.getByRole('button', { name: 'Logout' }))

		expect(logoutMock).toHaveBeenCalledTimes(1)
		expect(navigateMock).toHaveBeenCalledWith('/login')
	})
})

