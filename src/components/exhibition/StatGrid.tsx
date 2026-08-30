// Task F10 (box-grammar ruling, controller-approved mocks
// output/design-align-r2/concept-a-logbook.png + output/design-align/
// direction-privacy-b.png): plain typographic stat row — a single hairline
// rule above the row, each stat an inline mono value + small-caps label
// pair, no per-cell background fill, no 1px-gap checkerboard grid. This
// replaces the earlier "filled-cell checkerboard" grammar (F8 audit finding
// 1): that version painted the hairline as the grid's own background and
// let each cell fill over it, which also left an orphan filled-grey track
// on 3-item grids at narrow (mobile) widths whenever auto-fit couldn't give
// every cell a full column. The row-based layout below has no track count
// to overflow, so that bug can't recur regardless of item count.
export function StatGrid({
  items,
  onInk,
}: {
  items: { value: string; label: string }[];
  onInk?: boolean;
}) {
  return (
    <div className="exhibit-stat-grid" data-on-ink={onInk ? "true" : undefined}>
      {items.map((item) => (
        <div className="exhibit-stat-cell" key={`${item.label}-${item.value}`}>
          <strong className="exhibit-stat-value">{item.value}</strong>
          <span className="exhibit-stat-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
