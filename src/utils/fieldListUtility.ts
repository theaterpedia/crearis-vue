/**
 * Field List Utility
 * 
 * Provides form field definitions for the createInteraction component
 * Maps to interactions.name in the database
 */

export interface FieldChoice {
    value: string | number
    name: string
}

export interface FieldDefinition {
    name: string
    type: 'text' | 'email' | 'date' | 'select' | 'textarea' | 'checkbox' | 'number'
    subtype?: string // For custom validation/logic rules
    label: string
    description?: string
    defaultValue?: string | number | boolean
    choices?: FieldChoice[]
    required?: boolean
    placeholder?: string
}

export interface FormDefinition {
    name: string
    title: string
    description?: string
    fields: FieldDefinition[]
}

// Form definitions registry
const formRegistry: Record<string, FormDefinition> = {
    'registration': {
        name: 'registration',
        title: 'Konferenz-Anmeldung',
        description: 'Melde dich für die Konferenz vom 20.-23. November an',
        fields: [
            {
                name: 'name',
                type: 'text',
                label: 'Vor- und Nachname',
                required: true,
                placeholder: 'Max Mustermann'
            },
            {
                name: 'email',
                type: 'email',
                label: 'E-Mail',
                required: true,
                placeholder: 'name@example.com'
            },
            {
                name: 'organization',
                type: 'text',
                label: 'Organisation',
                placeholder: 'Deine Organisation'
            },
            {
                name: 'phone',
                type: 'text',
                label: 'Telefon',
                placeholder: '+49 123 456789'
            },
            {
                name: 'start_date',
                type: 'date',
                subtype: 'conference_start',
                label: 'Anreisedatum',
                description: 'Wann reist du an?',
                defaultValue: '2025-11-20',
                required: true
            },
            {
                name: 'end_date',
                type: 'date',
                subtype: 'conference_end',
                label: 'Abreisedatum',
                description: 'Wann reist du ab?',
                defaultValue: '2025-11-23',
                required: true
            },
            {
                name: 'participation_days',
                type: 'select',
                label: 'Teilnahmetage',
                description: 'An welchen Tagen nimmst du teil?',
                required: true,
                choices: [
                    { value: 'all', name: 'Alle Tage (20.-23. Nov)' },
                    { value: '20-21', name: 'Nur 20.-21. Nov' },
                    { value: '22-23', name: 'Nur 22.-23. Nov' },
                    { value: 'custom', name: 'Einzelne Tage' }
                ]
            },
            {
                name: 'workshop_preference',
                type: 'select',
                label: 'Workshop-Präferenz',
                choices: [
                    { value: 'theater', name: 'Theaterpädagogik' },
                    { value: 'digital', name: 'Digitale Methoden' },
                    { value: 'inclusive', name: 'Inklusive Theaterarbeit' },
                    { value: 'none', name: 'Keine Präferenz' }
                ]
            },
            {
                name: 'dietary_requirements',
                type: 'textarea',
                label: 'Ernährungshinweise',
                description: 'Allergien oder besondere Ernährungswünsche',
                placeholder: 'z.B. vegetarisch, vegan, glutenfrei...'
            },
            {
                name: 'comments',
                type: 'textarea',
                label: 'Bemerkungen',
                placeholder: 'Weitere Informationen oder Fragen...'
            }
        ]
    },
    'verification': {
        name: 'verification',
        title: 'Anmeldung bestätigen',
        description: 'Bitte bestätige deine Anmeldung und wähle zusätzliche Optionen',
        fields: [
            {
                name: 'name',
                type: 'text',
                label: 'Vor- und Nachname',
                required: true,
                placeholder: 'Max Mustermann'
            },
            {
                name: 'email',
                type: 'email',
                label: 'E-Mail',
                required: true,
                placeholder: 'name@example.com'
            },
            {
                name: 'organization',
                type: 'text',
                label: 'Organisation',
                placeholder: 'Deine Organisation'
            },
            {
                name: 'phone',
                type: 'text',
                label: 'Telefon',
                placeholder: '+49 123 456789'
            },
            {
                name: 'start_date',
                type: 'date',
                subtype: 'conference_start',
                label: 'Anreisedatum',
                description: 'Wann reist du an?',
                defaultValue: '2025-11-20',
                required: true
            },
            {
                name: 'end_date',
                type: 'date',
                subtype: 'conference_end',
                label: 'Abreisedatum',
                description: 'Wann reist du ab?',
                defaultValue: '2025-11-23',
                required: true
            },
            {
                name: 'participation_days',
                type: 'select',
                label: 'Teilnahmetage',
                description: 'An welchen Tagen nimmst du teil?',
                required: true,
                choices: [
                    { value: 'all', name: 'Alle Tage (20.-23. Nov)' },
                    { value: '20-21', name: 'Nur 20.-21. Nov' },
                    { value: '22-23', name: 'Nur 22.-23. Nov' },
                    { value: 'custom', name: 'Einzelne Tage' }
                ]
            },
            {
                name: 'workshop_preference',
                type: 'select',
                label: 'Workshop-Präferenz',
                choices: [
                    { value: 'theater', name: 'Theaterpädagogik' },
                    { value: 'digital', name: 'Digitale Methoden' },
                    { value: 'inclusive', name: 'Inklusive Theaterarbeit' },
                    { value: 'none', name: 'Keine Präferenz' }
                ]
            },
            {
                name: 'accommodation_needed',
                type: 'select',
                label: 'Unterkunft benötigt?',
                required: true,
                choices: [
                    { value: 'yes', name: 'Ja, ich benötige eine Unterkunft' },
                    { value: 'no', name: 'Nein, ich habe bereits eine Unterkunft' }
                ]
            },
            {
                name: 'certificate_needed',
                type: 'select',
                label: 'Teilnahmebescheinigung gewünscht?',
                required: true,
                choices: [
                    { value: 'yes', name: 'Ja, bitte' },
                    { value: 'no', name: 'Nicht erforderlich' }
                ]
            },
            {
                name: 'dietary_requirements',
                type: 'textarea',
                label: 'Ernährungshinweise',
                description: 'Allergien oder besondere Ernährungswünsche',
                placeholder: 'z.B. vegetarisch, vegan, glutenfrei...'
            },
            {
                name: 'comments',
                type: 'textarea',
                label: 'Bemerkungen',
                placeholder: 'Weitere Informationen oder Fragen...'
            }
        ]
    }
}

/**
 * Get form definition by name
 */
export function getFormDefinition(formName: string): FormDefinition | null {
    return formRegistry[formName] || null
}

/**
 * Get field list for a form
 */
export function getFieldList(formName: string): FieldDefinition[] {
    const formDef = getFormDefinition(formName)
    return formDef ? formDef.fields : []
}

/**
 * Validate email format with allowed TLDs
 */
export function isValidEmail(email: string): boolean {
    if (!email || !email.includes('@')) {
        return false
    }

    // Check basic email structure
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        return false
    }

    // Check for allowed TLDs
    const allowedTlds = ['de', 'eu', 'com', 'org', 'info']
    const emailLower = email.toLowerCase()

    return allowedTlds.some(tld => emailLower.endsWith('.' + tld))
}

/**
 * Validate field value based on subtype rules
 */
export function validateField(
    field: FieldDefinition,
    value: any,
    allValues: Record<string, any>
): string | null {
    // Required field validation
    if (field.required && (!value || value === '')) {
        return `${field.label} ist erforderlich`
    }

    // Email field validation
    if (field.type === 'email' && value && !isValidEmail(value)) {
        return 'Bitte geben Sie eine gültige E-Mail-Adresse ein (.de, .eu, .com, .org, .info)'
    }

    // Subtype-specific validation
    if (field.subtype === 'conference_start' && value) {
        const startDate = new Date(value)
        const conferenceStart = new Date('2025-11-20')
        const conferenceEnd = new Date('2025-11-23')

        if (startDate < conferenceStart || startDate > conferenceEnd) {
            return 'Anreisedatum muss zwischen 20. und 23. November liegen'
        }
    }

    if (field.subtype === 'conference_end' && value) {
        const endDate = new Date(value)
        const conferenceStart = new Date('2025-11-20')
        const conferenceEnd = new Date('2025-11-23')

        if (endDate < conferenceStart || endDate > conferenceEnd) {
            return 'Abreisedatum muss zwischen 20. und 23. November liegen'
        }

        // Check that end_date is after start_date
        if (allValues.start_date) {
            const startDate = new Date(allValues.start_date)
            if (endDate < startDate) {
                return 'Abreisedatum muss nach dem Anreisedatum liegen'
            }
        }
    }

    return null
}
