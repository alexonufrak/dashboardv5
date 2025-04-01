import React, { useState } from 'react';
import { useAllAvailableResources, useCreateResource } from '@/lib/airtable/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, Plus, FileText, Link, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@auth0/nextjs-auth0/client';

/**
 * Resources Component - Refactored to use the new Airtable hooks
 * Displays available resources for a program/cohort with filtering by category
 */
export default function Resources({ programId, cohortId }) {
  const { user, isLoading: userLoading } = useUser();
  const [activeTab, setActiveTab] = useState('all');
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  
  // Use our custom hook that combines all available resources
  const { 
    data: resources, 
    isLoading, 
    error 
  } = useAllAvailableResources(programId, cohortId);
  
  // Group resources by category
  const resourcesByCategory = resources?.reduce((acc, resource) => {
    const category = resource.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(resource);
    return acc;
  }, {}) || {};
  
  // Get unique categories for tabs
  const categories = Object.keys(resourcesByCategory).sort();

  // Handle loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-10 w-24" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">Error Loading Resources</CardTitle>
          <CardDescription className="text-red-600">
            {error.message || 'Failed to load resources'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Get resources for the active tab
  const filteredResources = activeTab === 'all' 
    ? resources
    : resourcesByCategory[activeTab] || [];

  // Get the appropriate icon for a resource based on its type
  const getResourceIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'link':
        return <Link className="h-4 w-4" />;
      case 'file':
        return <Download className="h-4 w-4" />;
      default:
        return <ExternalLink className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Resources</CardTitle>
          
          {/* Only show Add Resource button for admins */}
          {user && user['https://xfoundry.org/roles']?.includes('admin') && (
            <Dialog open={isAddResourceOpen} onOpenChange={setIsAddResourceOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  Add Resource
                </Button>
              </DialogTrigger>
              <DialogContent>
                <AddResourceForm 
                  programId={programId} 
                  cohortId={cohortId} 
                  onSuccess={() => setIsAddResourceOpen(false)} 
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        {/* Category tabs */}
        {categories.length > 0 && (
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="w-full"
          >
            <TabsList className="grid grid-flow-col auto-cols-max gap-2 overflow-x-auto w-full justify-start">
              <TabsTrigger value="all">All</TabsTrigger>
              {categories.map(category => (
                <TabsTrigger key={category} value={category}>
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </CardHeader>
      
      <CardContent>
        {filteredResources.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">
            No resources available in this category
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredResources.map(resource => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Resource Card Component
function ResourceCard({ resource }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4">
        <CardTitle className="text-base flex items-center gap-1">
          {getResourceIcon(resource.type)}
          {resource.name}
        </CardTitle>
        {resource.description && (
          <CardDescription className="line-clamp-2">
            {resource.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {resource.url && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => window.open(resource.url, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Resource
          </Button>
        )}
        
        {resource.fileAttachments && resource.fileAttachments.length > 0 && (
          <div className="mt-2">
            {resource.fileAttachments.map(file => (
              <a 
                key={file.id} 
                href={file.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center"
              >
                <Download className="h-3 w-3 mr-1" />
                {file.filename || 'Download File'}
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Resource icon helper function
function getResourceIcon(type) {
  switch (type?.toLowerCase()) {
    case 'document':
      return <FileText className="h-4 w-4" />;
    case 'link':
      return <Link className="h-4 w-4" />;
    case 'file':
      return <Download className="h-4 w-4" />;
    default:
      return <ExternalLink className="h-4 w-4" />;
  }
}

// Add Resource Form Component
function AddResourceForm({ programId, cohortId, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    type: 'Link',
    category: 'General',
    isGlobal: false
  });
  
  const createResourceMutation = useCreateResource();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await createResourceMutation.mutateAsync({
        ...formData,
        programId: formData.isGlobal ? null : programId,
        cohortId: formData.isGlobal ? null : cohortId
      });
      
      onSuccess?.();
    } catch (error) {
      console.error('Error creating resource:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Add New Resource</DialogTitle>
      </DialogHeader>
      
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Resource Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="url">URL</Label>
          <Input
            id="url"
            name="url"
            value={formData.url}
            onChange={handleChange}
            placeholder="https://"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="type">Resource Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleSelectChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Link">Link</SelectItem>
                <SelectItem value="Document">Document</SelectItem>
                <SelectItem value="File">File</SelectItem>
                <SelectItem value="Video">Video</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleSelectChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="General">General</SelectItem>
                <SelectItem value="Learning">Learning</SelectItem>
                <SelectItem value="Templates">Templates</SelectItem>
                <SelectItem value="Tools">Tools</SelectItem>
                <SelectItem value="Reference">Reference</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isGlobal"
            name="isGlobal"
            checked={formData.isGlobal}
            onChange={(e) => setFormData(prev => ({ ...prev, isGlobal: e.target.checked }))}
            className="rounded border-gray-300"
          />
          <Label htmlFor="isGlobal" className="text-sm">
            Make this resource available to all users
          </Label>
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => onSuccess?.()}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={createResourceMutation.isPending || !formData.name}
        >
          {createResourceMutation.isPending ? 'Adding...' : 'Add Resource'}
        </Button>
      </div>
    </form>
  );
}