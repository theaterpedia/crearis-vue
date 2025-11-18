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
        title: 'Anmeldung',
        description: 'Melde dich an für: Richtfest | Fachtag | Gesamtpaket',
        fields: [
            {
                name: 'participation_days',
                type: 'select',
                label: 'Teilnahmetage',
                description: 'An welchen Tagen nimmst du teil?',
                required: true,
                choices: [
                    { value: 'all', name: 'Alle Tage (21.-23. Nov) - 50 EUR TN-Gebühr' },
                    { value: '21', name: 'Richtfest 21. Nov 18:00-22:00' },
                    { value: '22', name: 'Nur Fachtag 22. Nov 09:00-19:00 - 50 EUR TN-Gebühr' }
                ]
            },            
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
                name: 'workshop_preference',
                type: 'select',
                label: 'Programm-Präferenz',
                choices: [
                    { value: 'digital', name: 'Theaterpedia als Digitaltool Theaterpädagogik' },
                    { value: 'praxis', name: 'Praxis des Theatralen Lernens' },
                    { value: 'diskurs', name: 'Diskurs und Theorie' },
                    { value: 'regio', name: 'Vernetzung und Kooperation' },
                    { value: 'none', name: 'Keine Präferenz' }
                ]
            },
            {
                name: 'hotel_options',
                type: 'select',
                label: 'Übernachtung',
                description: 'Möchtest du im CVJM Hotel übernachten?',
                required: false,
                choices: [
                    { value: 'nein', name: 'Nein, keine Übernachtung' },
                    { value: 'ez', name: 'Übernachtung im Einzelzimmer (EUR 70,00/Nacht)' },
                    { value: 'dz', name: 'Übernachtung im Doppelzimmer (EUR 60,00/Nacht)' },
                    { value: '4z', name: 'Übernachtung im 4er-Zimmer (EUR 40,00/Nacht)' }
                ]
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
        title: 'bereits verifiziert',
        description: 'bitte treffe deine Auswahl und bestätige die Anmeldung',
        fields: [
            {
                name: 'participation_days',
                type: 'select',
                label: 'Teilnahmetage',
                description: 'An welchen Tagen nimmst du teil?',
                required: true,
                choices: [
                    { value: 'all', name: 'Alle Tage (21.-23. Nov) - 50 EUR TN-Gebühr' },
                    { value: '21', name: 'Richtfest 21. Nov 18:00-22:00' },
                    { value: '22', name: 'Nur Fachtag 22. Nov 09:00-19:00 - 50 EUR TN-Gebühr' }
                ]
            },
            {
                name: 'workshop_preference',
                type: 'select',
                label: 'Programm-Präferenz',
                choices: [
                    { value: 'digital', name: 'Theaterpedia als Digitaltool Theaterpädagogik' },
                    { value: 'praxis', name: 'Praxis des Theatralen Lernens' },
                    { value: 'diskurs', name: 'Diskurs und Theorie' },
                    { value: 'regio', name: 'Vernetzung und Kooperation' },
                    { value: 'none', name: 'Keine Präferenz' }
                ]
            },                  
            {
                name: 'organization',
                type: 'text',
                label: '(Organisation)',
                placeholder: 'Deine Organisation'
            },
            {
                name: 'phone',
                type: 'text',
                label: 'Telefon',
                placeholder: '+49 123 456789'
            },
            {
                name: 'hotel_options',
                type: 'select',
                label: 'Übernachtung',
                description: 'Möchtest du im CVJM Hotel übernachten?',
                required: false,
                choices: [
                    { value: 'nein', name: 'Nein, keine Übernachtung' },
                    { value: 'ez', name: 'Übernachtung im Einzelzimmer (EUR 70,00/Nacht)' },
                    { value: 'dz', name: 'Übernachtung im Doppelzimmer (EUR 60,00/Nacht)' },
                    { value: '4z', name: 'Übernachtung im 4er-Zimmer (EUR 40,00/Nacht)' }
                ]
            },              
            {
                name: 'comments',
                type: 'textarea',
                label: 'Bemerkungen',
                placeholder: 'Weitere Informationen oder Fragen...'
            }
        ]
    },
    'newsletter': {
        name: 'newsletter',
        title: 'Newsletter-Anmeldung',
        description: 'Bleibe auf dem Laufenden mit unserem Newsletter',
        fields: [
            {
                name: 'name',
                type: 'text',
                label: 'Name',
                required: true,
                placeholder: 'Dein Name'
            },
            {
                name: 'email',
                type: 'email',
                label: 'E-Mail',
                required: true,
                placeholder: 'name@example.com'
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
