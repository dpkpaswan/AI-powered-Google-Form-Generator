import React from 'react';
import Icon from '../../../components/AppIcon';

const StatsCard = ({ icon, label, value, trend, trendValue }) => {
  const getTrendColor = () => {
    if (!trend) return 'text-muted-foreground';
    return trend === 'up' ? 'text-success' : 'text-error';
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    return trend === 'up' ? 'TrendingUp' : 'TrendingDown';
  };

  return (
    <div className="bg-card rounded-lg shadow-elevation-2 p-4 md:p-6 border border-border">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
          <Icon name={icon} size={20} className="md:w-6 md:h-6" color="var(--color-primary)" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 ${getTrendColor()}`}>
            <Icon name={getTrendIcon()} size={16} />
            <span className="text-xs md:text-sm font-medium">{trendValue}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-card-foreground mb-1">
          {value}
        </p>
        <p className="text-xs md:text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
};

export default StatsCard;