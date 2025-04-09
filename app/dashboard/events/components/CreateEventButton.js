'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarPlus } from 'lucide-react';
import CreateEventForm from './CreateEventForm';

export default function CreateEventButton({ programs = [] }) {
  return <CreateEventForm programs={programs} />;
}