const MistOverlay = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
    <div
      className="absolute inset-0 animate-mist-drift"
      style={{
        background:
          "radial-gradient(ellipse at 30% 40%, hsl(190, 70%, 50%, 0.10) 0%, transparent 55%), radial-gradient(ellipse at 70% 70%, hsl(270, 70%, 50%, 0.12) 0%, transparent 55%)",
      }}
    />
    <div
      className="absolute inset-0 animate-mist-drift"
      style={{
        animationDelay: "6s",
        animationDirection: "reverse",
        background:
          "radial-gradient(ellipse at 60% 20%, hsl(43, 70%, 45%, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, hsl(215, 70%, 30%, 0.18) 0%, transparent 60%)",
      }}
    />
  </div>
);

export default MistOverlay;
