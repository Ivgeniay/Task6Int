import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Presentation, Slide } from '../../types/api';
import apiService from '../../services/api';
import SlidePreviewThumbnail from '../slides/SlidePreviewThumbnail';

interface PresentationTableProps {
  presentations: Presentation[];
  currentUserId?: number;
  onDeletePresentation: (presentationId: number) => void;
}

type SortField = 'title' | 'creator' | 'createdAt' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

const PresentationTable: React.FC<PresentationTableProps> = ({
  presentations,
  currentUserId,
  onDeletePresentation
}) => {
  const navigate = useNavigate();
  const expandedSlideDataRef = useRef<Map<number, Slide>>(new Map());
  
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [loadingSlides, setLoadingSlides] = useState<Set<number>>(new Set());

  const getUserRole = (presentation: Presentation, currentUserId?: number) => {
    if (!currentUserId) return 'Viewer';
    if (presentation.creatorId === currentUserId) return 'Creator';
    if (presentation.editorUsers?.some(editor => editor.userId === currentUserId)) return 'Editor';
    return 'Viewer';
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleOpenPresentation = (presentationId: number) => {
    navigate(`/presentation/${presentationId}`);
  };

  const toggleRowExpansion = async (presentationId: number) => {
    if (expandedRow === presentationId) {
      setExpandedRow(null);
      return;
    }

    setExpandedRow(presentationId);

    if (!expandedSlideDataRef.current.has(presentationId) && !loadingSlides.has(presentationId)) {
      const presentation = presentations.find(p => p.id === presentationId);
      if (presentation && presentation.slides && presentation.slides.length > 0) {
        setLoadingSlides(prev => new Set(prev).add(presentationId));
        
        try {
          const firstSlide = await apiService.getSlide(presentation.slides[0].id);
          expandedSlideDataRef.current.set(presentationId, firstSlide);
          setLoadingSlides(prev => {
            const newSet = new Set(prev);
            newSet.delete(presentationId);
            return newSet;
          });
        } catch (error) {
          console.error('Failed to load slide:', error);
          setLoadingSlides(prev => {
            const newSet = new Set(prev);
            newSet.delete(presentationId);
            return newSet;
          });
        }
      }
    }
  };

  const sortedPresentations = [...presentations].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'creator') {
      aValue = a.creator?.nickname || '';
      bValue = b.creator?.nickname || '';
    }

    if (sortField === 'createdAt' || sortField === 'updatedAt') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const roleStyles = {
    Creator: 'bg-blue-100 text-blue-800',
    Editor: 'bg-green-100 text-green-800',
    Viewer: 'bg-gray-100 text-gray-800'
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      );
    }
    
    if (sortDirection === 'asc') {
      return (
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      );
    }
  };

  if (presentations.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No presentations</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new presentation.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('title')}
            >
              <div className="flex items-center space-x-1">
                <span>Title</span>
                {getSortIcon('title')}
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('creator')}
            >
              <div className="flex items-center space-x-1">
                <span>Creator</span>
                {getSortIcon('creator')}
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('createdAt')}
            >
              <div className="flex items-center space-x-1">
                <span>Created</span>
                {getSortIcon('createdAt')}
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('updatedAt')}
            >
              <div className="flex items-center space-x-1">
                <span>Updated</span>
                {getSortIcon('updatedAt')}
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedPresentations.map((presentation) => {
            const userRole = getUserRole(presentation, currentUserId);
            const isExpanded = expandedRow === presentation.id;
            const slide = expandedSlideDataRef.current.get(presentation.id);
            const isLoading = loadingSlides.has(presentation.id);
            
            return (
              <React.Fragment key={presentation.id}>
                <tr 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleRowExpansion(presentation.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {presentation.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {presentation.creator?.nickname || `User ${presentation.creatorId}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(presentation.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(presentation.updatedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleStyles[userRole]}`}>
                      {userRole}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPresentation(presentation.id);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Open
                      </button>
                    </div>
                  </td>
                </tr>
                
                {isExpanded && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 bg-gray-50">
                      <div className="space-y-3">
                        <div className="flex items-start space-x-6">
                          <div className="flex-shrink-0">
                            <SlidePreviewThumbnail
                              slide={slide}
                              width={200}
                              height={150}
                              showPlaceholder={true}
                              placeholderText={isLoading ? "Loading..." : `${presentation.slides?.length || 0} slides`}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex-col items-center space-y-4 mb-3">
                              <div className="flex items-center text-sm text-gray-500">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                {presentation.slides?.length || 0} slides
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Last updated {formatDate(presentation.updatedAt)}
                              </div>
                            </div>
                            
                            {userRole === 'Creator' && (
                              <div className="flex items-end">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm('Are you sure you want to delete this presentation? This action cannot be undone.')) {
                                      onDeletePresentation(presentation.id);
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PresentationTable;