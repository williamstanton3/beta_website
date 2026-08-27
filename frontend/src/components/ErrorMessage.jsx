/**
 * Reusable error message for failed API requests.
 */

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-container" role="alert">
      <p className="error-text">{message}</p>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}
