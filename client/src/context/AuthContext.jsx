import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext({
	user: null,
	token: null,
	login: () => {},
	logout: () => {},
})

/**
 * Provides authentication state and actions to the app tree.
 * @param {{ children: import('react').ReactNode }} props
 * @returns {import('react').JSX.Element}
 */
function AuthProvider({ children }) {
	const [user, setUser] = useState(null)
	const [token, setToken] = useState(null)

	useEffect(() => {
		const storedToken = localStorage.getItem('token')
		const storedUser = localStorage.getItem('user')

		setToken(storedToken)

		if (storedUser) {
			try {
				setUser(JSON.parse(storedUser))
			} catch {
				setUser(null)
			}
		}
	}, [])

	const login = (nextToken, nextUser) => {
		localStorage.setItem('token', nextToken)
		localStorage.setItem('user', JSON.stringify(nextUser))
		setToken(nextToken)
		setUser(nextUser)
	}

	const logout = () => {
		localStorage.removeItem('token')
		localStorage.removeItem('user')
		setToken(null)
		setUser(null)
	}

	const value = useMemo(
		() => ({
			user,
			token,
			login,
			logout,
		}),
		[user, token]
	)

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Returns auth state and actions from context.
 * @returns {{ user: unknown, token: string | null, login: (token: string, user: unknown) => void, logout: () => void }}
 */
export function useAuth() {
	return useContext(AuthContext)
}

export default AuthProvider

