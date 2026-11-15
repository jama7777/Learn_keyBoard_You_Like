import { Providers } from '@/components/Providers';
import TypingApp from '@/TypingApp';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <Providers>
      <TypingApp />
    </Providers>
  );
}
