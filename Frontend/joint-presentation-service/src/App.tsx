import React, { useState, useEffect } from 'react';
import LoginForm from './components/auth/LoginForm';
import PresentationList from './components/presentation/PresentationList';
import { useSignalR } from './hooks/useSignalR';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<number | undefined>();
  const [errorMessage, setErrorMessage] = useState<string>('');

  const {
    connectionState,
    connect,
    connectUser,
    onError,
    onUserConnected
  } = useSignalR();

  useEffect(() => {
    onUserConnected((data) => {
      setCurrentUserId(data.userId);
      console.log('User connected with ID:', data.userId);
    });
  }, [onUserConnected]);

  useEffect(() => {
    if (isLoggedIn && !connectionState.isConnected && !connectionState.isConnecting) {
      handleLogout();
    }
  }, [connectionState.isConnected, connectionState.isConnecting, isLoggedIn]);

  useEffect(() => {
    onError((data) => {
      setErrorMessage(data.message);
      console.error('SignalR Error:', data.message);
    });
  }, [onError]);

  const handleLogin = async (nickname: string) => {
    try {
      setErrorMessage('');
      
      if (!connectionState.isConnected) {
        await connect();
      }
      
      await connectUser(nickname);
      
      setCurrentUser(nickname);
      setIsLoggedIn(true);
      
      console.log('User connected successfully:', nickname);
    } catch (error) {
      console.error('Connection failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Connection failed');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser('');
    setCurrentUserId(undefined);
    setErrorMessage('');
    console.log('User logged out');
  };

  if (!isLoggedIn) {
    return (
      <div>
        <LoginForm 
          onLogin={handleLogin}
          isConnecting={connectionState.isConnecting}
        />
        {errorMessage && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {errorMessage}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Joint Presentation
            </h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionState.isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-600">
                  {connectionState.isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <span className="text-gray-700">
                Welcome, <strong>{currentUser}</strong>
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PresentationList currentUserId={currentUserId} />
        
        {errorMessage && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {errorMessage}
            <button
              onClick={() => setErrorMessage('')}
              className="float-right ml-2 text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;