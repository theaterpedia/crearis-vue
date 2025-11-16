import { ref, watch, onMounted, type Ref, type ComputedRef, unref } from 'vue'
import { decode } from 'blurhash'

export interface UseBlurHashOptions {
    hash: string | Ref<string> | ComputedRef<string> | null | undefined
    width?: number
    height?: number
    punch?: number  // Controls contrast (default: 1)
}

/**
 * Decode and render a BlurHash string to a canvas element
 * 
 * @param options - BlurHash decode options
 * @returns canvasRef and isDecoded state
 */
export function useBlurHash(options: UseBlurHashOptions) {
    const canvasRef = ref<HTMLCanvasElement | null>(null)
    const isDecoded = ref(false)

    const decodeHash = () => {
        const hashValue = unref(options.hash)
        if (!hashValue || !canvasRef.value) return

        const canvas = canvasRef.value
        const width = options.width || 32
        const height = options.height || 32
        const punch = options.punch || 1

        try {
            // Decode BlurHash into pixel array
            const pixels = decode(hashValue, width, height, punch)

            // Draw to canvas
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            if (!ctx) return

            const imageData = ctx.createImageData(width, height)
            imageData.data.set(pixels)
            ctx.putImageData(imageData, 0, 0)

            isDecoded.value = true
        } catch (error) {
            console.error('[BlurHash] Decode error:', error)
            isDecoded.value = false
        }
    }

    // Decode when canvas ref is available or hash changes
    watch([canvasRef, () => unref(options.hash)], () => {
        if (canvasRef.value && unref(options.hash)) {
            decodeHash()
        }
    })

    onMounted(() => {
        if (canvasRef.value && unref(options.hash)) {
            decodeHash()
        }
    })

    return {
        canvasRef,
        isDecoded
    }
}
