import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';
import {MotionPreferences} from '@/components/motion/preferences';
createRoot(document.getElementById('root')!).render(<React.StrictMode><MotionPreferences><App /></MotionPreferences></React.StrictMode>);
