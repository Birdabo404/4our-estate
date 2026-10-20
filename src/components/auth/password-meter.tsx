const RULES = [
  { id: "length", label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { id: "case", label: "Upper and lower case", test: (value: string) => /[a-z]/.test(value) && /[A-Z]/.test(value) },
  { id: "number", label: "A number", test: (value: string) => /\d/.test(value) },
] as const;

export function PasswordMeter({ password }: { password: string }) {
  const met = RULES.filter((rule) => rule.test(password)).length;
  const label = password.length === 0 ? "Password guidance" : met >= 3 ? "Strong password" : met === 2 ? "Fair password" : "Short password";
  return (
    <div className="mt-3" aria-live="polite">
      <p className="text-small text-ink-muted">{label}</p>
      <ul className="mt-2 flex flex-col gap-1">
        {RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <li key={rule.id} className="flex items-center gap-2 text-small text-ink-soft">
              <span aria-hidden className={ok ? "size-1.5 rounded-full bg-accent" : "size-1.5 rounded-full bg-ink/20"} />
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
