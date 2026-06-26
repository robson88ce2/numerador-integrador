export function Loader() {
  return (
    <div className="loader-wrapper" role="status" aria-live="polite">
      <div className="loader-spinner" />
      <span className="loader-label">Carregando...</span>
    </div>
  );
}
