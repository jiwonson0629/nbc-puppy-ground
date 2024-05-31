import { useState } from 'react';

const usePagination = (items: any[], itemsPerPage: number) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);

  const currentItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const goToNextPage = () => {
    setCurrentPage((page) => Math.min(page + 1, totalPages));
  };

  const goToPreviousPage = () => {
    setCurrentPage((page) => Math.max(page - 1, 1));
  };

  const goToPage = (pageNumber: number) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  };

  const getPageNumbers = () => {
    const totalNumbers = 5;
    const halfNumbers = Math.floor(totalNumbers / 2);

    let startPage = Math.max(currentPage - halfNumbers, 1);
    let endPage = Math.min(currentPage + halfNumbers, totalPages);

    if (currentPage <= halfNumbers) {
      endPage = Math.min(totalNumbers, totalPages);
    } else if (currentPage + halfNumbers >= totalPages) {
      startPage = Math.max(totalPages - totalNumbers + 1, 1);
    }

    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  return {
    currentPage,
    totalPages,
    currentItems,
    goToNextPage,
    goToPreviousPage,
    goToPage,
    getPageNumbers
  };
};

export default usePagination;
