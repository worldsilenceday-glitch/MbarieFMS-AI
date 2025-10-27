export const MessageBubble = ({ role, content }: { role: string; content: string }) => (
  <div
    className={`p-4 my-3 rounded-2xl max-w-[85%] transition-all duration-300 ${
      role === "user"
        ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white self-end ml-auto shadow-lg shadow-blue-500/25"
        : "bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 text-gray-800 dark:text-gray-200 self-start shadow-lg shadow-gray-500/10 dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-600"
    }`}
  >
    <p className="leading-relaxed">{content}</p>
  </div>
);
