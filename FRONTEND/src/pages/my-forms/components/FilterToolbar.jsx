import React from 'react';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const FilterToolbar = ({ 
  filters, 
  onFilterChange, 
  onClearFilters, 
  resultCount,
  searchQuery,
  onSearchChange 
}) => {
  const formTypeOptions = [
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

  const languageOptions = [
    { value: 'all', label: 'All Languages' },
    { value: 'English', label: 'English' },
    { value: 'Tamil', label: 'Tamil' },
    { value: 'Hindi', label: 'Hindi' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'Active', label: 'Active' },
    { value: 'Draft', label: 'Draft' },
    { value: 'Archived', label: 'Archived' }
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' }
  ];

  const hasActiveFilters = 
    filters?.type !== 'all' || 
    filters?.audience !== 'all' || 
    filters?.language !== 'all' || 
    filters?.status !== 'all' || 
    filters?.dateRange !== 'all' ||
    searchQuery?.trim() !== '';

  return (
    <div className="bg-card rounded-md shadow-elevation-2 border border-border p-4 lg:p-6 mb-4 lg:mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <h2 className="font-heading text-lg lg:text-xl font-semibold text-foreground">Filter Forms</h2>
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            iconName="X"
            iconPosition="left"
            iconSize={16}
          >
            Clear Filters
          </Button>
        )}
      </div>
      <div className="mb-4">
        <Input
          type="search"
          placeholder="Search forms by title or description..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e?.target?.value)}
          className="w-full"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Select
          label="Form Type"
          options={formTypeOptions}
          value={filters?.type}
          onChange={(value) => onFilterChange('type', value)}
        />
        <Select
          label="Audience"
          options={audienceOptions}
          value={filters?.audience}
          onChange={(value) => onFilterChange('audience', value)}
        />
        <Select
          label="Language"
          options={languageOptions}
          value={filters?.language}
          onChange={(value) => onFilterChange('language', value)}
        />
        <Select
          label="Status"
          options={statusOptions}
          value={filters?.status}
          onChange={(value) => onFilterChange('status', value)}
        />
        <Select
          label="Date Range"
          options={dateRangeOptions}
          value={filters?.dateRange}
          onChange={(value) => onFilterChange('dateRange', value)}
        />
      </div>
      {resultCount !== null && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{resultCount}</span> form{resultCount !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

export default FilterToolbar;