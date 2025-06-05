import React, { useState } from 'react';

interface ConnectedUser {
  userId: number;
  nickname: string;
  canEdit: boolean;
  isOnline: boolean;
}

interface UserCardProps {
  user: ConnectedUser;
  isCurrentUser: boolean;
  canManageRoles: boolean;
  presentationId: number;
  onGrantEditor: (presentationId: number, userId: number) => Promise<void>;
  onRemoveEditor: (presentationId: number, userId: number) => Promise<void>;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  isCurrentUser,
  canManageRoles,
  presentationId,
  onGrantEditor,
  onRemoveEditor
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const status = user.isOnline ? 'online' : 'offline';
  const role = user.canEdit ? 'Editor' : 'Viewer';

  const handleGrantEditor = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      await onGrantEditor(presentationId, user.userId);
    } catch (error) {
      console.error('Failed to grant editor rights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveEditor = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      await onRemoveEditor(presentationId, user.userId);
    } catch (error) {
      console.error('Failed to remove editor rights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-3 shadow-sm border">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user.nickname.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
              status === 'online' ? 'bg-green-500' : 'bg-gray-400'
            }`}></div>
          </div>
          
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">
                {user.nickname}
                {isCurrentUser && (
                  <span className="text-xs text-gray-500 ml-1">(You)</span>
                )}
              </span>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`text-xs px-2 py-1 rounded-full ${
                user.canEdit 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {role}
              </span>
              <span className={`text-xs ${
                status === 'online' ? 'text-green-600' : 'text-gray-500'
              }`}>
                {status}
              </span>
            </div>
          </div>
        </div>

        {canManageRoles && !isCurrentUser && (
          <div className="flex items-center space-x-1">
            {user.canEdit ? (
              <button
                onClick={handleRemoveEditor}
                disabled={isLoading}
                className={`text-xs px-3 py-1 rounded-md font-medium transition-all duration-200 ${
                  isLoading
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                }`}
                title="Remove editor rights"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Removing...
                  </span>
                ) : (
                  'Remove'
                )}
              </button>
            ) : (
              <button
                onClick={handleGrantEditor}
                disabled={isLoading}
                className={`text-xs px-3 py-1 rounded-md font-medium transition-all duration-200 ${
                  isLoading
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
                }`}
                title="Grant editor rights"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Granting...
                  </span>
                ) : (
                  'Make Editor'
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserCard;