'use client'

import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error("Caught error:", error, info)
  }

  render() {
    const { className = "" } = this.props
    
    if (this.state.hasError) {
      return (
        <div className={`bg-white dark:bg-gray-900 min-h-screen ${className}`}>
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg p-6 mx-auto max-w-lg my-6">
            <h2 className="text-red-800 dark:text-red-200 text-xl font-semibold mb-4">Something went wrong</h2>
            <div className="bg-white dark:bg-gray-800 p-4 rounded border border-red-100 dark:border-red-700 mb-4">
              <p className="text-red-700 dark:text-red-300">{this.state.error?.message || "An error occurred"}</p>
            </div>
            <button 
              onClick={() => window.location.href = '/dashboard'} 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )
    }
    return <div className={`bg-white dark:bg-gray-900 min-h-screen ${className}`}>{this.props.children}</div>
  }
}