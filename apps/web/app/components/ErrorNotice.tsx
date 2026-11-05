import type { ReactNode } from "react";

// Shared error notice, Phase 2 increment 21.
// Every user-facing error uses the same shape: a short plain error
// and one concrete solution. Pages pass an object with error and
// solution, or a plain string for an error whose solution is given
// separately. Nothing here shows a bare error string on its own.

export default function ErrorNotice({
  title,
  message,
  solution,
  children
}: {
  title?: string;
  message: string;
  solution?: string;
  children?: ReactNode;
}) {
  return (
    <div className="notice" role="alert">
      {title && <p className="font-semibold">{title}</p>}
      <p className={title ? "mt-1" : ""}>{message}</p>
      {solution && <p className="mt-1">What to do: {solution}</p>}
      {children}
    </div>
  );
}
