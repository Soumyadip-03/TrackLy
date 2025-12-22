import { useEffect } from 'react'
import { setCookie } from 'cookies-next'

export function useSessionPersistence() {
  useEffect(() => {
    const token = localStorage.getItem('trackly_token')
    const user = localStorage.getItem('trackly_user')
    
    if (token && user) {
      setCookie('trackly_token', token, { maxAge: 60 * 60 * 24 * 7 })
      const userData = JSON.parse(user)
      setCookie('user-id', userData._id, { maxAge: 60 * 60 * 24 * 7 })
    }
  }, [])
}
