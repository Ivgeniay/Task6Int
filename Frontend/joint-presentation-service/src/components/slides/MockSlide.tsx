import React from 'react';

interface MockSlideProps {
  text: string;
  className?: string;
}

const MockSlide: React.FC<MockSlideProps> = ({ text, className = "" }) => {
  return (
    <div className={`aspect-video bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center ${className}`}>
      <div className="text-center">
        <svg className="w-6 h-6 mx-auto text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <p className="text-xs text-gray-500">
          {text}
        </p>
      </div>
    </div>
  );
};

export default MockSlide;