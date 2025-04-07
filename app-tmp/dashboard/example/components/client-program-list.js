'use client'

/**
 * Client-side Program List Component
 * Handles user interactions like program selection and filtering
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Program card component
 */
function ProgramCard({ program, onClick }) {
  const hasActiveCohort = program.activeCohort !== null;
  
  return (
    <Card 
      className="program-card hover:shadow-md transition-shadow" 
      onClick={() => onClick && onClick(program.id)}
    >
      <CardHeader>
        <CardTitle>{program.name}</CardTitle>
        <CardDescription>
          {program.description || 'xFoundry program'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="status-badge">
          {program.isParticipating ? (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              Participating
            </span>
          ) : hasActiveCohort ? (
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
              Open for Applications
            </span>
          ) : (
            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
              Not Active
            </span>
          )}
        </div>
        
        {hasActiveCohort && (
          <div className="mt-2 text-sm">
            <p>
              <span className="font-medium">Current cohort:</span> {program.activeCohort.name}
            </p>
            {program.activeCohort.applicationDeadline && (
              <p className="text-xs mt-1">
                Applications due: {new Date(program.activeCohort.applicationDeadline).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" onClick={(e) => {
          e.stopPropagation();
          onClick && onClick(program.id);
        }}>
          {program.isParticipating ? 'View Dashboard' : hasActiveCohort ? 'Learn More' : 'Details'}
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Client Program List Component
 * Receives data from server component and handles client-side interactivity
 */
export function ClientSideProgramList({ activePrograms, otherPrograms, userId }) {
  const [activeTab, setActiveTab] = useState('active');
  const router = useRouter();
  
  // Handle program selection
  const handleProgramSelect = (programId) => {
    router.push(`/dashboard/program/${programId}`);
  };
  
  return (
    <div className="program-list">
      <Tabs defaultValue="active" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="active">
            Active Programs ({activePrograms.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Programs ({activePrograms.length + otherPrograms.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          {activePrograms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activePrograms.map(program => (
                <ProgramCard 
                  key={program.id} 
                  program={program} 
                  onClick={handleProgramSelect} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">You're not participating in any active programs.</p>
              <Button 
                className="mt-4" 
                variant="outline"
                onClick={() => setActiveTab('all')}
              >
                Browse Available Programs
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...activePrograms, ...otherPrograms].map(program => (
              <ProgramCard 
                key={program.id} 
                program={program} 
                onClick={handleProgramSelect} 
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ClientSideProgramList;