import { useEffect, useMemo, useState } from "react";
import { diagramPageForMachinePart, diagramPagesFor } from "../lib/diagrams";

const normalizePartNumber = (value) => String(value || "").toUpperCase().replace(/[\s-]/g, "");

export function DiagramBrowser({ machine, parts, onPartSelect }) {
  const diagramSet = diagramPagesFor(machine);
  const [pageIndex, setPageIndex] = useState(0);
  const [partQuery, setPartQuery] = useState("");
  const [lookupMessage, setLookupMessage] = useState("");
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setPageIndex(0);
    setPartQuery("");
    setLookupMessage("");
    setZoom(1);
  }, [machine]);

  const partByNumber = useMemo(() => {
    const index = new Map();
    for (const part of parts || []) index.set(normalizePartNumber(part.pn), part);
    return index;
  }, [parts]);

  if (!diagramSet?.pages?.length) return null;

  const page = diagramSet.pages[pageIndex];
  const catalogParts = page.partNumbers
    .map((partNumber) => partByNumber.get(normalizePartNumber(partNumber)))
    .filter(Boolean)
    .filter((part, index, list) => list.findIndex((candidate) => candidate.pn === part.pn) === index);

  const findPart = (event) => {
    event.preventDefault();
    const query = partQuery.trim();
    if (!query) return;
    const occurrence = diagramPageForMachinePart(machine, query);
    if (!occurrence) {
      setLookupMessage(`Part #${query} was not found in this manual.`);
      return;
    }
    const nextIndex = diagramSet.pages.findIndex((candidate) => candidate.page === occurrence.page);
    if (nextIndex >= 0) setPageIndex(nextIndex);
    setLookupMessage(`Part #${query} is shown on manual page ${occurrence.page}.`);
  };

  const changePage = (nextIndex) => {
    setPageIndex(nextIndex);
    setLookupMessage("");
    setZoom(1);
  };

  return (
    <section className="diagram-browser" aria-label={`Parts diagrams for ${machine}`}>
      <div className="diagram-browser__intro">
        <div>
          <h3>Illustrated parts manual</h3>
          <p>{diagramSet.pages.length} exploded-view pages from {diagramSet.title}</p>
        </div>
        <span className="diagram-browser__source">Manual</span>
      </div>

      <form className="diagram-browser__search" onSubmit={findPart}>
        <label htmlFor="diagram-part-number">Jump to a part number</label>
        <div>
          <input
            id="diagram-part-number"
            value={partQuery}
            onChange={(event) => { setPartQuery(event.target.value); setLookupMessage(""); }}
            placeholder="e.g. 316208"
            autoCapitalize="characters"
            autoCorrect="off"
          />
          <button type="submit">Find</button>
        </div>
        {lookupMessage && <p className="diagram-browser__message" role="status">{lookupMessage}</p>}
      </form>

      <div className="diagram-browser__toolbar">
        <button
          type="button"
          aria-label="Previous diagram page"
          disabled={pageIndex === 0}
          onClick={() => changePage(pageIndex - 1)}
        >
          ‹
        </button>
        <label>
          <span className="sr-only">Diagram page</span>
          <select value={pageIndex} onChange={(event) => changePage(Number(event.target.value))}>
            {diagramSet.pages.map((candidate, index) => (
              <option key={candidate.page} value={index}>Manual page {candidate.page}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          aria-label="Next diagram page"
          disabled={pageIndex === diagramSet.pages.length - 1}
          onClick={() => changePage(pageIndex + 1)}
        >
          ›
        </button>
      </div>

      <div className="diagram-browser__canvas">
        <div className="diagram-browser__zoom-controls" role="group" aria-label="Diagram zoom controls">
          <button type="button" onClick={() => setZoom((value) => Math.max(1, value - 0.5))} disabled={zoom === 1} aria-label="Zoom out">−</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom((value) => Math.min(3, value + 0.5))} disabled={zoom === 3} aria-label="Zoom in">+</button>
        </div>
        <div className="diagram-browser__image-scroll">
          <img
            src={page.img}
            alt={`${machine} exploded parts diagram, manual page ${page.page}`}
            loading="eager"
            style={{ width: `${zoom * 100}%` }}
          />
        </div>
      </div>

      <div className="diagram-browser__page-meta">
        <strong>Manual page {page.page}</strong>
        <span>{page.partNumbers.length} part number{page.partNumbers.length === 1 ? "" : "s"} indexed</span>
      </div>

      {catalogParts.length > 0 ? (
        <div className="diagram-browser__parts">
          <h4>Catalogued parts on this page</h4>
          {catalogParts.map((part) => (
            <button type="button" key={part.pn} onClick={() => onPartSelect(part.pn)}>
              <span aria-hidden="true">{part.ic || "🧩"}</span>
              <span>
                <strong>{part.name}</strong>
                <small>Part #{part.pn}{part.fit?.position ? ` · ${part.fit.position}` : ""}</small>
              </span>
              <span aria-hidden="true">›</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="diagram-browser__empty">
          Use the numbered callouts and printed parts list on the diagram. No linked catalog records are available for this page yet.
        </p>
      )}
    </section>
  );
}
