import React from 'react'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const useAuthMock = vi.hoisted(() => vi.fn())

vi.mock('./context/AuthContext.jsx', () => ({
	__esModule: true,
	default: ({ children }) => children,
	useAuth: useAuthMock,
}))

vi.mock('./pages/LandingPage.jsx', () => ({
	__esModule: true,
	default: () => <div>Landing Page</div>,
}))

vi.mock('./pages/LoginPage.jsx', () => ({
	__esModule: true,
	default: () => <div>Login Page</div>,
}))

vi.mock('./pages/RegisterPage.jsx', () => ({
	__esModule: true,
	default: () => <div>Register Page</div>,
}))

vi.mock('./pages/DashboardPage.jsx', () => ({
	__esModule: true,
	default: () => <div>Dashboard Page</div>,
}))

vi.mock('./pages/NotFoundPage.jsx', () => ({
	__esModule: true,
	default: () => <div>Not Found Page</div>,
}))

import App from './App.jsx'

describe('App routing', () => {
	beforeEach(() => {
		useAuthMock.mockReset()
		useAuthMock.mockReturnValue({ token: null, user: null })
		window.localStorage.clear()
	})

	it('renders LandingPage on /', () => {
		window.history.pushState({}, '', '/')

		render(<App />)

		expect(screen.getByText('Landing Page')).toBeInTheDocument()
	})

	it('redirects /dashboard to /login without token', () => {
		window.history.pushState({}, '', '/dashboard')

		render(<App />)

		expect(screen.getByText('Login Page')).toBeInTheDocument()
	})
})

