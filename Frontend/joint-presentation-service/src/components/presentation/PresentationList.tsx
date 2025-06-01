import React, { useState, useEffect } from 'react';
import { Presentation } from '../../types/api';
import { useSignalR } from '../../hooks/useSignalR';
import PresentationTable from './PresentationTable';
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
    deletePresentation,
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

  const handleDeletePresentation = async (presentationId: number) => {
    if (!window.confirm('Are you sure you want to delete this presentation? This action cannot be undone.')) {
      return;
    }

    try {
      setError('');
      await deletePresentation(presentationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete presentation');
    }
  };

  const handleOpenPresentation = (presentationId: number) => {
    console.log('Open presentation:', presentationId);
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

      <PresentationTable
        presentations={presentations}
        currentUserId={currentUserId}
        onOpenPresentation={handleOpenPresentation}
        onDeletePresentation={handleDeletePresentation}
      />
    </div>
  );
};

export default PresentationList;