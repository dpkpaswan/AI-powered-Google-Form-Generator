import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const EmptyState = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-16 lg:py-20 px-4">
      <div className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 bg-muted rounded-full flex items-center justify-center mb-4 md:mb-6">
        <Icon name="FileText" size={40} className="md:w-12 md:h-12 lg:w-14 lg:h-14" color="var(--color-muted-foreground)" />
      </div>
      <h3 className="font-heading font-semibold text-xl md:text-2xl lg:text-3xl text-foreground mb-2 md:mb-3 text-center">
        No Forms Yet
      </h3>
      <p className="text-sm md:text-base text-muted-foreground text-center max-w-md mb-6 md:mb-8">
        Start creating your first AI-powered form by describing what you need. Our intelligent system will generate a professional form for you.
      </p>
      <Button
        variant="default"
        size="lg"
        iconName="Plus"
        iconPosition="left"
        onClick={() => navigate('/create-form')}
      >
        Create Your First Form
      </Button>
    </div>
  );
};

export default EmptyState;