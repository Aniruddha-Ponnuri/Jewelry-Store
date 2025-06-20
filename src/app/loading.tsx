export default function Loading() {
  return (
    <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 lg:py-16">
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-amber-600 mx-auto"></div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-700">Loading...</h2>
          <p className="text-sm sm:text-base text-gray-500">
            Please wait while we load your content
          </p>
        </div>
      </div>
    </div>
  )
}
