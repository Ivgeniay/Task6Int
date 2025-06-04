import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './components/auth/LoginForm';
import HomePage from './pages/HomePage';
import { useSignalR } from './hooks/useSignalR';
import PresentationEditorPage from './pages/PresentationEditorPage';

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
    onUserConnected,
    onForceLogout
  } = useSignalR();

  useEffect(() => {
    onUserConnected((data) => {
      setCurrentUserId(data.userId);
    });
  }, [onUserConnected]);

  useEffect(() => {
    onError((data) => {
      setErrorMessage(data.message);
    });
  }, [onError]);

  useEffect(() => {
    onForceLogout((data) => {
      setErrorMessage(`Connection lost: ${data.reason}. Please log in again.`);
      handleLogout();
    });
  }, [onForceLogout]);

  const handleLogin = async (nickname: string) => {
    try {
      setErrorMessage('');
      
      if (!connectionState.isConnected) {
        await connect();
      }
      
      await connectUser(nickname);
      
      setCurrentUser(nickname);
      setIsLoggedIn(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Connection failed');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser('');
    setCurrentUserId(undefined);
  };

  if (!isLoggedIn) {
    return (
      <div>
        <LoginForm 
          onLogin={handleLogin}
          isConnecting={connectionState.isConnecting}
        />
        {errorMessage && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
            <div className="flex justify-between items-start">
              <span className="text-sm">{errorMessage}</span>
              <button
                onClick={() => setErrorMessage('')}
                className="ml-2 text-red-700 hover:text-red-900 text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Collaborative Presentation
              </h1>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    connectionState.isConnected ? 'bg-green-500' : 
                    connectionState.isConnecting ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm text-gray-600">
                    {connectionState.isConnected ? 'Connected' : 
                     connectionState.isConnecting ? 'Reconnecting...' : 'Disconnected'}
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

        <main>
          <Routes>
            <Route 
              path="/" 
              element={<HomePage currentUserId={currentUserId} />} 
            />
            <Route 
              path="/presentation/:id" 
              element={<PresentationEditorPage currentUserId={currentUserId} />} 
            />
            <Route 
              path="*" 
              element={<Navigate to="/" replace />} 
            />
          </Routes>
        </main>
        
        {errorMessage && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
            <div className="flex justify-between items-start">
              <span className="text-sm">{errorMessage}</span>
              <button
                onClick={() => setErrorMessage('')}
                className="ml-2 text-red-700 hover:text-red-900 text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;