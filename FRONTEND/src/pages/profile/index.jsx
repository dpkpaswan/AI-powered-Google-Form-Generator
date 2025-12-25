import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';

const Profile = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Profile - AI Form Generator</title>
        <meta name="description" content="Profile and settings" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16">
          <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
            <div className="bg-card rounded-lg shadow-elevation-3 border border-border p-4 md:p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                  <Icon name="User" size={22} color="var(--color-primary)" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-heading font-semibold text-xl md:text-2xl text-foreground">Profile</h1>
                  <p className="text-sm md:text-base text-muted-foreground mt-1">
                    Profile settings are not configured yet.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button variant="default" size="default" onClick={() => navigate('/dashboard')}>
                  Back to Dashboard
                </Button>
                <Button variant="outline" size="default" onClick={() => navigate('/')}>
                  Back to Home
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Profile;
