'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function KnowledgebasePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/knowledgebase/product');
  }, [router]);
  return null;
}
