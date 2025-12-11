/**
 * User Onboarding Configuration
 * 
 * Defines the 4 onboarding phases and their requirements.
 * Status transitions follow sysreg_config rules.
 * 
 * Phase Flow:
 * NEW → DEMO → DRAFT → CONFIRMED/REVIEW → RELEASED
 */

import { STATUS } from './status-constants'

export interface OnboardingStep {
    id: string
    label: string
    description: string
    fromStatus: number
    toStatus: number
    requirements: OnboardingRequirement[]
    optional?: boolean
}

export interface OnboardingRequirement {
    id: string
    label: string
    check: (user: any) => boolean
    action?: string // Component or route to complete this requirement
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
    {
        id: 'verification',
        label: 'Verifizierung',
        description: 'Email-Verifizierung und erste Anmeldung',
        fromStatus: STATUS.NEW,
        toStatus: STATUS.DEMO,
        requirements: [
            {
                id: 'email-verified',
                label: 'Email bestätigt',
                check: (user) => user.email_verified === true
            }
        ]
    },
    {
        id: 'profile',
        label: 'Profil',
        description: 'Erstelle dein Profil mit Avatar',
        fromStatus: STATUS.DEMO,
        toStatus: STATUS.DRAFT,
        requirements: [
            {
                id: 'partner-linked',
                label: 'Partner-Profil verknüpft',
                check: (user) => user.partner_id !== null,
                action: 'ProfileSetupPartner'
            },
            {
                id: 'avatar-uploaded',
                label: 'Avatar-Bild hochgeladen',
                check: (user) => user.img_id !== null,
                action: 'ProfileSetupAvatar'
            }
        ]
    },
    {
        id: 'learn',
        label: 'Grundlagen lernen',
        description: 'Lerne die Plattform kennen',
        fromStatus: STATUS.DRAFT,
        toStatus: STATUS.CONFIRMED_USER,
        requirements: [
            {
                id: 'demo-project',
                label: 'Demo-Projekt durchgespielt',
                check: (user) => user.demo_completed === true,
                action: 'OnboardingDemoProject'
            },
            {
                id: 'content-created',
                label: 'Ersten Inhalt erstellt',
                check: (user) => {
                    // Check if user has created at least 1 event or 1 post
                    // Only required for Owner/Creator/Member roles
                    if (!user.hasProjectRole) return true
                    return user.contentCreated === true
                },
                action: 'OnboardingContentCreation'
            }
        ]
    },
    {
        id: 'activate',
        label: 'Aktivieren',
        description: 'Aktiviere dein Profil',
        fromStatus: STATUS.CONFIRMED_USER,
        toStatus: STATUS.RELEASED,
        requirements: [
            {
                id: 'terms-accepted',
                label: 'Nutzungsbedingungen akzeptiert',
                check: (user) => user.terms_accepted === true
            }
        ],
        optional: true // Can stay at CONFIRMED without going to RELEASED
    },
    {
        id: 'publish',
        label: 'Öffentliches Profil',
        description: 'Veröffentliche deine About-Me Seite',
        fromStatus: STATUS.RELEASED,
        toStatus: STATUS.RELEASED, // Same status, just enables public profile
        requirements: [
            {
                id: 'about-filled',
                label: 'About-Me ausgefüllt',
                check: (user) => user.md && user.md.length > 0
            },
            {
                id: 'teaser-filled',
                label: 'Kurzbeschreibung ausgefüllt',
                check: (user) => user.teaser && user.teaser.length > 0
            }
        ],
        optional: true // Only for Owner/Creator/Member roles
    }
]

/**
 * Get the current onboarding step for a user
 */
export function getCurrentOnboardingStep(user: any): OnboardingStep | null {
    if (!user || user.status === undefined) return ONBOARDING_STEPS[0] ?? null

    // Find step where fromStatus matches user status
    const step = ONBOARDING_STEPS.find(step => step.fromStatus === user.status)
    return step ?? null
}

/**
 * Get all completed steps for a user
 */
export function getCompletedSteps(user: any): OnboardingStep[] {
    if (!user) return []

    return ONBOARDING_STEPS.filter(step => user.status > step.toStatus)
}

/**
 * Check if user can advance to next step
 */
export function canAdvanceToNextStep(user: any): boolean {
    const currentStep = getCurrentOnboardingStep(user)
    if (!currentStep) return false

    return currentStep.requirements.every(req => req.check(user))
}

/**
 * Get incomplete requirements for current step
 */
export function getIncompleteRequirements(user: any): OnboardingRequirement[] {
    const currentStep = getCurrentOnboardingStep(user)
    if (!currentStep) return []

    return currentStep.requirements.filter(req => !req.check(user))
}
