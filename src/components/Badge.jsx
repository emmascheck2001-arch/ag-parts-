export function Badge({ text, type = "default" }) {
  const classes = {
    default: "",
    success: "vfit",
    warning: "vfit",
    danger: "",
  };
  
  return <span className={classes[type] || ""}>{text}</span>;
}

export function VerifiedFit() {
  return <span className="vfit">✓ VERIFIED FIT</span>;
}
