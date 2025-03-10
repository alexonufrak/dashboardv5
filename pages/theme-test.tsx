import { Button, Card, Container, Heading, Text } from '@heroui/react';
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
    <Container maxWidth="xl" className="py-10">
      <Card className="mb-6">
        <Card.Header>
          <Heading size="lg">HeroUI Theme Test Page</Heading>
        </Card.Header>
        <Card.Body>
          <div className="mb-6">
            <Text>Current theme: {theme}</Text>
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
        </Card.Body>
        <Card.Footer>
          <Text>This page demonstrates HeroUI theme elements</Text>
        </Card.Footer>
      </Card>
    </Container>
  );
}