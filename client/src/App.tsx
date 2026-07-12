import { useEffect, useState } from 'react';

/**
 * Placeholder root component for the foundation step.
 * Real routing, layout, theme provider and pages are added module by module
 * (starting with Authentication). This just confirms the toolchain works and
 * shows the dark-mode token wiring is correct.
 */
export default function App() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm text-card-foreground">
        <h1 className="text-2xl font-bold text-primary">Shop Management System</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Foundation is ready. Modules (Auth, Dashboard, Products, Purchases, Sales…) are added
          one at a time.
        </p>
        <button
          onClick={() => setDark((d) => !d)}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Toggle {dark ? 'Light' : 'Dark'} Mode
        </button>
      </div>
    </div>
  );
}
