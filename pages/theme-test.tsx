import { Button } from '@heroui/react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

export default function ThemeTest() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="rounded-lg border shadow-sm mb-6 overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">HeroUI Theme Test Page</h2>
        </div>
        <div className="p-4">
          <div className="mb-6">
            <p>Current theme: {theme}</p>
            <Button 
              color="primary" 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="mt-2"
            >
              Toggle Theme
            </Button>
          </div>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button color="primary">Primary</Button>
              <Button color="secondary">Secondary</Button>
              <Button color="success">Success</Button>
              <Button color="warning">Warning</Button>
              <Button color="danger">Danger</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button color="primary" variant="flat">Flat</Button>
              <Button color="primary" variant="bordered">Bordered</Button>
              <Button color="primary" variant="light">Light</Button>
              <Button color="primary" variant="solid">Solid</Button>
            </div>
          </div>
        </div>
        <div className="p-4 border-t">
          <p>This page demonstrates HeroUI theme elements</p>
        </div>
      </div>
    </div>
  );
}