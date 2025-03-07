import './App.css';
import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { Cropper } from './component/Cropper';

const router = createBrowserRouter([
  {
    path: '/',
    Component: Cropper, // React 19 uses `Component` instead of `element`
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
