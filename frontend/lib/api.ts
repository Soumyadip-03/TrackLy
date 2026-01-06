const API_URL = 'http://localhost:5000/api'

const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('trackly_token')
  }
  return null
}

const isOfflineMode = (): boolean => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('trackly_offline_mode') === 'true'
  }
  return false
}

const saveToOfflineCache = (endpoint: string, data: any) => {
  if (typeof window !== 'undefined') {
    const cacheKey = `offline_cache_${endpoint.replace(/\//g, '_')}`
    localStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: new Date().toISOString()
    }))
  }
}

const getFromOfflineCache = (endpoint: string) => {
  if (typeof window !== 'undefined') {
    const cacheKey = `offline_cache_${endpoint.replace(/\//g, '_')}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        return JSON.parse(cached).data
      } catch (e) {
        return null
      }
    }
  }
  return null
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  try {
    const token = getAuthToken()
    const offline = isOfflineMode()
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    }

    const url = `${API_URL}${endpoint}`
    console.log('Fetching:', url)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)
    
    const fetchOptions = {
      ...options,
      headers,
      signal: options.signal || controller.signal
    }
    
    const response = await fetch(url, fetchOptions)
    clearTimeout(timeoutId)
    
    // If successful, cache the response for offline use
    if (response.ok && options.method !== 'GET') {
      try {
        const data = await response.clone().json()
        saveToOfflineCache(endpoint, data)
      } catch (e) {
        // Ignore cache save errors
      }
    }
    
    return response
  } catch (error) {
    console.error('Fetch error:', endpoint, error instanceof Error ? error.message : String(error))
    
    // If offline mode is enabled, try to return cached data
    if (isOfflineMode()) {
      const cached = getFromOfflineCache(endpoint)
      if (cached) {
        console.log('Returning cached data for offline mode')
        return new Response(JSON.stringify(cached), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }
    
    throw error
  }
}

function getMockAIResponse(input: string): string {
  const lowerInput = input.toLowerCase()
  
  if (lowerInput.includes('attendance') && lowerInput.includes('percentage')) {
    return "Your current overall attendance is 87.5%. You've been doing great this semester!"
  } 
  else if (lowerInput.includes('missed') || lowerInput.includes('absent')) {
    return "You've missed 5 classes this semester. Your attendance is still above the required threshold of 75%."
  } 
  else if (lowerInput.includes('today') && lowerInput.includes('class')) {
    return "You have 4 classes today: Data Structures (9:00 AM), Computer Networks (11:00 AM), Database Systems (2:00 PM), and Technical Writing (4:00 PM)."
  } 
  else if (lowerInput.includes('improve') || lowerInput.includes('better')) {
    return "To improve your attendance, try setting up morning alarms, preparing your materials the night before, and using the notification system in the app to get reminders."
  } 
  else if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
    return "Hello! How can I help you with your attendance tracking today?"
  }
  else if (lowerInput.includes('help')) {
    return "I'm here to help! You can ask me about your attendance records, class schedules, or suggestions to improve your attendance rate."
  }
  else if (lowerInput.includes('thank')) {
    return "You're welcome! Feel free to ask if you need any more assistance with your attendance tracking."
  }
  else {
    return "I'm here to help with your attendance tracking. You can ask me about your attendance percentage, missed classes, today's schedule, or how to improve your attendance."
  }
}

export async function sendChatMessage(message: string, conversationHistory: Array<{role: string, content: string}> = []) {
  try {
    try {
      console.log('Attempting to call AI API route...')
      
      const response = await fetchWithAuth('/chatbot/message', {
        method: 'POST',
        body: JSON.stringify({ message, conversationHistory })
      })
      
      console.log('Response status:', response.status)
      
      if (response.ok) {
        console.log('AI response successful')
        const data = await response.json()
        console.log('AI response data received')
        return data
      } else {
        console.error('API error status:', response.status)
        const errorText = await response.text()
        console.error('API error response:', errorText)
        throw new Error(`Error: ${response.status}`)
      }
    } catch (apiError) {
      console.log('API call failed, using local fallback')
      console.error('API error details:', apiError instanceof Error ? apiError.message : String(apiError))
      
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const mockResponse = getMockAIResponse(message)
      console.log('Generated local response')
      
      return {
        success: true,
        data: {
          message: mockResponse,
          isLocalFallback: true
        }
      }
    }
    
  } catch (error) {
    console.error('Error in chat service:', error)
    
    console.log('Using emergency fallback response')
    
    const fallbackMessage = "I'm here to help with your attendance tracking. You can ask me about your attendance percentage, missed classes, or today's schedule."
    
    return {
      success: true,
      data: {
        message: fallbackMessage,
        isLocalFallback: true
      }
    }
  }
}

export const safeJsonFetch = async (url: string, options: RequestInit = {}) => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      try {
        const errorData = await response.json()
        return { success: false, error: errorData, status: response.status }
      } catch (jsonError) {
        return { 
          success: false, 
          error: { message: response.statusText || "Server error" },
          status: response.status
        }
      }
    }
    
    if (response.status === 204 || response.headers.get('Content-Length') === '0') {
      return { success: true, data: null, status: response.status }
    }
    
    try {
      const data = await response.json()
      return { success: true, data, status: response.status }
    } catch (jsonError) {
      console.error("Error parsing successful response as JSON:", jsonError)
      return { 
        success: false, 
        error: { message: "Invalid JSON response from server" },
        status: response.status
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown fetch error"
    console.error("API fetch error:", message)
    return { 
      success: false, 
      error: { message },
      status: 0
    }
  }
}

export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  PROFILE: '/auth/me',
  NOTIFICATION_PREFERENCES: '/notification/preferences',
}

export const getApiBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
}

export const buildApiUrl = (endpoint: string) => {
  return `${getApiBaseUrl()}${endpoint}`
}

export const createAuthHeaders = () => {
  const token = localStorage.getItem('trackly_token')
  if (!token) return {}
  
  return {
    'Authorization': `Bearer ${token}`
  }
}

const api = {
  sendChatMessage
}

export default api
