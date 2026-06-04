import React from 'react';

export function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton-line w-30" />
      <div className="skeleton-line w-60" />
      <div className="skeleton-line w-80" />
    </div>
  );
}

export function SkeletonList({ count = 4 }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
