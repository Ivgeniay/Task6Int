import React, { useState, useEffect } from 'react';
import { Presentation } from '../../types/api';
import { useSignalR } from '../../hooks/useSignalR';
import apiService from '../../services/api';

interface PresentationListProps {
  currentUserId?: number;
}

const PresentationList: React.FC<PresentationListProps> = ({ currentUserId }) => {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const {
    createPresentation,
    onPresentationCreated,
    onPresentationDeleted,
    onError
  } = useSignalR();

  useEffect(() => {
    loadPresentations();
  }, []);

  useEffect(() => {
    onPresentationCreated((data) => {
      setPresentations(prev => [...prev, data.presentation]);
    });
  }, [onPresentationCreated]);

  useEffect(() => {
    onPresentationDeleted((data) => {
      setPresentations(prev => prev.filter(p => p.id !== data.presentationId));
    });
  }, [onPresentationDeleted]);

  useEffect(() => {
    onError((data) => {
      setError(data.message);
    });
  }, [onError]);

  const loadPresentations = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiService.getPresentations();
      setPresentations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load presentations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePresentation = async () => {
    const title = prompt('Enter presentation title:');
    if (!title || !title.trim()) {
      return;
    }

    try {
      setError('');
      await createPresentation(title.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create presentation');
    }
  };

  const handleJoinPresentation = (presentationId: number) => {
    console.log('Join presentation:', presentationId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading presentations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Presentations</h2>
        <button
          onClick={handleCreatePresentation}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Presentation
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button
            onClick={() => setError('')}
            className="float-right text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {presentations.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No presentations</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new presentation.</p>
          <div className="mt-6">
            <button
              onClick={handleCreatePresentation}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Presentation
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presentations.map((presentation) => (
            <div
              key={presentation.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {presentation.title}
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {presentation.creatorId === currentUserId ? 'Owner' : 'Shared'}
                  </span>
                </div>
                
                <p className="mt-2 text-sm text-gray-500">
                  Created {formatDate(presentation.createdAt)}
                </p>
                
                {presentation.updatedAt !== presentation.createdAt && (
                  <p className="text-sm text-gray-500">
                    Updated {formatDate(presentation.updatedAt)}
                  </p>
                )}

                <div className="mt-4 flex justify-between items-center">
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {presentation.slides?.length || 0} slides
                  </div>
                  
                  <button
                    onClick={() => handleJoinPresentation(presentation.id)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Open
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PresentationList;