export const commentListStyles = {
  container: "p-4 max-h-[300px] overflow-y-auto",
  commentsWrapper: "space-y-3",
  loadingContainer: "flex justify-center py-4",
  loadingText: "text-sm text-gray-500",
  emptyContainer: "text-center py-8",
  emptyText: "text-sm text-gray-500",
  emptySubtext: "text-xs text-gray-400 mt-1",
} as const;

export const commentFormStyles = {
  form: "flex flex-col gap-4 p-4 border-t",
  inputContainer: "relative",
  input: "border rounded-md p-3 w-full pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
  characterCount: "absolute right-3 top-3 text-xs text-gray-400",
  footer: "px-0 pt-0",
  submitButton: "w-full",
} as const;

export const commentItemStyles = {
  container: "flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border",
  meta: "flex items-center gap-2 text-xs text-gray-500",
  username: "font-medium text-gray-700",
  separator: "text-gray-400",
  timestamp: "text-gray-500",
  content: "text-sm text-gray-800 leading-relaxed",
  actions: "flex justify-end mt-1",
  deleteButton: "h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50",
  deleteIcon: "h-3 w-3",
} as const;

export const errorStyles = {
  container: "mx-4 p-3 bg-red-50 border border-red-200 rounded-md",
  text: "text-sm text-red-600",
} as const;