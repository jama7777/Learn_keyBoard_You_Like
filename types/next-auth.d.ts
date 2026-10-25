// This file must be a module (the top-level import is what makes it one) or
// TypeScript treats `declare module 'next-auth'` below as a brand-new ambient
// module that shadows the real package types instead of augmenting them.
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
