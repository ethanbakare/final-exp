import React from 'react';
import MadeForHumansLayout from '@/projects/madeforhumans/components/MadeForHumansLayout';

export default function MadeForHumansPage() {
  return (
    <>
      <MadeForHumansLayout />
      <style jsx global>{`
        body, html {
          margin: 0;
          padding: 0;
          background-color: #F5F5F3;
        }
      `}</style>
    </>
  );
}
