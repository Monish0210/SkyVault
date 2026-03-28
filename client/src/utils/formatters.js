import { Archive, File, FileText, Film, ImageIcon, Music } from 'lucide-react'

/**
 * Formats bytes into human-readable units.
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
	if (!bytes || bytes <= 0) {
		return '0 B'
	}

	const units = ['B', 'KB', 'MB', 'GB', 'TB']
	const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
	const value = bytes / Math.pow(1024, exponent)

	if (exponent === 0) {
		return `${Math.round(value)} ${units[exponent]}`
	}

	return `${value.toFixed(1)} ${units[exponent]}`
}

/**
 * Formats an ISO date string into a user-friendly date.
 * @param {string} isoString
 * @returns {string}
 */
export function formatDate(isoString) {
	return new Intl.DateTimeFormat('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	}).format(new Date(isoString))
}

/**
 * Returns an icon component based on mime type.
 * @param {string} mimeType
 * @returns {import('react').ComponentType<{ className?: string }>}
 */
export function getMimeIcon(mimeType) {
	if (!mimeType) {
		return File
	}

	if (mimeType.startsWith('image/')) {
		return ImageIcon
	}

	if (mimeType.startsWith('video/')) {
		return Film
	}

	if (mimeType.startsWith('audio/')) {
		return Music
	}

	if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('compressed')) {
		return Archive
	}

	if (mimeType.startsWith('text/') || mimeType.includes('pdf') || mimeType.includes('document')) {
		return FileText
	}

	return File
}

