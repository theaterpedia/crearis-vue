/**
 * POST /api/validate/email
 * Dummy email validation endpoint
 * 
 * First attempt: waits 30s, returns false with reason
 * Second attempt: waits 30s, returns true
 */

// Simple in-memory store for tracking validation attempts
const validationAttempts = new Map<string, number>()

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { email } = body

    if (!email) {
        throw createError({
            statusCode: 400,
            message: 'Email is required',
        })
    }

    // Get attempt count for this email
    const attemptCount = validationAttempts.get(email) || 0
    validationAttempts.set(email, attemptCount + 1)

    // Simulate async validation with 30 second delay
    await new Promise(resolve => setTimeout(resolve, 30000))

    // First attempt fails, second succeeds
    if (attemptCount === 0) {
        return {
            valid: false,
            reason: 'testing',
            message: 'Email validation failed (first attempt - testing mode)',
        }
    } else {
        // Reset counter after successful validation
        validationAttempts.delete(email)

        return {
            valid: true,
            message: 'Email validation successful',
        }
    }
})
