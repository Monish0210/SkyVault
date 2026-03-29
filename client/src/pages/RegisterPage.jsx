import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import api from '../lib/axios.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert.jsx'
import { Button } from '../components/ui/button.jsx'
import { Input } from '../components/ui/input.jsx'
import BlueBubblesBackground from '../components/BlueBubblesBackground.jsx'

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
		<main className="relative min-h-screen overflow-hidden bg-slate-50 px-3 py-3 lg:px-5 lg:py-5">
			<BlueBubblesBackground />
			<div className="relative mx-auto grid h-[calc(100dvh-1.5rem)] w-full max-w-350 overflow-hidden rounded-[30px] border border-white/55 bg-white/20 shadow-[0_24px_90px_-30px_rgba(37,99,235,0.45)] ring-1 ring-white/45 backdrop-blur-xl xl:grid-cols-2">
				<section className="hidden bg-blue-700/85 p-12 text-white backdrop-blur-md xl:flex xl:flex-col xl:justify-between">
					<div>
						<p className="text-base font-semibold tracking-wide text-blue-100">SkyVault</p>
						<h1 className="mt-6 text-5xl font-semibold leading-tight">Create your secure file workspace</h1>
						<p className="mt-5 max-w-md text-lg text-blue-100">
							Start with instant uploads, version history, and one-click sharing for your files.
						</p>
					</div>
					<div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/40 bg-white/10 px-3 py-1.5 text-sm">
						<ShieldCheck className="size-3.5" />
						Zero setup in dashboard
					</div>
				</section>

				<section className="flex items-center justify-center overflow-y-auto p-4 sm:p-8 xl:p-12">
					<div className="w-full max-w-160 rounded-3xl border border-white/70 bg-white/58 p-6 shadow-[0_12px_50px_-28px_rgba(15,23,42,0.5)] ring-1 ring-white/65 backdrop-blur-xl sm:p-8">
						<h1 className="text-center text-3xl font-semibold text-slate-900">Create your account</h1>

						<form className="mt-7 space-y-5" onSubmit={handleSubmit}>
							<div className="space-y-2">
								<label htmlFor="register-email" className="block text-sm font-medium text-slate-700">
									Email
								</label>
								<Input
									id="register-email"
									type="email"
									value={email}
									onChange={(event) => setEmail(event.target.value)}
									placeholder="you@example.com"
									required
									className="h-11 border-slate-300/85 bg-white/70 px-3"
								/>
							</div>

							<div className="space-y-2">
								<label htmlFor="register-password" className="block text-sm font-medium text-slate-700">
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
										className="h-11 border-slate-300/85 bg-white/70 pr-12 pl-3"
									/>
									<button
										type="button"
										className="absolute inset-y-0 right-3 my-auto flex h-6 w-6 items-center justify-center text-slate-500"
										onClick={() => setShowPassword((value) => !value)}
										aria-label={showPassword ? 'Hide password' : 'Show password'}
									>
										{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
									</button>
								</div>
							</div>

							<div className="space-y-2">
								<label htmlFor="register-confirm-password" className="block text-sm font-medium text-slate-700">
									Confirm Password
								</label>
								<Input
									id="register-confirm-password"
									type={showPassword ? 'text' : 'password'}
									value={confirmPassword}
									onChange={(event) => setConfirmPassword(event.target.value)}
									placeholder="Re-enter your password"
									required
									className="h-11 border-slate-300/85 bg-white/70 px-3"
								/>
							</div>

							{error ? (
								<Alert variant="destructive">
									<AlertTitle>Authentication Error</AlertTitle>
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							) : null}

							<Button type="submit" className="h-11 w-full bg-blue-600 text-white hover:bg-blue-700" disabled={isLoading}>
								{isLoading ? 'Creating account...' : 'Create Account'}
							</Button>
						</form>

						<p className="mt-5 text-center text-sm text-slate-600">
							Already have an account?{' '}
							<Link to="/login" className="font-medium text-blue-700 underline underline-offset-4">
								Sign in
							</Link>
						</p>
					</div>
				</section>
			</div>
		</main>
	)
}

export default RegisterPage

