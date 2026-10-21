import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
        <Compass className="h-8 w-8" />
      </div>
      <h1 className="mt-4 text-4xl font-extrabold text-slate-900 dark:text-white sm:text-5xl">
        404
      </h1>
      <h2 className="mt-2 text-lg font-bold text-slate-800 dark:text-slate-200">
        Campus Page Not Found
      </h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
        The requested university portal URL or event page could not be located.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Link to="/">
          <Button variant="primary" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Return to Campus Home
          </Button>
        </Link>
        <Link to="/events">
          <Button variant="outline">Browse Events</Button>
        </Link>
      </div>
    </div>
  );
};
