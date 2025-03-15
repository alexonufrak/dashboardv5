"use client"

import React from 'react'
import { PageHeader, PageHeaderActions, PageHeaderBadges } from './page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Download, 
  Filter, 
  Settings, 
  Calendar, 
  ChevronRight,
  Users,
  Clock 
} from 'lucide-react'

export default function PageHeaderExample() {
  return (
    <div className="space-y-12">
      {/* Basic Example */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Basic Example</h2>
        <Card>
          <CardContent className="p-6">
            <PageHeader
              title="Dashboard Overview"
              subtitle="View and manage your program statistics and activities"
              spacing="md" // Default medium padding
            />
          </CardContent>
        </Card>
      </section>

      {/* With Different Spacing Options */}
      <section>
        <h2 className="text-xl font-semibold mb-4">With Different Spacing Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <PageHeader
                title="Small Spacing"
                subtitle="Compact header with minimal padding"
                spacing="sm"
                badges={["Compact"]}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <PageHeader
                title="Large Spacing"
                subtitle="Expanded header with more padding"
                spacing="lg"
                badges={["Spacious"]}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* With Icon and Image */}
      <section>
        <h2 className="text-xl font-semibold mb-4">With Icon and Image Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <PageHeader
                title="With Icon"
                subtitle="Using Lucide icon component"
                icon={<Users className="h-6 w-6 text-primary" />}
                badges={["Icon Example"]}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <PageHeader
                title="With Image"
                subtitle="Using Next.js Image component"
                image="/placeholder-logo.svg"
                imageSize={48}
                badges={["Image Example"]}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* With Banner Image */}
      <section>
        <h2 className="text-xl font-semibold mb-4">With Banner Image</h2>
        <Card>
          <CardContent className="p-6">
            <PageHeader
              title="Program Dashboard"
              subtitle="Full-width banner image above header content"
              bannerImage="/placeholder.jpg"
              bannerHeight={180}
              badges={[
                <Badge key="active" variant="outline" className="bg-green-50 text-green-700 border-green-200">Active Program</Badge>
              ]}
              actions={[
                <Button key="view" variant="default">
                  View Details
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ]}
            />
          </CardContent>
        </Card>
      </section>

      {/* With Badges and Actions */}
      <section>
        <h2 className="text-xl font-semibold mb-4">With Badges and Actions</h2>
        <Card>
          <CardContent className="p-6">
            <PageHeader
              title="Team Members"
              subtitle="Manage your team's membership and roles"
              icon={<Users className="h-6 w-6 text-primary" />}
              badges={[
                <Badge key="active" variant="outline" className="bg-green-50 text-green-700 border-green-200">12 Active</Badge>,
                <Badge key="pending" variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">3 Pending</Badge>
              ]}
              actions={[
                <Button key="filter" variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>,
                <Button key="add">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              ]}
              spacing="lg" // More vertical padding
            />
          </CardContent>
        </Card>
      </section>

      {/* With Back Link and Divider */}
      <section>
        <h2 className="text-xl font-semibold mb-4">With Back Link and Divider</h2>
        <Card>
          <CardContent className="p-6">
            <PageHeader
              title="Program Settings"
              subtitle="Configure program parameters and permissions"
              image="/placeholder-logo.svg" // Using image instead of icon
              imageSize={40}
              backHref="#"
              divider={true}
              actions={[
                <Button key="save" variant="default">Save Changes</Button>
              ]}
            >
              <p className="text-sm text-muted-foreground">
                Changes to these settings will affect all team members.
              </p>
            </PageHeader>
          </CardContent>
        </Card>
      </section>

      {/* With Tabs and Content */}
      <section>
        <h2 className="text-xl font-semibold mb-4">With Tabs and Content</h2>
        <Card>
          <CardContent className="p-6">
            <PageHeader
              title="Analytics Dashboard"
              subtitle="Track program performance and engagement metrics"
              icon={<Calendar className="h-6 w-6 text-primary" />}
              actions={[
                <Button key="download" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              ]}
              badges={[
                <Badge key="updated" variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  Updated 2 hours ago
                </Badge>
              ]}
              divider={true}
              spacing="lg" // More vertical padding
            >
              <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="engagement">Engagement</TabsTrigger>
                  <TabsTrigger value="submissions">Submissions</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="py-4">
                  <p className="text-muted-foreground">Overview tab content goes here...</p>
                </TabsContent>
                <TabsContent value="engagement" className="py-4">
                  <p className="text-muted-foreground">Engagement tab content goes here...</p>
                </TabsContent>
                <TabsContent value="submissions" className="py-4">
                  <p className="text-muted-foreground">Submissions tab content goes here...</p>
                </TabsContent>
              </Tabs>
            </PageHeader>
          </CardContent>
        </Card>
      </section>

      {/* Complete Showcase */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Complete Showcase</h2>
        <Card>
          <CardContent className="p-6">
            <PageHeader
              title="Comprehensive Example"
              subtitle="Showcasing all features of the enhanced page header component"
              bannerImage="/placeholder.jpg"
              bannerHeight={160}
              image="/placeholder-logo.svg"
              imageSize={48}
              backHref="#"
              divider={true}
              spacing="xl" // Extra large padding
              badges={[
                <Badge key="featured" variant="default">Featured</Badge>,
                <Badge key="new" variant="secondary">New</Badge>
              ]}
              actions={[
                <Button key="action" variant="default">
                  Primary Action
                </Button>
              ]}
            >
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  This example demonstrates all the available features of the enhanced PageHeader component,
                  including banner image, left image, badges, actions, and customizable spacing.
                </p>
                <Button variant="outline" size="sm">
                  Learn More
                </Button>
              </div>
            </PageHeader>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}