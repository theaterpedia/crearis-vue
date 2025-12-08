/**
 * Odoo XML-RPC Client for Crearis-Vue
 * 
 * Minimal XML-RPC client for Odoo integration.
 * Uses native fetch and simple XML generation.
 * 
 * Usage:
 *   const odoo = new OdooRpc()
 *   await odoo.connect()
 *   const events = await odoo.searchRead('event.event', [], ['name', 'date_begin'])
 * 
 * Environment variables:
 *   ODOO_URL - Odoo server URL (default: http://localhost:8069)
 *   ODOO_DATABASE - Database name (default: crearis)
 *   ODOO_USERNAME - Username (default: admin)
 *   ODOO_API_KEY - API key for authentication
 * 
 * December 2025 - Alpha workaround for events integration
 */

// ============================================================================
// XML-RPC Helpers (Pure regex-based parsing, no dependencies)
// ============================================================================

type XmlRpcValue = string | number | boolean | null | XmlRpcValue[] | { [key: string]: XmlRpcValue }

/**
 * Convert JavaScript value to XML-RPC value element
 */
function valueToXml(value: XmlRpcValue): string {
    if (value === null || value === undefined) {
        return '<value><nil/></value>'
    }
    if (typeof value === 'boolean') {
        return `<value><boolean>${value ? 1 : 0}</boolean></value>`
    }
    if (typeof value === 'number') {
        if (Number.isInteger(value)) {
            return `<value><int>${value}</int></value>`
        }
        return `<value><double>${value}</double></value>`
    }
    if (typeof value === 'string') {
        const escaped = value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
        return `<value><string>${escaped}</string></value>`
    }
    if (Array.isArray(value)) {
        const items = value.map(v => valueToXml(v)).join('')
        return `<value><array><data>${items}</data></array></value>`
    }
    if (typeof value === 'object') {
        const members = Object.entries(value)
            .map(([k, v]) => `<member><name>${k}</name>${valueToXml(v)}</member>`)
            .join('')
        return `<value><struct>${members}</struct></value>`
    }
    return '<value><nil/></value>'
}

/**
 * Build XML-RPC method call
 */
function buildMethodCall(method: string, params: XmlRpcValue[]): string {
    const paramsXml = params.map(p => `<param>${valueToXml(p)}</param>`).join('')
    return `<?xml version="1.0"?><methodCall><methodName>${method}</methodName><params>${paramsXml}</params></methodCall>`
}

/**
 * Parse XML-RPC response value from XML string (regex-based)
 */
function parseXmlValue(xml: string): XmlRpcValue {
    xml = xml.trim()

    // Check first tag to determine type
    // Arrays start with <array>
    if (xml.startsWith('<array>')) {
        return parseXmlArray(xml)
    }

    // Structs start with <struct>
    if (xml.startsWith('<struct>')) {
        return parseXmlStruct(xml)
    }

    // Simple types - match from start
    const intMatch = xml.match(/^<(int|i4|i8)>([-\d]+)<\/\1>/)
    if (intMatch) return parseInt(intMatch[2], 10)

    const doubleMatch = xml.match(/^<double>([-\d.e+]+)<\/double>/i)
    if (doubleMatch) return parseFloat(doubleMatch[1])

    const boolMatch = xml.match(/^<boolean>(\d|true|false)<\/boolean>/i)
    if (boolMatch) return boolMatch[1] === '1' || boolMatch[1].toLowerCase() === 'true'

    const stringMatch = xml.match(/^<string>([\s\S]*?)<\/string>/)
    if (stringMatch) {
        return stringMatch[1]
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
    }

    if (xml.startsWith('<nil')) return null

    // Plain text fallback (strings without <string> tag)
    return xml
}

/**
 * Parse XML-RPC array - handles nested structures
 */
function parseXmlArray(xml: string): XmlRpcValue[] {
    const values: XmlRpcValue[] = []

    // Find <data>...</data> content
    const dataStart = xml.indexOf('<data>') + 6
    const dataEnd = xml.lastIndexOf('</data>')
    if (dataStart === 5 || dataEnd === -1) return values

    const dataContent = xml.substring(dataStart, dataEnd)

    // Parse each <value>...</value> element (handling nesting properly)
    let depth = 0
    let valueStart = -1
    let i = 0

    while (i < dataContent.length) {
        if (dataContent.substring(i, i + 7) === '<value>') {
            if (depth === 0) valueStart = i + 7
            depth++
            i += 7
        } else if (dataContent.substring(i, i + 8) === '</value>') {
            depth--
            if (depth === 0 && valueStart !== -1) {
                const valueContent = dataContent.substring(valueStart, i).trim()
                values.push(parseXmlValue(valueContent))
                valueStart = -1
            }
            i += 8
        } else {
            i++
        }
    }

    return values
}

/**
 * Parse XML-RPC struct - handles nested structures
 */
function parseXmlStruct(xml: string): { [key: string]: XmlRpcValue } {
    const result: { [key: string]: XmlRpcValue } = {}

    // Find content between <struct> and </struct>
    const structStart = xml.indexOf('<struct>') + 8
    const structEnd = xml.lastIndexOf('</struct>')
    if (structStart === 7 || structEnd === -1) return result

    const content = xml.substring(structStart, structEnd)

    // Parse each <member>...</member>
    let depth = 0
    let memberStart = -1
    let i = 0

    while (i < content.length) {
        if (content.substring(i, i + 8) === '<member>') {
            if (depth === 0) memberStart = i + 8
            depth++
            i += 8
        } else if (content.substring(i, i + 9) === '</member>') {
            depth--
            if (depth === 0 && memberStart !== -1) {
                const memberContent = content.substring(memberStart, i)

                // Extract name
                const nameMatch = memberContent.match(/<name>([^<]+)<\/name>/)
                if (nameMatch) {
                    const name = nameMatch[1]
                    // Find value content
                    const valueStartIdx = memberContent.indexOf('<value>') + 7
                    const valueEndIdx = memberContent.lastIndexOf('</value>')
                    if (valueStartIdx > 6 && valueEndIdx > -1) {
                        const valueContent = memberContent.substring(valueStartIdx, valueEndIdx).trim()
                        result[name] = parseXmlValue(valueContent)
                    }
                }
                memberStart = -1
            }
            i += 9
        } else {
            i++
        }
    }

    return result
}

/**
 * Parse XML-RPC response (regex-based, no DOM dependencies)
 */
function parseResponse(xml: string): XmlRpcValue {
    // Check for fault - need to handle nested struct properly
    if (xml.includes('<fault>')) {
        // Extract the full fault section
        const faultStart = xml.indexOf('<fault>')
        const faultEnd = xml.indexOf('</fault>') + 8
        const faultXml = xml.substring(faultStart, faultEnd)

        // Try to extract faultCode and faultString
        const faultCodeMatch = faultXml.match(/<name>faultCode<\/name>\s*<value><int>(\d+)<\/int><\/value>/)
        const faultStringMatch = faultXml.match(/<name>faultString<\/name>\s*<value><string>([\s\S]*?)<\/string><\/value>/)

        const faultCode = faultCodeMatch ? parseInt(faultCodeMatch[1], 10) : 0
        const faultString = faultStringMatch ? faultStringMatch[1] : 'Unknown error'

        console.error('[OdooRpc] XML-RPC Fault:', { faultCode, faultString: faultString.substring(0, 500) })
        throw new Error(`XML-RPC Fault ${faultCode}: ${faultString}`)
    }

    // Get response value - extract content between <params><param><value> and </value></param></params>
    // Use greedy matching since the response can contain nested <value> tags
    const startMarker = '<params><param><value>'
    const endMarker = '</value></param></params>'

    // Find the markers (with possible whitespace)
    const startRegex = /<params>\s*<param>\s*<value>/
    const endRegex = /<\/value>\s*<\/param>\s*<\/params>/

    const startMatch = startRegex.exec(xml)
    if (!startMatch) {
        console.error('[OdooRpc] Invalid response - no start marker (first 500 chars):', xml.substring(0, 500))
        throw new Error('Invalid XML-RPC response: no start value marker found')
    }

    const startIndex = startMatch.index + startMatch[0].length

    // Find the last occurrence of the end marker
    const endMatch = endRegex.exec(xml.substring(startIndex))
    if (!endMatch) {
        console.error('[OdooRpc] Invalid response - no end marker')
        throw new Error('Invalid XML-RPC response: no end value marker found')
    }

    const valueContent = xml.substring(startIndex, startIndex + endMatch.index)

    return parseXmlValue(valueContent)
}

// ============================================================================
// Odoo RPC Client
// ============================================================================

export interface OdooConfig {
    url: string
    database: string
    username: string
    apiKey: string
}

export class OdooRpc {
    private config: OdooConfig
    private uid: number | null = null

    constructor(config?: Partial<OdooConfig>) {
        this.config = {
            url: config?.url || process.env.ODOO_URL || 'http://localhost:8069',
            database: config?.database || process.env.ODOO_DATABASE || 'crearis',
            username: config?.username || process.env.ODOO_USERNAME || 'admin',
            apiKey: config?.apiKey || process.env.ODOO_API_KEY || ''
        }
    }

    /**
     * Make XML-RPC call
     */
    private async call(endpoint: string, method: string, params: XmlRpcValue[]): Promise<XmlRpcValue> {
        const url = `${this.config.url}/xmlrpc/2/${endpoint}`
        const body = buildMethodCall(method, params)

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml',
            },
            body
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const xml = await response.text()
        return parseResponse(xml)
    }

    /**
     * Authenticate with Odoo
     */
    async connect(): Promise<boolean> {
        try {
            const result = await this.call('common', 'authenticate', [
                this.config.database,
                this.config.username,
                this.config.apiKey,
                {}
            ])
            this.uid = result as number
            return this.uid > 0
        } catch (error) {
            console.error('[OdooRpc] Connection failed:', error)
            return false
        }
    }

    /**
     * Get Odoo server version
     */
    async version(): Promise<{ server_version: string; protocol_version: number }> {
        const result = await this.call('common', 'version', [])
        return result as { server_version: string; protocol_version: number }
    }

    /**
     * Ensure connected
     */
    private async ensureConnected(): Promise<void> {
        if (!this.uid) {
            const connected = await this.connect()
            if (!connected) {
                throw new Error('Failed to connect to Odoo')
            }
        }
    }

    /**
     * Execute method on Odoo model
     */
    async execute(model: string, method: string, args: XmlRpcValue[] = [], kwargs: { [key: string]: XmlRpcValue } = {}): Promise<XmlRpcValue> {
        await this.ensureConnected()
        return this.call('object', 'execute_kw', [
            this.config.database,
            this.uid,
            this.config.apiKey,
            model,
            method,
            args,
            kwargs
        ])
    }

    // ========================================================================
    // Convenience Methods
    // ========================================================================

    /**
     * Search for record IDs
     */
    async search(model: string, domain: XmlRpcValue[] = [], options: { limit?: number; offset?: number; order?: string } = {}): Promise<number[]> {
        const result = await this.execute(model, 'search', [domain], options)
        return result as number[]
    }

    /**
     * Read records by IDs
     */
    async read(model: string, ids: number[], fields?: string[]): Promise<Record<string, XmlRpcValue>[]> {
        const args: XmlRpcValue[] = [ids]
        if (fields) {
            args.push(fields)
        }
        const result = await this.execute(model, 'read', args)
        return result as Record<string, XmlRpcValue>[]
    }

    /**
     * Search and read in one call
     */
    async searchRead(
        model: string,
        domain: XmlRpcValue[] = [],
        fields?: string[],
        options: { limit?: number; offset?: number; order?: string } = {}
    ): Promise<Record<string, XmlRpcValue>[]> {
        const kwargs: { [key: string]: XmlRpcValue } = { ...options }
        if (fields) {
            kwargs.fields = fields
        }
        const result = await this.execute(model, 'search_read', [domain], kwargs)
        return result as Record<string, XmlRpcValue>[]
    }

    /**
     * Count records
     */
    async count(model: string, domain: XmlRpcValue[] = []): Promise<number> {
        const result = await this.execute(model, 'search_count', [domain])
        return result as number
    }

    /**
     * Create a new record
     */
    async create(model: string, values: { [key: string]: XmlRpcValue }): Promise<number> {
        const result = await this.execute(model, 'create', [values])
        return result as number
    }

    /**
     * Update existing records
     */
    async write(model: string, ids: number[], values: { [key: string]: XmlRpcValue }): Promise<boolean> {
        const result = await this.execute(model, 'write', [ids, values])
        return result as boolean
    }

    /**
     * Delete records
     */
    async unlink(model: string, ids: number[]): Promise<boolean> {
        const result = await this.execute(model, 'unlink', [ids])
        return result as boolean
    }

    /**
     * Get field definitions for a model
     */
    async fieldsGet(model: string, attributes?: string[]): Promise<Record<string, Record<string, XmlRpcValue>>> {
        const kwargs = attributes ? { attributes } : {}
        const result = await this.execute(model, 'fields_get', [], kwargs)
        return result as Record<string, Record<string, XmlRpcValue>>
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let _instance: OdooRpc | null = null

/**
 * Get shared OdooRpc instance
 */
export function getOdooRpc(): OdooRpc {
    if (!_instance) {
        _instance = new OdooRpc()
    }
    return _instance
}

/**
 * Reset singleton (for testing)
 */
export function resetOdooRpc(): void {
    _instance = null
}
