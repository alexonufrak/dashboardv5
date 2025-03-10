import React from 'react';
import { Button } from '@heroui/react';

export default function TestPage() {
  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-5">HeroUI Test Page</h1>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl mb-2">Button Test</h2>
          <div className="flex flex-wrap gap-2">
            <Button color="primary">Primary Button</Button>
            <Button color="secondary">Secondary Button</Button>
            <Button color="success">Success Button</Button>
            <Button color="warning">Warning Button</Button>
            <Button color="danger">Danger Button</Button>
          </div>
        </div>
      </div>
    </div>
  );
}