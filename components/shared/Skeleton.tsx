import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "", variant = "rectangular" }) => {
  const baseClasses = "animate-pulse bg-gray-200 dark:bg-gray-800";
  const roundedClasses = variant === 'circular' ? 'rounded-full' : variant === 'text' ? 'rounded' : 'rounded-xl';
  
  return (
    <div className={`${baseClasses} ${roundedClasses} ${className}`} />
  );
};

export const PostSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-[#121212] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
    <div className="flex justify-between items-start mb-3">
      <div className="flex items-center space-x-3 w-full">
        <Skeleton variant="rectangular" className="w-10 h-10" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-3/4 h-4" />
          <Skeleton variant="text" className="w-1/2 h-3" />
        </div>
      </div>
    </div>
    <div className="space-y-2 mb-4">
      <Skeleton variant="text" className="w-full h-3" />
      <Skeleton variant="text" className="w-full h-3" />
      <Skeleton variant="text" className="w-2/3 h-3" />
    </div>
    <div className="flex justify-between pt-3 border-t border-gray-50 dark:border-gray-800">
      <div className="flex space-x-2">
        <Skeleton variant="rectangular" className="w-8 h-6" />
        <Skeleton variant="rectangular" className="w-8 h-6" />
      </div>
      <Skeleton variant="rectangular" className="w-16 h-6" />
    </div>
  </div>
);
