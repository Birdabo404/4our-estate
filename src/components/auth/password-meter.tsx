const RULES = [
  { id: "length", label: "8 to 72 characters", test: (value: string) => value.length >= 8 && value.length <= 72 },
  { id: "letter", label: "A letter", test: (value: string) => /[A-Za-z]/.test(value) },
  { id: "number", label: "A number", test: (value: string) => /\d/.test(value) },
] as const;

export function PasswordMeter({ password }: { password: string }) {
  const met = RULES.filter((rule) => rule.test(password)).length;
  const label = password.length === 0 ? "Use 8 to 72 characters, including a letter and a number." : met >= 3 ? "Strong password." : met === 2 ? "Fair password." : "Short password.";
  return (
    <div className="-mt-3" aria-live="polite">
      <p className="text-small text-ink-muted">{label}</p>
      <div className="mt-2 flex gap-1.5" aria-hidden>
        {RULES.map((rule) => (
          <span key={rule.id} className={rule.test(password) ? "h-px flex-1 bg-accent" : "h-px flex-1 bg-ink/15"} />
        ))}
      </div>
      <ul className="sr-only">
        {RULES.map((rule) => (
          <li key={rule.id}>{rule.test(password) ? "Met" : "Not yet"}: {rule.label}</li>
        ))}
      </ul>
    </div>
  );
}
