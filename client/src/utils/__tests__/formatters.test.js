import { Archive, File, FileText, Film, ImageIcon, Music } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { formatBytes, formatDate, getMimeIcon } from '../formatters.js'

describe('formatBytes', () => {
	it('formats zero bytes', () => {
		expect(formatBytes(0)).toBe('0 B')
	})

	it('formats kilobytes', () => {
		expect(formatBytes(4300)).toBe('4.2 KB')
	})

	it('formats megabytes', () => {
		expect(formatBytes(4.2 * 1024 * 1024)).toBe('4.2 MB')
	})

	it('formats gigabytes', () => {
		expect(formatBytes(1.1 * 1024 * 1024 * 1024)).toBe('1.1 GB')
	})
})

describe('formatDate', () => {
	it('formats ISO date as DD Mon YYYY', () => {
		expect(formatDate('2026-03-15T10:00:00.000Z')).toBe('15 Mar 2026')
	})
})

describe('getMimeIcon', () => {
	it('returns image icon for image mime', () => {
		expect(getMimeIcon('image/png')).toBe(ImageIcon)
	})

	it('returns film icon for video mime', () => {
		expect(getMimeIcon('video/mp4')).toBe(Film)
	})

	it('returns music icon for audio mime', () => {
		expect(getMimeIcon('audio/mpeg')).toBe(Music)
	})

	it('returns file text icon for text-like mime', () => {
		expect(getMimeIcon('text/plain')).toBe(FileText)
	})

	it('returns archive icon for archive mime', () => {
		expect(getMimeIcon('application/zip')).toBe(Archive)
	})

	it('returns generic file icon for unknown mime', () => {
		expect(getMimeIcon('application/octet-stream')).toBe(File)
	})
})

