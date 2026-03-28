import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const postMock = vi.hoisted(() => vi.fn())
const navigateMock = vi.hoisted(() => vi.fn())
const loginMock = vi.hoisted(() => vi.fn())

vi.mock('../../lib/axios.js', () => ({
	default: {
		post: postMock,
	},
}))

vi.mock('../../context/AuthContext.jsx', () => ({
	useAuth: () => ({
		login: loginMock,
		user: null,
		token: null,
		logout: vi.fn(),
	}),
}))

vi.mock('react-router-dom', async () => {
	const actual = await vi.importActual('react-router-dom')
	return {
		...actual,
		useNavigate: () => navigateMock,
	}
})

import RegisterPage from '../RegisterPage.jsx'
import LoginPage from '../LoginPage.jsx'

describe('RegisterPage', () => {
	beforeEach(() => {
		postMock.mockReset()
		navigateMock.mockReset()
		loginMock.mockReset()
	})

	it('renders all register form fields', () => {
		render(
			<MemoryRouter>
				<RegisterPage />
			</MemoryRouter>
		)

		expect(screen.getByLabelText('Email')).toBeInTheDocument()
		expect(screen.getByLabelText('Password')).toBeInTheDocument()
		expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
	})

	it('skips API call when passwords mismatch', async () => {
		const user = userEvent.setup()

		render(
			<MemoryRouter>
				<RegisterPage />
			</MemoryRouter>
		)

		await user.type(screen.getByLabelText('Email'), 'user@example.com')
		await user.type(screen.getByLabelText('Password'), 'password123')
		await user.type(screen.getByLabelText('Confirm Password'), 'password124')
		await user.click(screen.getByRole('button', { name: 'Create Account' }))

		expect(postMock).not.toHaveBeenCalled()
		expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
	})

	it('submits register with correct payload', async () => {
		const user = userEvent.setup()
		postMock.mockResolvedValueOnce({
			data: {
				token: 'token-123',
				user: { userId: 'abc123', email: 'user@example.com' },
			},
		})

		render(
			<MemoryRouter>
				<RegisterPage />
			</MemoryRouter>
		)

		await user.type(screen.getByLabelText('Email'), 'user@example.com')
		await user.type(screen.getByLabelText('Password'), 'password123')
		await user.type(screen.getByLabelText('Confirm Password'), 'password123')
		await user.click(screen.getByRole('button', { name: 'Create Account' }))

		await waitFor(() => {
			expect(postMock).toHaveBeenCalledWith('/auth/register', {
				email: 'user@example.com',
				password: 'password123',
			})
		})

		expect(loginMock).toHaveBeenCalledWith('token-123', {
			userId: 'abc123',
			email: 'user@example.com',
		})
		expect(navigateMock).toHaveBeenCalledWith('/dashboard')
	})

	it('shows destructive alert on API error', async () => {
		const user = userEvent.setup()
		postMock.mockRejectedValueOnce({
			response: {
				data: {
					error: 'Email already registered',
				},
			},
		})

		render(
			<MemoryRouter>
				<RegisterPage />
			</MemoryRouter>
		)

		await user.type(screen.getByLabelText('Email'), 'user@example.com')
		await user.type(screen.getByLabelText('Password'), 'password123')
		await user.type(screen.getByLabelText('Confirm Password'), 'password123')
		await user.click(screen.getByRole('button', { name: 'Create Account' }))

		expect(await screen.findByText('Email already registered')).toBeInTheDocument()
		expect(screen.getByRole('alert')).toBeInTheDocument()
	})
})

describe('LoginPage', () => {
	beforeEach(() => {
		postMock.mockReset()
		navigateMock.mockReset()
		loginMock.mockReset()
	})

	it('renders login fields', () => {
		render(
			<MemoryRouter>
				<LoginPage />
			</MemoryRouter>
		)

		expect(screen.getByLabelText('Email')).toBeInTheDocument()
		expect(screen.getByLabelText('Password')).toBeInTheDocument()
	})

	it('calls /auth/login and navigates on success', async () => {
		const user = userEvent.setup()
		postMock.mockResolvedValueOnce({
			data: {
				token: 'login-token',
				user: { userId: 'u1', email: 'login@example.com' },
			},
		})

		render(
			<MemoryRouter>
				<LoginPage />
			</MemoryRouter>
		)

		await user.type(screen.getByLabelText('Email'), 'login@example.com')
		await user.type(screen.getByLabelText('Password'), 'password123')
		await user.click(screen.getByRole('button', { name: 'Sign In' }))

		await waitFor(() => {
			expect(postMock).toHaveBeenCalledWith('/auth/login', {
				email: 'login@example.com',
				password: 'password123',
			})
		})

		expect(loginMock).toHaveBeenCalledWith('login-token', {
			userId: 'u1',
			email: 'login@example.com',
		})
		expect(navigateMock).toHaveBeenCalledWith('/dashboard')
	})
})

