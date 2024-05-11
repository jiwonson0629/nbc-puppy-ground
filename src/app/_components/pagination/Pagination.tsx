import React, { Dispatch, SetStateAction } from 'react';
import style from './pagination.module.scss';
import useStrayDogStore from '@/shared/zustand/strayDogStore';
export type Props = {
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  total: number | undefined;
  limit: number;
};

function Pagination({ page, total, limit }: Props) {
  const setPage = useStrayDogStore((state) => state.setPagination);
  const numPages = Math.ceil(total! / limit);
  const pagesToShow = 5;

  const startPage = Math.max(1, page - Math.floor(pagesToShow / 2));
  const endPage = Math.min(numPages, startPage + pagesToShow - 1);

  const renderPageButtons = Array.from(
    { length: endPage - startPage + 1 },
    (_, index) => startPage + index
  );

  return (
    <nav className={style.buttonWrapper}>
      <button
        className={style.button}
        onClick={() => setPage(Math.max(1, page - pagesToShow))}
        disabled={page <= 1}
      >
        &lt;
      </button>
      {renderPageButtons.map((pageNumber) => (
        <button
          key={pageNumber}
          onClick={() => setPage(pageNumber)}
          className={page === pageNumber ? style.selectedPage : style.button}
        >
          {pageNumber}
        </button>
      ))}
      <button
        className={style.button}
        onClick={() => setPage(Math.min(numPages, page + pagesToShow))}
        disabled={page >= numPages}
      >
        &gt;
      </button>
    </nav>
  );
}

export default Pagination;
