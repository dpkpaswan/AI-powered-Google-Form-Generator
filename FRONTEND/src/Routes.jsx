import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import CreateForm from './pages/create-form';
import Dashboard from './pages/dashboard';
import MyForms from './pages/my-forms';
import Profile from './pages/profile';
import Login from './pages/login';
import EditForm from './pages/edit-form';
import NotFound from './pages/NotFound';
import RequireAuth from './components/RequireAuth';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/create-form" element={<RequireAuth><CreateForm /></RequireAuth>} />
        <Route path="/my-forms" element={<RequireAuth><MyForms /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/forms/:formId/edit" element={<RequireAuth><EditForm /></RequireAuth>} />
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
