import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export default function Home() {
  return ( <Page /> )
}

async function Page() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: todos, error } = await supabase.from('todos').select('*');

  if (error) {
    console.error("Error fetching todos:", error);
    return <div>Errore nel caricamento dei todo.</div>;
  }

  return (
    <div>
      <h1>Todo List</h1>
      <ul>
        {todos?.map((todo: any) => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
    </div>
  );
}
