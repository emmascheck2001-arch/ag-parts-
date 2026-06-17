export function TopBar({ title, onBack, right, variant = "" }) {
  return (
    <div className={"topbar " + variant}>
      {onBack ? (
        <button className="back" onClick={onBack}>‹</button>
      ) : (
        <span className="spacer" />
      )}
      <h1>{title}</h1>
      {right ? <span className="ic-r">{right}</span> : <span className="spacer" />}
    </div>
  );
}
