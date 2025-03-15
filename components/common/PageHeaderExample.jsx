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
              icon={<Settings className="h-6 w-6 text-primary" />}
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

      {/* With Helper Components */}
      <section>
        <h2 className="text-xl font-semibold mb-4">With Helper Components</h2>
        <Card>
          <CardContent className="p-6">
            <PageHeader
              title="Resource Library"
              subtitle="Access program resources and documentation"
            >
              <PageHeaderBadges>
                <Badge variant="outline">Documents</Badge>
                <Badge variant="outline">Videos</Badge>
                <Badge variant="outline">Templates</Badge>
              </PageHeaderBadges>
              
              <PageHeaderActions>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="default" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Resource
                </Button>
              </PageHeaderActions>
            </PageHeader>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}