/**
 * Reusable loading spinner shown while API data is being fetched.
 */

export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="loading-container" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
