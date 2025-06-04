import React from 'react';

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
  onGrantEditor: (userId: number) => void;
  onRemoveEditor: (userId: number) => void;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  isCurrentUser,
  canManageRoles,
  onGrantEditor,
  onRemoveEditor
}) => {
  const status = user.isOnline ? 'online' : 'offline';
  const role = user.canEdit ? 'Editor' : 'Viewer';

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
                onClick={() => onRemoveEditor(user.userId)}
                className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Remove editor rights"
              >
                Remove
              </button>
            ) : (
              <button
                onClick={() => onGrantEditor(user.userId)}
                className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Grant editor rights"
              >
                Make Editor
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserCard;