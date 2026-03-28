import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/axios.js'

/**
 * Fetches active files list.
 * @returns {import('@tanstack/react-query').UseQueryResult<unknown[], Error>}
 */
export function useFilesList() {
	return useQuery({
		queryKey: ['files'],
		queryFn: () => api.get('/files').then((response) => response.data),
	})
}

/**
 * Fetches trash files list.
 * @returns {import('@tanstack/react-query').UseQueryResult<unknown[], Error>}
 */
export function useTrashList() {
	return useQuery({
		queryKey: ['trash'],
		queryFn: () => api.get('/files/trash').then((response) => response.data),
	})
}

/**
 * Fetches authenticated user storage information.
 * @returns {import('@tanstack/react-query').UseQueryResult<unknown, Error>}
 */
export function useStorageInfo() {
	return useQuery({
		queryKey: ['me'],
		queryFn: () => api.get('/users/me').then((response) => response.data),
	})
}

/**
 * Upload mutation for files.
 * @returns {import('@tanstack/react-query').UseMutationResult<unknown, Error, FormData>}
 */
export function useUpload() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (formData) => api.post('/files/upload', formData),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['files'] })
			queryClient.invalidateQueries({ queryKey: ['me'] })
		},
	})
}

/**
 * Soft delete mutation.
 * @returns {import('@tanstack/react-query').UseMutationResult<unknown, Error, string>}
 */
export function useSoftDelete() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (id) => api.delete(`/files/${id}`),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['files'] })
			queryClient.invalidateQueries({ queryKey: ['trash'] })
			queryClient.invalidateQueries({ queryKey: ['me'] })
		},
	})
}

/**
 * Restore mutation.
 * @returns {import('@tanstack/react-query').UseMutationResult<unknown, Error, string>}
 */
export function useRestore() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (id) => api.post(`/files/${id}/restore`),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['files'] })
			queryClient.invalidateQueries({ queryKey: ['trash'] })
			queryClient.invalidateQueries({ queryKey: ['me'] })
		},
	})
}

/**
 * Permanent delete mutation.
 * @returns {import('@tanstack/react-query').UseMutationResult<unknown, Error, string>}
 */
export function usePermanentDelete() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (id) => api.delete(`/files/${id}/permanent`),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['trash'] })
		},
	})
}

