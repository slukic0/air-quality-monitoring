import { useEffect, useState } from 'react'

export const useSession = () => {
    const [loading, setLoading] = useState(true)
    const [session, setSession] = useState(null)

    useEffect(() => {
        /**
         * Check if user has already has a token stored
         */
        const getTokenLocalStorage = () => localStorage.getItem('session')

        /**
         * Check if the URL contains the token query string when the page loads
         * If so, store it in local storage and then redirect the user to the root domain
         */
        const getTokenUrl = () => {
            const search = window.location.search
            const params = new URLSearchParams(search)
            const token = params.get('token')
            if (token) {
                console.log('Found token in URL')
                localStorage.setItem('session', token)
                window.location.replace(window.location.origin)
            }
            return token
        }

        /**
         * Get user info from DB
         * @param {*} JWT
         */
        const getUserInfo = async (token) => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_APP_API_URL}/session`,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                )
                return response.json()
            } catch (error) {
                console.log('Error getting session', error)
            }
        }

        const getSession = async () => {
            if (!session) {
                const storedToken = getTokenLocalStorage() ?? getTokenUrl()

                if (storedToken) {
                    const user = await getUserInfo(storedToken)
                    setSession(user)
                }
                setLoading(false)
            }
        }

        getSession()
    }, [])

    return { loading, session }
}