import React from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const SearchFilter = ({ searchQuery, onSearchChange, selectedType, onTypeChange, selectedAudience, onAudienceChange }) => {
  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'Survey', label: 'Survey' },
    { value: 'Quiz', label: 'Quiz' },
    { value: 'Feedback', label: 'Feedback' },
    { value: 'Registration', label: 'Registration' }
  ];

  const audienceOptions = [
    { value: 'all', label: 'All Audiences' },
    { value: 'Students', label: 'Students' },
    { value: 'Staff', label: 'Staff' },
    { value: 'Public', label: 'Public' }
  ];

  return (
    <div className="bg-card rounded-lg shadow-elevation-2 p-4 md:p-6 border border-border mb-6 md:mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          type="search"
          placeholder="Search forms..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e?.target?.value)}
          className="w-full"
        />
        <Select
          placeholder="Filter by type"
          options={typeOptions}
          value={selectedType}
          onChange={onTypeChange}
        />
        <Select
          placeholder="Filter by audience"
          options={audienceOptions}
          value={selectedAudience}
          onChange={onAudienceChange}
        />
      </div>
    </div>
  );
};

export default SearchFilter;