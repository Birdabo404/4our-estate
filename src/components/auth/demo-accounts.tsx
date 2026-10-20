"use client";

const PASSWORD = "Estate!2026";

const ACCOUNTS = [
  { role: "Admin", email: "admin@4our.estate" },
  { role: "Agent", email: "isabel.santos@4our.estate" },
  { role: "Agent", email: "mateo.cruz@4our.estate" },
  { role: "Agent", email: "ana.reyes@4our.estate" },
  { role: "Agent", email: "rafael.delacruz@4our.estate" },
  { role: "Agent", email: "sofia.navarro@4our.estate" },
  { role: "Buyer", email: "camille.uy@4our.estate" },
  { role: "Buyer", email: "joaquin.tan@4our.estate" },
  { role: "Buyer", email: "bea.lim@4our.estate" },
] as const;

export function DemoAccounts({ onUse }: { onUse?: (account: { email: string; password: string }) => void }) {
  return (
    <details className="group mt-12 border-t border-ink/10 pt-6">
      <summary className="cursor-pointer list-none text-small text-ink-muted marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="underline decoration-ink/20 underline-offset-4 transition-colors duration-300 ease-settle group-open:text-ink group-hover:text-ink">
          Exploring? Use a demo account
        </span>
      </summary>
      <div className="mt-5 flex flex-col gap-4">
        <p className="text-small text-ink-soft">
          Shared password <span className="font-medium text-ink">{PASSWORD}</span>
        </p>
        <ul className="flex flex-col gap-2">
          {ACCOUNTS.map((account) => (
            <li key={account.email} className="flex items-baseline justify-between gap-4 text-small">
              <span className="text-ink-muted">{account.role}</span>
              {onUse ? (
                <button
                  type="button"
                  onClick={() => onUse({ email: account.email, password: PASSWORD })}
                  className="text-right text-ink underline decoration-ink/20 underline-offset-4 transition-colors duration-300 ease-settle hover:text-accent hover:decoration-accent"
                >
                  {account.email}
                </button>
              ) : (
                <span className="text-ink">{account.email}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
