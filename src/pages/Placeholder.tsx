
// src/pages/Placeholder.tsx
type Props = { title: string };

export default function Placeholder({ title }: Props) {
  return (
    <div className="bg-white border rounded p-6">
      <h1 className="text-xl font-semibold text-blue-900">{title}</h1>
      <p className="mt-2 text-sm text-neutral-700">
        This section is a placeholder. We’ll hook this up to the real subpages and workflows next.
      </p>
    </div>
  );
}
