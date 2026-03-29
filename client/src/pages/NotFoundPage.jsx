import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button.jsx'

/**
 * Fallback page placeholder for unknown routes.
 * @returns {import('react').JSX.Element}
 */
function NotFoundPage() {
	const navigate = useNavigate()

	return (
		<main className="bg-slate-50 min-h-screen flex items-center justify-center px-4">
			<section className="text-center">
				<p className="text-8xl font-bold text-slate-200">404</p>
				<h1 className="mt-3 text-2xl text-slate-600">Page not found</h1>
				<div className="mt-6">
					<Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => navigate('/')}>Go Home</Button>
				</div>
			</section>
		</main>
	)
}

export default NotFoundPage

