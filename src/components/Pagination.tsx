"use client";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-3 py-2 border rounded-lg disabled:opacity-50"
      >
        Prev
      </button>
      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
        let page = i + 1;
        if (totalPages > 7 && currentPage > 4) page = currentPage - 3 + i;
        if (totalPages > 7 && currentPage > totalPages - 3)
          page = totalPages - 6 + i;
        return page <= totalPages ? (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-2 border rounded-lg ${page === currentPage ? "bg-indigo-600 text-white" : ""}`}
          >
            {page}
          </button>
        ) : null;
      })}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= Math.max(0, totalPages)}
        className="px-3 py-2 border rounded-lg disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
