/**
 * ParticipationSummary Component
 * 
 * Displays a user's participation information for programs and cohorts
 * using the domain-driven hooks and components.
 */
import React from 'react';
import { useMyParticipation } from '@/lib/hooks/useParticipation';
import DataDisplay from '@/components/common/DataDisplay';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Users, Award, CheckCircle } from 'lucide-react';

export function ParticipationSummary() {
  const { 
    data: participationData, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useMyParticipation();
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Program Participation</span>
          {participationData?.hasParticipation && (
            <Badge variant="outline" className="ml-2">
              {participationData.records.length} Program{participationData.records.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <DataDisplay
          data={participationData?.records}
          isLoading={isLoading}
          isError={isError}
          error={error}
          refetch={refetch}
          emptyComponent={
            <div className="text-center p-4 text-gray-500">
              You are not currently participating in any programs.
            </div>
          }
        >
          {(records) => (
            <div className="space-y-4">
              {records.map((participation) => (
                <ParticipationCard 
                  key={participation.id} 
                  participation={participation} 
                />
              ))}
            </div>
          )}
        </DataDisplay>
      </CardContent>
    </Card>
  );
}

function ParticipationCard({ participation }) {
  // Format dates if available
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };
  
  const startDate = participation.cohort?.startDate 
    ? formatDate(participation.cohort.startDate)
    : null;
    
  const endDate = participation.cohort?.endDate
    ? formatDate(participation.cohort.endDate)
    : null;
  
  return (
    <div className="border rounded-md p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-medium text-gray-900">
            {participation.cohort?.name || 'Unknown Program'}
          </h3>
          
          <p className="text-sm text-gray-500">
            {participation.initiative?.name || participation.cohort?.shortName || ''}
          </p>
        </div>
        
        <Badge 
          variant={participation.status === 'Active' ? 'success' : 'secondary'}
          className={participation.status === 'Active' ? 'bg-green-100 text-green-800' : ''}
        >
          {participation.status || 'Unknown Status'}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
        {(startDate || endDate) && (
          <div className="flex items-center text-sm">
            <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
            <span>
              {startDate && endDate 
                ? `${startDate} - ${endDate}`
                : startDate || endDate
              }
            </span>
          </div>
        )}
        
        <div className="flex items-center text-sm">
          <Award className="h-4 w-4 mr-2 text-gray-400" />
          <span>{participation.capacity || 'Participant'}</span>
        </div>
        
        {participation.team && (
          <div className="flex items-center text-sm">
            <Users className="h-4 w-4 mr-2 text-gray-400" />
            <span>Team: {participation.team.name || 'Unknown Team'}</span>
          </div>
        )}
        
        {participation.cohort?.isCurrent && (
          <div className="flex items-center text-sm">
            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
            <span className="text-green-600">Current Cohort</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ParticipationSummary;