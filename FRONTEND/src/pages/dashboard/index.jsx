import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import FormCard from './components/FormCard';
import StatsCard from './components/StatsCard';
import EmptyState from './components/EmptyState';
import SearchFilter from './components/SearchFilter';
import { listMyForms } from '../../services/formsApi';

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedAudience, setSelectedAudience] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  const [forms, setForms] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { forms: rows } = await listMyForms();
        if (!cancelled) {
          const normalized = (rows || []).map((f) => ({
            id: f?.google_form_id,
            title: f?.title,
            type: f?.form_type,
            audience: f?.audience,
            language: f?.language,
            createdAt: f?.created_at,
            googleFormLink: f?.responder_url || f?.google_form_url
          }));
          setForms(normalized);
        }
      } catch {
        if (!cancelled) setForms([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = [
    {
      icon: "FileText",
      label: "Total Forms",
      value: forms?.length?.toString(),
      trend: "up",
      trendValue: null
    },
    {
      icon: "Clock",
      label: "Recent Forms",
      value: forms?.filter(f => {
        const formDate = new Date(f.createdAt || f.createdDate);
        const weekAgo = new Date();
        weekAgo?.setDate(weekAgo?.getDate() - 7);
        return formDate >= weekAgo;
      })?.length?.toString(),
      trend: "up",
      trendValue: null
    },
    {
      icon: "Users",
      label: "Active Audiences",
      value: new Set(forms.map(f => f.audience))?.size?.toString(),
      trend: null,
      trendValue: null
    },
    {
      icon: "Globe",
      label: "Languages Used",
      value: new Set(forms.map(f => f.language))?.size?.toString(),
      trend: null,
      trendValue: null
    }
  ];

  const filteredForms = forms?.filter(form => {
    const matchesSearch = form?.title?.toLowerCase()?.includes(searchQuery?.toLowerCase());
    const matchesType = selectedType === 'all' || form?.type === selectedType;
    const matchesAudience = selectedAudience === 'all' || form?.audience === selectedAudience;
    return matchesSearch && matchesType && matchesAudience;
  });

  const handleCopyLink = (formId) => {
    const form = forms?.find(f => f?.id === formId);
    if (form) {
      navigator.clipboard?.writeText(form?.googleFormLink);
      setCopiedId(formId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleOpenForm = (formId) => {
    const form = forms?.find(f => f?.id === formId);
    if (form) {
      window.open(form?.googleFormLink, '_blank');
    }
  };

  const handleRegenerate = (formId) => {
    navigate('/create-form', { state: { regenerateFormId: formId } });
  };

  useEffect(() => {
    if (copiedId) {
      const timer = setTimeout(() => setCopiedId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedId]);

  return (
    <>
      <Helmet>
        <title>Dashboard - AI Form Generator</title>
        <meta name="description" content="Manage your AI-generated forms efficiently with comprehensive dashboard tools and analytics" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-16">
          <div className="max-w-9xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 md:mb-8">
              <div>
                <h1 className="font-heading font-bold text-2xl md:text-3xl lg:text-4xl text-foreground mb-2">
                  Dashboard
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Manage and organize your AI-generated forms
                </p>
              </div>
              <Button
                variant="default"
                size="lg"
                iconName="Plus"
                iconPosition="left"
                onClick={() => navigate('/create-form')}
                className="w-full lg:w-auto"
              >
                Create New Form
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
              {stats?.map((stat, index) => (
                <StatsCard
                  key={index}
                  icon={stat?.icon}
                  label={stat?.label}
                  value={stat?.value}
                  trend={stat?.trend}
                  trendValue={stat?.trendValue}
                />
              ))}
            </div>

            {forms?.length > 0 && (
              <SearchFilter
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedType={selectedType}
                onTypeChange={setSelectedType}
                selectedAudience={selectedAudience}
                onAudienceChange={setSelectedAudience}
              />
            )}

            {filteredForms?.length === 0 && forms?.length > 0 ? (
              <div className="bg-card rounded-lg shadow-elevation-2 p-8 md:p-12 text-center border border-border">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="font-heading font-semibold text-lg md:text-xl text-foreground mb-2">
                  No Forms Found
                </h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            ) : filteredForms?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredForms?.map((form) => (
                  <FormCard
                    key={form?.id}
                    form={form}
                    onCopyLink={handleCopyLink}
                    onOpenForm={handleOpenForm}
                    onRegenerate={handleRegenerate}
                  />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </div>
        </main>

        {copiedId && (
          <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 bg-success text-success-foreground px-4 py-3 md:px-6 md:py-4 rounded-lg shadow-elevation-4 flex items-center gap-2 animate-slide-in z-200">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm md:text-base font-medium">Link copied to clipboard!</span>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;