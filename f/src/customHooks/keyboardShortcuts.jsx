import { useEffect } from 'react'

export function useKeyboardShortcut(key, callback, useMeta = true) {
    // this hook sets up a keyboard shortcut listener
    // key : string representing the key to listen for
    // callback : function to execute when the key combination is pressed
    // useMeta : boolean indicating whether to require the Meta (Cmd on Mac, Ctrl on Windows) key
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Check if the key matches (case-insensitive)
            const isKeyMatch = e.key.toLowerCase() === key.toLowerCase()
            
            // Check if  alt key is pressed (Windows)
            const isModifierPressed = useMeta ?  e.altKey : true

            if (isKeyMatch && isModifierPressed) {
                e.preventDefault() // Stop the browser's default action
                callback()
            }
        }

        // Add listener to the window
        window.addEventListener('keydown', handleKeyDown)

        // CLEANUP: Remove listener when component unmounts
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [key, callback, useMeta]) // Re-run if these change
}

