import React from 'react';
import PresentationList from '../components/presentation/PresentationList';

interface HomePageProps {
  currentUserId?: number;
}

const HomePage: React.FC<HomePageProps> = ({ currentUserId }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PresentationList currentUserId={currentUserId} />
    </div>
  );
};

export default HomePage;