import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button.jsx';

export const NotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
    <h1 className="font-heading text-8xl text-pencil -rotate-2 drop-shadow-[4px_4px_0px_#e5e0d8]">
      404
    </h1>
    <p className="font-heading text-2xl text-accent">Page not found!</p>
    <p className="font-body text-pencil/60">
      Looks like this page got lost in the sketchbook.
    </p>
    <Link to="/"><Button>Back to home</Button></Link>
  </div>
);
