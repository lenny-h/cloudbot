export function FormSuccess({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="rounded bg-green-100 px-3 py-2 text-sm text-green-800">
      {message}
    </div>
  );
}

export function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="rounded bg-red-100 px-3 py-2 text-sm text-red-800">
      {message}
    </div>
  );
}
