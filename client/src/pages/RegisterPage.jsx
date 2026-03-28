import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import api from '../lib/axios.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert.jsx'
import { Button } from '../components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx'
import { Input } from '../components/ui/input.jsx'

/**
 * Register page placeholder for Phase 1 shell.
 * @returns {import('react').JSX.Element}
 */
function RegisterPage() {
	const navigate = useNavigate()
	const { login } = useAuth()

	const [email, setEmail] = React.useState('')
	const [password, setPassword] = React.useState('')
	const [confirmPassword, setConfirmPassword] = React.useState('')
	const [showPassword, setShowPassword] = React.useState(false)
	const [isLoading, setIsLoading] = React.useState(false)
	const [error, setError] = React.useState('')

	const handleSubmit = async (event) => {
		event.preventDefault()
		setError('')

		if (!email.trim()) {
			setError('Email is required')
			return
		}

		if (password.length < 8) {
			setError('Password must be at least 8 characters long')
			return
		}

		if (password !== confirmPassword) {
			setError('Passwords do not match')
			return
		}

		setIsLoading(true)

		try {
			const response = await api.post('/auth/register', {
				email,
				password,
			})

			login(response.data.token, response.data.user)
			navigate('/dashboard')
		} catch (apiError) {
			setError(apiError?.response?.data?.error || 'Registration failed. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-10">
			<Card className="w-full max-w-md bg-slate-800 text-slate-100 ring-slate-700">
				<CardHeader>
					<CardTitle className="text-center text-2xl text-white">Create your account</CardTitle>
				</CardHeader>
				<CardContent>
					<form className="space-y-4" onSubmit={handleSubmit}>
						<div className="space-y-2">
							<label htmlFor="register-email" className="block text-sm font-medium text-slate-200">
								Email
							</label>
							<Input
								id="register-email"
								type="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								placeholder="you@example.com"
								required
							/>
						</div>

						<div className="space-y-2">
							<label htmlFor="register-password" className="block text-sm font-medium text-slate-200">
								Password
							</label>
							<div className="relative">
								<Input
									id="register-password"
									type={showPassword ? 'text' : 'password'}
									value={password}
									onChange={(event) => setPassword(event.target.value)}
									placeholder="Minimum 8 characters"
									required
								/>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="absolute top-0 right-0 h-8 w-8"
									onClick={() => setShowPassword((value) => !value)}
									aria-label={showPassword ? 'Hide password' : 'Show password'}
								>
									{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
								</Button>
							</div>
						</div>

						<div className="space-y-2">
							<label htmlFor="register-confirm-password" className="block text-sm font-medium text-slate-200">
								Confirm Password
							</label>
							<div className="relative">
								<Input
									id="register-confirm-password"
									type={showPassword ? 'text' : 'password'}
									value={confirmPassword}
									onChange={(event) => setConfirmPassword(event.target.value)}
									placeholder="Re-enter your password"
									required
								/>
							</div>
						</div>

						{error ? (
							<Alert variant="destructive">
								<AlertTitle>Authentication Error</AlertTitle>
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						) : null}

						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? 'Creating account...' : 'Create Account'}
						</Button>
					</form>

					<p className="mt-4 text-center text-sm text-slate-300">
						Already have an account?{' '}
						<Link to="/login" className="font-medium text-slate-100 underline underline-offset-4">
							Sign in
						</Link>
					</p>
				</CardContent>
			</Card>
		</main>
	)
}

export default RegisterPage

