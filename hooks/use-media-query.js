"use client"

import * as React from "react"

export function useMediaQuery(query) {
  const [value, setValue] = React.useState(false)

  React.useEffect(() => {
    const mediaQueryList = window.matchMedia(query)
    
    const onChange = () => {
      setValue(mediaQueryList.matches)
    }
    
    // Set initial value
    setValue(mediaQueryList.matches)
    
    // Add event listener
    mediaQueryList.addEventListener("change", onChange)
    
    // Clean up
    return () => {
      mediaQueryList.removeEventListener("change", onChange)
    }
  }, [query])

  return value
}