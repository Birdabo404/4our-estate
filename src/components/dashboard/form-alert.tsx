export function FormAlert({ message }: { message?: string }) {
  return (
    <div aria-live="polite">
      {message ? <p className="text-small text-danger">{message}</p> : null}
    </div>
  );
}
