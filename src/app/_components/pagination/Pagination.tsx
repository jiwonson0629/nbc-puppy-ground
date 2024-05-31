import React from 'react';
import styles from './pagination.module.scss';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  goToPage: (pageNumber: number) => void;
  getPageNumbers: () => number[];
};

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  goToNextPage,
  goToPreviousPage,
  goToPage,
  getPageNumbers
}) => {
  const pageNumbers = getPageNumbers();

  return (
    <nav className={styles.buttonWrapper}>
      <button onClick={goToPreviousPage} disabled={currentPage <= 1} className={styles.button}>
        {'<'}
      </button>
      {pageNumbers.map((pageNumber) => (
        <button
          key={pageNumber}
          onClick={() => goToPage(pageNumber)}
          className={currentPage === pageNumber ? styles.selectedPage : styles.button}
        >
          {pageNumber}
        </button>
      ))}
      <button onClick={goToNextPage} disabled={currentPage >= totalPages} className={styles.button}>
        {'>'}
      </button>
    </nav>
  );
};

export default Pagination;
