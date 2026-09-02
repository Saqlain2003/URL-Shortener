/**
 * CSS-based rotating flame arc overlays.
 * Three circular arcs spin at different speeds/directions
 * to simulate Tanjiro's sword slash trails.
 */
export default function FlameArcs() {
  return (
    <div className="flame-arcs-container">
      <div className="flame-arc flame-arc-1" />
      <div className="flame-arc flame-arc-2" />
      <div className="flame-arc flame-arc-3" />
    </div>
  );
}
