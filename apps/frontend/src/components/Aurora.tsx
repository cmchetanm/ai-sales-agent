export function Aurora() {
  return (
    <div className="aurora" aria-hidden>
      <div className="orb orb--a" style={{ top: '-15%', left: '-10%' }} />
      <div className="orb orb--b" style={{ top: '10%', right: '-15%' }} />
      <div className="orb orb--c" style={{ bottom: '-10%', left: '20%' }} />
    </div>
  );
}

// For test coverage: render a minimal snapshot-friendly string
export function AuroraTestProbe() {
  return <span data-testid="aurora-probe">aurora</span>;
}
