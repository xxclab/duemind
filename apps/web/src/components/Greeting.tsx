export function Greeting({ name }: { name?: string | null }) {
  const hour = new Date().getHours();
  let greeting: string;

  if (hour < 12) greeting = 'Good morning';
  else if (hour < 18) greeting = 'Good afternoon';
  else greeting = 'Good evening';

  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-gray-900">
        {greeting}{name ? `, ${name}` : ''}
      </h1>
      <p className="mt-1 text-sm text-gray-500">Never forget what needs attention.</p>
    </div>
  );
}
