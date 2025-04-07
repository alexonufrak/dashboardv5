export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">xFoundry Dashboard</h1>
        <div className="flex justify-center items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse delay-75"></div>
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse delay-150"></div>
          <span className="text-gray-600 dark:text-gray-400 ml-2">Loading...</span>
        </div>
      </div>
    </div>
  )
}