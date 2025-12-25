import React from 'react';
import Select from '../../../components/ui/Select';

const FormParameters = ({ parameters, onChange, disabled }) => {
  const formTypeOptions = [
    { value: 'survey', label: 'Survey', description: 'Collect opinions and feedback' },
    { value: 'quiz', label: 'Quiz', description: 'Test knowledge with scoring' },
    { value: 'feedback', label: 'Feedback', description: 'Gather user feedback' },
    { value: 'registration', label: 'Registration', description: 'Collect participant information' }
  ];

  const audienceOptions = [
    { value: 'students', label: 'Students', description: 'Educational learners' },
    { value: 'staff', label: 'Staff', description: 'Organization employees' },
    { value: 'public', label: 'Public', description: 'General audience' }
  ];

  const languageOptions = [
    { value: 'english', label: 'English', description: 'English language' },
    { value: 'tamil', label: 'Tamil', description: 'தமிழ் மொழி' },
    { value: 'hindi', label: 'Hindi', description: 'हिंदी भाषा' }
  ];

  const toneOptions = [
    { value: 'formal', label: 'Formal', description: 'Professional and official' },
    { value: 'academic', label: 'Academic', description: 'Educational and scholarly' },
    { value: 'casual', label: 'Casual', description: 'Friendly and conversational' }
  ];

  const handleChange = (field, value) => {
    onChange({ ...parameters, [field]: value });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 lg:gap-6">
      <Select
        label="Form Type"
        description="Select the type of form you want to create"
        options={formTypeOptions}
        value={parameters?.formType}
        onChange={(value) => handleChange('formType', value)}
        disabled={disabled}
        required
      />
      <Select
        label="Target Audience"
        description="Choose who will use this form"
        options={audienceOptions}
        value={parameters?.audience}
        onChange={(value) => handleChange('audience', value)}
        disabled={disabled}
        required
      />
      <Select
        label="Language"
        description="Select the form language"
        options={languageOptions}
        value={parameters?.language}
        onChange={(value) => handleChange('language', value)}
        disabled={disabled}
        required
      />
      <Select
        label="Tone"
        description="Choose the communication style"
        options={toneOptions}
        value={parameters?.tone}
        onChange={(value) => handleChange('tone', value)}
        disabled={disabled}
        required
      />
    </div>
  );
};

export default FormParameters;