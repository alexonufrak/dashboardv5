"use client"

import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import BountyCard from './BountyCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Search, Filter, Award } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const BountyList = ({ programId, title = "Bounties", description = "Find projects, internships, and bounties to apply for" }) => {
  // State for filters
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('all')

  // Fetch bounties data
  const { data: bounties, isLoading, error } = useQuery({
    queryKey: ['bounties', programId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/bounties?programId=${programId}`)
        if (!response.ok) {
          throw new Error(`Error fetching bounties: ${response.statusText}`)
        }
        return await response.json()
      } catch (error) {
        console.error('Failed to fetch bounties:', error)
        throw error
      }
    },
    // Prevent error retries in development for better debugging
    retry: process.env.NODE_ENV === 'production' ? 3 : 0,
    // 5 minute stale time
    staleTime: 5 * 60 * 1000,
  })

  // Mock data for development (remove in production)
  const mockBounties = [
    {
      id: 'bounty-1',
      title: 'Web App Development Project',
      classification: 'Project',
      status: 'Open',
      prizeValue: 500,
      description: 'Develop a responsive web application for tracking student progress in university programs.',
      organization: 'Computer Science Department',
      lastModified: '2025-03-01T12:00:00Z',
    },
    {
      id: 'bounty-2',
      title: 'Summer Software Engineering Internship',
      classification: 'Internship',
      status: 'Open',
      internshipTitle: 'Software Engineering Intern',
      internshipCompensation: 7500,
      internshipDescription: 'Join our team for a 12-week summer internship working on cutting-edge web technologies.',
      internshipOrganization: [{ name: 'Tech Innovations Inc.' }],
      lastModified: '2025-03-02T15:30:00Z',
    },
    {
      id: 'bounty-3',
      title: 'Mobile App Design Challenge',
      classification: 'Bounty',
      status: 'Closed',
      prizeValue: 350,
      description: 'Design a mobile app interface for campus event management and ticketing.',
      organization: 'Student Affairs',
      lastModified: '2025-02-15T09:45:00Z',
    },
    {
      id: 'bounty-4',
      title: 'Data Science Research Assistant',
      classification: 'Internship',
      status: 'Open',
      internshipTitle: 'Research Assistant',
      internshipCompensation: 6500,
      internshipDescription: 'Assist professors with data collection, analysis, and visualization for research projects.',
      internshipOrganization: [{ name: 'University Research Center' }],
      lastModified: '2025-03-05T11:20:00Z',
    },
    {
      id: 'bounty-5',
      title: 'Logo Design Contest',
      classification: 'Bounty',
      status: 'Open',
      prizeValue: 200,
      description: 'Create a new logo for the university entrepreneurship club.',
      organization: 'Student Entrepreneurship Club',
      lastModified: '2025-03-03T16:15:00Z',
    },
  ]

  // Use mock data during development
  const allBounties = bounties?.data || mockBounties

  // Handle applying for a bounty
  const handleApply = (bounty) => {
    console.log('Applying for bounty:', bounty)
    // Implementation for applying will go here
  }

  // Filter the bounties based on search, type, and status
  const filteredBounties = allBounties.filter(bounty => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      (bounty.title && bounty.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bounty.organization && bounty.organization.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bounty.internshipTitle && bounty.internshipTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bounty.description && bounty.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bounty.internshipDescription && bounty.internshipDescription.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // Type filter
    const matchesType = typeFilter === 'all' || 
      (bounty.classification && bounty.classification.toLowerCase() === typeFilter.toLowerCase())
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || 
      (bounty.status && bounty.status.toLowerCase() === statusFilter.toLowerCase())
    
    // Tab filter
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'internships' && bounty.classification === 'Internship') ||
      (activeTab === 'projects' && bounty.classification === 'Project') ||
      (activeTab === 'bounties' && bounty.classification === 'Bounty')
    
    return matchesSearch && matchesType && matchesStatus && matchesTab
  })

  // If loading, show loading spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading bounties...</span>
      </div>
    )
  }

  // If error, show error message
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Bounties</h3>
        <p className="text-red-700 mb-4">{error.message || "Failed to load bounties"}</p>
        <Button 
          variant="outline" 
          className="bg-white"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with title and search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground mt-1">
            {description}
          </p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search bounties..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs and filters */}
      <div className="space-y-4">
        <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full md:w-[500px]">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="internships">Internships</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="bounties">Bounties</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center w-full sm:w-auto">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="mr-2 text-sm">Filters:</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="internship">Internships</SelectItem>
                <SelectItem value="project">Projects</SelectItem>
                <SelectItem value="bounty">Bounties</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Bounty grid */}
      {filteredBounties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBounties.map(bounty => (
            <BountyCard 
              key={bounty.id} 
              bounty={bounty} 
              onApply={handleApply} 
            />
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Bounties Found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' 
              ? "Try adjusting your search filters to find more opportunities." 
              : "There are no bounties available right now. Check back later."}
          </p>
          {(searchTerm || typeFilter !== 'all' || statusFilter !== 'all') && (
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('')
                setTypeFilter('all')
                setStatusFilter('all')
                setActiveTab('all')
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default BountyList