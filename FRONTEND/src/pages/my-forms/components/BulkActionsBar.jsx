import React from 'react';
import Button from '../../../components/ui/Button';

const BulkActionsBar = ({ selectedCount, onExport, onArchive, onShare, onDelete, onClearSelection, busy = false }) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-100 w-[calc(100%-2rem)] max-w-4xl">
      <div className="bg-primary text-primary-foreground rounded-md shadow-elevation-5 p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center">
              <span className="font-semibold text-sm">{selectedCount}</span>
            </div>
            <span className="font-medium text-sm lg:text-base">
              {selectedCount} form{selectedCount !== 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <Button
              variant="secondary"
              size="sm"
              onClick={onExport}
              disabled={busy}
              iconName="Download"
              iconPosition="left"
              iconSize={16}
              className="flex-1 lg:flex-initial"
            >
              Export
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onArchive}
              disabled={busy}
              iconName="Archive"
              iconPosition="left"
              iconSize={16}
              className="flex-1 lg:flex-initial"
            >
              Archive
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onShare}
              disabled={busy}
              iconName="Share2"
              iconPosition="left"
              iconSize={16}
              className="flex-1 lg:flex-initial"
            >
              Share
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={busy}
              iconName="Trash2"
              iconPosition="left"
              iconSize={16}
              className="flex-1 lg:flex-initial"
            >
              Delete
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearSelection}
              disabled={busy}
              iconName="X"
              iconSize={18}
              className="text-primary-foreground hover:bg-primary-foreground/20"
              aria-label="Clear selection"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsBar;