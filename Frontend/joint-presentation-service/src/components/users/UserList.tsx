import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types/api';
import { useSignalR } from '../../hooks/useSignalR';
import apiService from '../../services/api';
import UserCard from './UserCard';
import UserListHeader from './UserListHeader';
import EmptyUsersState from './EmptyUsersState';
import LoadingUsersState from './LoadingUsersState';

interface UserListProps {
  presentationId: number;
  currentUserId?: number;
  canManageRoles: boolean;
}

interface ConnectedUser {
  userId: number;
  nickname: string;
  canEdit: boolean;
  isOnline: boolean;
}

const UserList: React.FC<UserListProps> = ({
  presentationId,
  currentUserId,
  canManageRoles
}) => {
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [editors, setEditors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    grantEditorRights,
    removeEditorRights,
    onUserJoinedPresentation,
    onUserLeftPresentation,
    onConnectedUsersUpdated,
    onEditorGranted,
    onEditorRemoved,
    onUserUpdateRights
  } = useSignalR();

  const loadEditors = useCallback(async () => {
    try {
      setLoading(true);
      const editorsData = await apiService.getPresentationEditors(presentationId);
      setEditors(editorsData);
    } catch (error) {
      console.error('Failed to load editors:', error);
    } finally {
      setLoading(false);
    }
  }, [presentationId]);

  useEffect(() => {
    loadEditors();
  }, [loadEditors]);

  useEffect(() => {
    onUserJoinedPresentation((data) => {
      setConnectedUsers(prev => {
        const exists = prev.find(user => user.userId === data.userId);
        if (exists) {
          return prev.map(user => 
            user.userId === data.userId 
              ? { ...user, canEdit: data.canEdit, isOnline: true }
              : user
          );
        }
        return [...prev, {
          userId: data.userId,
          nickname: data.nickname,
          canEdit: data.canEdit,
          isOnline: true
        }];
      });
    });
  }, [onUserJoinedPresentation]);

  useEffect(() => {
    onUserLeftPresentation((data: any) => {
      setConnectedUsers(prev => 
        prev.map(user =>
          user.userId === data.userId
            ? { ...user, isOnline: false }
            : user
        )
      );
    });
  }, [onUserLeftPresentation]);

  useEffect(() => {
    onConnectedUsersUpdated((data) => {
      const users = data.joinedUsers.map(user => ({
        userId: user.userId,
        nickname: user.nickname,
        canEdit: user.canEdit,
        isOnline: true
      }));
      setConnectedUsers(users);
    });
  }, [onConnectedUsersUpdated]);

  useEffect(() => {
    onEditorGranted((data) => {
      if (data.presentationId === presentationId) {
        setEditors(prev => {
          const exists = prev.find(editor => editor.id === data.userId);
          if (!exists) {
            return [...prev, {
              id: data.userId,
              nickname: data.nickname,
              createdAt: new Date().toISOString()
            }];
          }
          return prev;
        });
      }
    });
  }, [onEditorGranted, presentationId]);

  useEffect(() => {
    onEditorRemoved((data) => {
      if (data.presentationId === presentationId) {
        setEditors(prev => prev.filter(editor => editor.id !== data.userId));
      }
    });
  }, [onEditorRemoved, presentationId]);

  useEffect(() => {
    onUserUpdateRights((data) => {
      if (data.presentationId === presentationId) {
        setConnectedUsers(prev => 
          prev.map(user =>
            user.userId === data.userId
              ? { ...user, canEdit: data.canEdit }
              : user
          )
        );
      }
    });
  }, [onUserUpdateRights, presentationId]);

  const handleGrantEditor = async (presentationId: number, userId: number) => {
    if (!canManageRoles) return;
    
    try {
      await grantEditorRights(presentationId, userId);
    } catch (error) {
      console.error('Failed to grant editor rights:', error);
      throw error;
    }
  };

  const handleRemoveEditor = async (presentationId: number, userId: number) => {
    if (!canManageRoles) return;
    
    try {
      await removeEditorRights(presentationId, userId);
    } catch (error) {
      console.error('Failed to remove editor rights:', error);
      throw error;
    }
  };

  const allUsers = [
    ...connectedUsers.filter(u => u.isOnline),
    ...editors.filter(editor => 
      !connectedUsers.some(u => u.userId === editor.id && u.isOnline)
    ).map(editor => ({
      userId: editor.id,
      nickname: editor.nickname,
      canEdit: true,
      isOnline: false
    }))
  ];

  const uniqueUsers = allUsers.reduce((acc, user) => {
    const existing = acc.find(u => u.userId === user.userId);
    if (!existing) {
      acc.push(user);
    } else {
      existing.canEdit = user.canEdit || existing.canEdit;
      existing.isOnline = user.isOnline || existing.isOnline;
    }
    return acc;
  }, [] as ConnectedUser[]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <UserListHeader 
        totalUsers={uniqueUsers.length}
        onlineUsers={connectedUsers.filter(u => u.isOnline).length}
      />

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <LoadingUsersState />
        ) : uniqueUsers.length === 0 ? (
          <EmptyUsersState />
        ) : (
          <div className="space-y-3">
            {uniqueUsers.map((user) => (
              <UserCard
                key={user.userId}
                user={user}
                isCurrentUser={user.userId === currentUserId}
                canManageRoles={canManageRoles}
                presentationId={presentationId}
                onGrantEditor={handleGrantEditor}
                onRemoveEditor={handleRemoveEditor}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;