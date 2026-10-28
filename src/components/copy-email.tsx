"use client";

import { useEffect, useState } from "react";

export function CopyEmail({ email, copy, copied }: { email: string; copy: string; copied: string }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => setDone(false), 2000);
    return () => clearTimeout(id);
  }, [done]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setDone(true);
    } catch {}
  };

  return (
    <button type="button" className="copy-btn" onClick={onCopy} data-done={done ? "" : undefined}>
      <span className="swap">
        <span data-hidden={done ? "" : undefined}>{copy}</span>
        <span data-hidden={done ? undefined : ""}>{copied}</span>
      </span>
      <span className="sr-only" role="status">
        {done ? copied : ""}
      </span>
    </button>
  );
}
