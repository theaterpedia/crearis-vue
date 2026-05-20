/**
 * Composable: useImageFetch
 * 
 * Shared image fetching logic for components that need to load images
 * by xmlid or id from the API. Used by Hero.vue, DisplayImage.vue, DisplayBanner.vue.
 * 
 * @example
 * ```ts
 * const { imageData, isLoading, hasError, errorMessage, fetchImage } = useImageFetch()
 * 
 * // Fetch by xmlid
 * await fetchImage({ xmlid: 'tp.image.landscape-001' })
 * 
 * // Fetch by id
 * await fetchImage({ id: 42 })
 * ```
 */
import { ref, type Ref } from 'vue'

// Shape data structure returned by API
export interface ShapeData {
    url?: string
    blur?: string
    turl?: string
    tpar?: string
    x?: number
    y?: number
    z?: number
}

// Full image data structure from API
export interface ImageApiResponse {
    id: number
    xmlid: string
    url: string
    adapter: string
    alt_text: string | null
    author: {
        name: string
        uri: string | null
    } | null
    // Template shapes
    shape_vertical?: ShapeData
    shape_wide?: ShapeData
    shape_square?: ShapeData
    // Hero instances
    hero_vertical?: ShapeData
    hero_square?: ShapeData
    hero_wide?: ShapeData
    hero_wide_xl?: ShapeData
    hero_square_xl?: ShapeData
    // Display instances
    display_wide?: ShapeData
    display_thumb_banner?: ShapeData
    // Standard shapes
    img_thumb?: ShapeData
    img_square?: ShapeData
    img_wide?: ShapeData
    img_vert?: ShapeData
}

export interface FetchImageParams {
    xmlid?: string
    id?: number | string
}

export interface UseImageFetchReturn {
    imageData: Ref<ImageApiResponse | null>
    isLoading: Ref<boolean>
    hasError: Ref<boolean>
    errorMessage: Ref<string>
    fetchImage: (params: FetchImageParams) => Promise<ImageApiResponse | null>
    reset: () => void
}

/**
 * Composable for fetching image data from API
 */
export function useImageFetch(): UseImageFetchReturn {
    const imageData = ref<ImageApiResponse | null>(null)
    const isLoading = ref(false)
    const hasError = ref(false)
    const errorMessage = ref('')

    /**
     * Reset state
     */
    function reset() {
        imageData.value = null
        isLoading.value = false
        hasError.value = false
        errorMessage.value = ''
    }

    /**
     * Fetch image by xmlid or id
     */
    async function fetchImage(params: FetchImageParams): Promise<ImageApiResponse | null> {
        const { xmlid, id } = params

        // Validate params
        if (!xmlid && !id) {
            hasError.value = true
            errorMessage.value = 'No xmlid or id provided'
            isLoading.value = false
            return null
        }

        try {
            isLoading.value = true
            hasError.value = false
            errorMessage.value = ''

            // Build URL based on params
            let url: string
            if (xmlid) {
                url = `/api/images/xmlid/${encodeURIComponent(xmlid)}`
            } else {
                url = `/api/images/${id}`
            }

            const response = await fetch(url)

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(xmlid
                        ? `Image '${xmlid}' not found`
                        : `Image with id ${id} not found`)
                }
                throw new Error(`Failed to fetch image: ${response.statusText}`)
            }

            const data = await response.json()
            imageData.value = data

            return data
        } catch (error) {
            console.error('[useImageFetch] Fetch error:', error)
            hasError.value = true
            errorMessage.value = error instanceof Error ? error.message : 'Failed to load image'
            isLoading.value = false
            return null
        }
    }

    return {
        imageData,
        isLoading,
        hasError,
        errorMessage,
        fetchImage,
        reset
    }
}
