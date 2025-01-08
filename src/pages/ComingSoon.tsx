import React from 'react';

const ComingSoon: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Coming Soon</h1>
      <p className="text-lg text-gray-600">This feature is currently under development.</p>
      <p className="text-md text-gray-500 mt-2">Check back later for updates!</p>
    </div>
  );
};

export default ComingSoon;
