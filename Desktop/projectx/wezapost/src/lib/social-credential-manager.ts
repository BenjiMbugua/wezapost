/**
 * Social Media Credential Manager
 * Handles secure storage and retrieval of user OAuth app credentials
 */

interface SocialCredentials {
  platform: string
  clientId: string
  clientSecret: string
  userId: string
  configured: boolean
  configuredAt: string
}

interface StoredCredentials {
  [key: string]: SocialCredentials // key is `${userId}-${platform}`
}

export class SocialCredentialManager {
  private static readonly STORAGE_KEY = 'wezapost-social-credentials'

  // Store credentials securely (in localStorage for demo, database in production)
  static saveCredentials(userId: string, platform: string, clientId: string, clientSecret: string): boolean {
    try {
      const key = `${userId}-${platform}`
      const existingData = this.getStoredCredentials()
      
      existingData[key] = {
        platform,
        clientId,
        clientSecret,
        userId,
        configured: true,
        configuredAt: new Date().toISOString()
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingData))
      return true
    } catch (error) {
      console.error('Failed to save credentials:', error)
      return false
    }
  }

  // Get credentials for a specific user and platform
  static getCredentials(userId: string, platform: string): SocialCredentials | null {
    try {
      const key = `${userId}-${platform}`
      const storedData = this.getStoredCredentials()
      return storedData[key] || null
    } catch (error) {
      console.error('Failed to get credentials:', error)
      return null
    }
  }

  // Check if platform is configured for user
  static isPlatformConfigured(userId: string, platform: string): boolean {
    const credentials = this.getCredentials(userId, platform)
    return credentials?.configured === true
  }

  // Get all configured platforms for a user
  static getConfiguredPlatforms(userId: string): string[] {
    try {
      const storedData = this.getStoredCredentials()
      return Object.values(storedData)
        .filter(cred => cred.userId === userId && cred.configured)
        .map(cred => cred.platform)
    } catch (error) {
      console.error('Failed to get configured platforms:', error)
      return []
    }
  }

  // Remove credentials for a platform
  static removeCredentials(userId: string, platform: string): boolean {
    try {
      const key = `${userId}-${platform}`
      const storedData = this.getStoredCredentials()
      delete storedData[key]
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storedData))
      return true
    } catch (error) {
      console.error('Failed to remove credentials:', error)
      return false
    }
  }

  // Private helper to get stored data
  private static getStoredCredentials(): StoredCredentials {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.error('Failed to parse stored credentials:', error)
      return {}
    }
  }

  // Clear all credentials (for logout/reset)
  static clearAllCredentials(): void {
    localStorage.removeItem(this.STORAGE_KEY)
  }

  // Get masked credentials for display (security)
  static getMaskedCredentials(userId: string, platform: string): { clientId: string; configured: boolean } | null {
    const credentials = this.getCredentials(userId, platform)
    if (!credentials) return null
    
    return {
      clientId: credentials.clientId.substring(0, 8) + '...',
      configured: credentials.configured
    }
  }
}

// Simple in-memory storage for demo (in production, use encrypted database)
const serverCredentialsCache = new Map<string, SocialCredentials>()

// Export for use in API routes on server-side
export function getServerCredentials(userId: string, platform: string): SocialCredentials | null {
  // In production, this would query the database
  // For demo, check in-memory cache first
  const key = `${userId}-${platform}`
  
  if (typeof window === 'undefined') {
    // Server-side: check cache (in production, query encrypted database)
    return serverCredentialsCache.get(key) || null
  }
  
  // Client-side: use localStorage
  return SocialCredentialManager.getCredentials(userId, platform)
}

// Server-side credential storage for demo
export function saveServerCredentials(userId: string, platform: string, clientId: string, clientSecret: string): boolean {
  const key = `${userId}-${platform}`
  const credentials: SocialCredentials = {
    platform,
    clientId,
    clientSecret,
    userId,
    configured: true,
    configuredAt: new Date().toISOString()
  }
  
  serverCredentialsCache.set(key, credentials)
  return true
}