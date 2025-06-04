import React from 'react';

interface UserListHeaderProps {
  totalUsers: number;
  onlineUsers: number;
}

const UserListHeader: React.FC<UserListHeaderProps> = ({
  totalUsers,
  onlineUsers
}) => {
  return (
    <div className="p-4 border-b bg-white">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">
        Participants ({totalUsers})
      </h3>
      <div className="text-xs text-gray-500">
        {onlineUsers} online
      </div>
    </div>
  );
};

export default UserListHeader;