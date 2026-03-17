import s from './Pagination.module.scss'

type PaginationProps = {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

type PaginationItem = number | 'ellipsis-left' | 'ellipsis-right'

const MAX_VISIBLE_PAGES = 7
const SIBLING_COUNT = 1

function getPaginationItems(page: number, totalPages: number): PaginationItem[] {
  if (totalPages <= MAX_VISIBLE_PAGES) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const firstPage = 1
  const lastPage = totalPages
  const leftSibling = Math.max(page - SIBLING_COUNT, firstPage + 1)
  const rightSibling = Math.min(page + SIBLING_COUNT, lastPage - 1)

  const showLeftEllipsis = leftSibling > firstPage + 1
  const showRightEllipsis = rightSibling < lastPage - 1

  const items: PaginationItem[] = [firstPage]

  if (showLeftEllipsis) {
    items.push('ellipsis-left')
  } else {
    for (let current = firstPage + 1; current < leftSibling; current += 1) {
      items.push(current)
    }
  }

  for (let current = leftSibling; current <= rightSibling; current += 1) {
    items.push(current)
  }

  if (showRightEllipsis) {
    items.push('ellipsis-right')
  } else {
    for (let current = rightSibling + 1; current < lastPage; current += 1) {
      items.push(current)
    }
  }

  items.push(lastPage)

  return items
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  const items = getPaginationItems(page, totalPages)

  return (
    <div className={s.pagination} role="navigation" aria-label="Pagination">
      <button
        className={[s.button, page === 1 && s.disabled].filter(Boolean).join(' ')}
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
      >
        Prev
      </button>
      {items.map((item) =>
        typeof item === 'number' ? (
          <button
            key={item}
            className={[s.button, item === page && s.active].filter(Boolean).join(' ')}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? 'page' : undefined}
          >
            {item}
          </button>
        ) : (
          <span key={item} className={s.ellipsis} aria-hidden="true">
            ...
          </span>
        ),
      )}
      <button
        className={[s.button, page === totalPages && s.disabled]
          .filter(Boolean)
          .join(' ')}
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
      >
        Next
      </button>
    </div>
  )
}
