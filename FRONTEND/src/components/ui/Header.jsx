import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const navigationItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Create Form', path: '/create-form', icon: 'FilePlus' },
    { label: 'My Forms', path: '/my-forms', icon: 'FolderOpen' },
  ];

  const isActivePath = (path) => location?.pathname === path;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-100 bg-card shadow-elevation-2 transition-smooth">
      <div className="max-w-9xl mx-auto">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-3 transition-smooth hover:opacity-80">
              <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center">
                <Icon name="Sparkles" size={24} color="var(--color-primary)" />
              </div>
              <span className="font-heading font-semibold text-xl text-foreground hidden sm:block">
                AI Form Generator
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {navigationItems?.map((item) => (
                <Link
                  key={item?.path}
                  to={item?.path}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md transition-smooth
                    ${isActivePath(item?.path)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                    }
                  `}
                >
                  <Icon name={item?.icon} size={18} />
                  <span className="font-medium">{item?.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={toggleUserMenu}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-smooth"
                aria-label="User menu"
                aria-expanded={isUserMenuOpen}
              >
                <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                  <Icon name="User" size={18} color="var(--color-accent)" />
                </div>
                <div className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-sm font-medium text-foreground max-w-[160px] truncate">
                    {user?.name || 'Account'}
                  </span>
                  <span className="text-xs text-muted-foreground max-w-[160px] truncate">
                    {user?.email || ''}
                  </span>
                </div>
                <Icon name="ChevronDown" size={16} className={`transition-smooth ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-50"
                    onClick={toggleUserMenu}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-popover rounded-md shadow-elevation-4 z-200 animate-slide-in">
                    <div className="p-4 border-b border-border">
                      <p className="font-medium text-sm text-popover-foreground">User Account</p>
                      <p className="text-xs text-muted-foreground mt-1">{user?.name || ''}</p>
                      <p className="text-xs text-muted-foreground mt-1">{user?.email || ''}</p>
                    </div>
                    <div className="p-2">
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-smooth text-popover-foreground"
                        onClick={toggleUserMenu}
                      >
                        <Icon name="Settings" size={18} />
                        <span className="text-sm">Settings</span>
                      </Link>
                      <button
                        onClick={() => {
                          toggleUserMenu();
                          logout();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-smooth text-popover-foreground"
                      >
                        <Icon name="LogOut" size={18} />
                        <span className="text-sm">Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 rounded-md hover:bg-muted transition-smooth"
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              <Icon name={isMobileMenuOpen ? 'X' : 'Menu'} size={24} />
            </button>
          </div>
        </div>
      </div>
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-background z-50 lg:hidden"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
          <nav className="fixed top-16 left-0 right-0 bottom-0 bg-card z-200 lg:hidden overflow-y-auto">
            <div className="p-4 space-y-2">
              {navigationItems?.map((item) => (
                <Link
                  key={item?.path}
                  to={item?.path}
                  onClick={closeMobileMenu}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-md transition-smooth
                    ${isActivePath(item?.path)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                    }
                  `}
                >
                  <Icon name={item?.icon} size={20} />
                  <span className="font-medium">{item?.label}</span>
                </Link>
              ))}
            </div>
          </nav>
        </>
      )}
    </header>
  );
};

export default Header;