function PageLoader() {
  return (
    <div
      className="loading-spinner"
      style={{ minHeight: '50vh' }}
      role="status"
      aria-label="Loading"
    >
      <div className="spinner spinner-lg" />
    </div>
  );
}

export default PageLoader;
