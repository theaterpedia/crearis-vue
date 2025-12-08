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
// XML-RPC Helpers
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
 * Parse XML-RPC response value
 */
function parseValue(node: Element): XmlRpcValue {
    const valueNode = node.tagName === 'value' ? node.firstElementChild : node
    if (!valueNode) {
        // Text content directly in value
        return node.textContent || ''
    }

    const tag = valueNode.tagName
    const text = valueNode.textContent || ''

    switch (tag) {
        case 'int':
        case 'i4':
        case 'i8':
            return parseInt(text, 10)
        case 'double':
            return parseFloat(text)
        case 'boolean':
            return text === '1' || text === 'true'
        case 'string':
            return text
        case 'nil':
            return null
        case 'array': {
            const data = valueNode.querySelector('data')
            if (!data) return []
            return Array.from(data.querySelectorAll(':scope > value')).map(parseValue)
        }
        case 'struct': {
            const result: { [key: string]: XmlRpcValue } = {}
            const members = valueNode.querySelectorAll(':scope > member')
            members.forEach(member => {
                const name = member.querySelector('name')?.textContent || ''
                const value = member.querySelector('value')
                if (value) {
                    result[name] = parseValue(value)
                }
            })
            return result
        }
        default:
            return text
    }
}

/**
 * Parse XML-RPC response
 */
function parseResponse(xml: string): XmlRpcValue {
    // Use linkedom for server-side XML parsing
    const { DOMParser } = require('linkedom')
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')

    // Check for fault
    const fault = doc.querySelector('fault')
    if (fault) {
        const faultValue = fault.querySelector('value')
        const faultObj = faultValue ? parseValue(faultValue) : { faultString: 'Unknown error' }
        throw new Error(`XML-RPC Fault: ${JSON.stringify(faultObj)}`)
    }

    // Get response value
    const valueNode = doc.querySelector('params > param > value')
    if (!valueNode) {
        throw new Error('Invalid XML-RPC response: no value found')
    }

    return parseValue(valueNode)
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
