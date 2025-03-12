"use client"

import React, { useState } from 'react'
import { Dropzone } from '@/components/ui/dropzone'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

export default function DropzoneExamplePage() {
  const [files, setFiles] = useState([])
  const [singleFile, setSingleFile] = useState(null)
  const [variant, setVariant] = useState('default')
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-2">Dropzone Component</h1>
      <p className="text-muted-foreground mb-8">Examples of the reusable Dropzone component with different configurations</p>
      
      <Tabs defaultValue="single" className="mb-10">
        <TabsList>
          <TabsTrigger value="single">Single File</TabsTrigger>
          <TabsTrigger value="multiple">Multiple Files</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
        </TabsList>
        
        <TabsContent value="single" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Single File Upload</CardTitle>
              <CardDescription>Upload a single file with preview and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dropzone
                maxFiles={1}
                accept={{
                  'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']
                }}
                maxSize={5 * 1024 * 1024} // 5MB
                prompt="Drag & drop an image here, or click to browse"
                subPrompt="PNG, JPG, WEBP, GIF up to 5MB"
                onDrop={(file) => setSingleFile(file)}
                onFileRemove={() => setSingleFile(null)}
                currentFiles={singleFile ? [singleFile] : []}
              />
              
              {singleFile && (
                <div className="text-sm">
                  <p><strong>Selected file:</strong> {singleFile.name}</p>
                  <p><strong>Size:</strong> {(singleFile.size / 1024).toFixed(1)} KB</p>
                  <p><strong>Type:</strong> {singleFile.type}</p>
                </div>
              )}
              
              <Button onClick={() => setSingleFile(null)} disabled={!singleFile}>
                Clear
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="multiple" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Multiple Files Upload</CardTitle>
              <CardDescription>Upload multiple files with previews</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dropzone
                maxFiles={5}
                accept={{
                  'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
                  'application/pdf': ['.pdf'],
                  'text/plain': ['.txt'],
                }}
                maxSize={5 * 1024 * 1024} // 5MB
                prompt="Drag & drop files here, or click to browse"
                subPrompt="Images, PDFs, and text files up to 5MB each"
                onDrop={(newFiles) => setFiles(newFiles)}
                onFileRemove={(newFiles) => setFiles(newFiles || [])}
                currentFiles={files}
              />
              
              <div className="flex items-center gap-2">
                <Badge>{files.length} file(s) selected</Badge>
                {files.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setFiles([])}>
                    Clear All
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="variants" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Default Variant</CardTitle>
              </CardHeader>
              <CardContent>
                <Dropzone
                  variant="default"
                  prompt="Default variant"
                  maxFiles={1}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Success Variant</CardTitle>
              </CardHeader>
              <CardContent>
                <Dropzone
                  variant="success"
                  prompt="Success variant"
                  maxFiles={1}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Error Variant</CardTitle>
              </CardHeader>
              <CardContent>
                <Dropzone
                  variant="error"
                  prompt="Error variant"
                  maxFiles={1}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Disabled</CardTitle>
              </CardHeader>
              <CardContent>
                <Dropzone
                  disabled={true}
                  prompt="Disabled dropzone"
                  maxFiles={1}
                />
              </CardContent>
            </Card>
          </div>
          
          <Separator className="my-8" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Small Size</CardTitle>
              </CardHeader>
              <CardContent>
                <Dropzone
                  size="sm"
                  prompt="Small size"
                  maxFiles={1}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Default Size</CardTitle>
              </CardHeader>
              <CardContent>
                <Dropzone
                  size="default"
                  prompt="Default size"
                  maxFiles={1}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Large Size</CardTitle>
              </CardHeader>
              <CardContent>
                <Dropzone
                  size="lg"
                  prompt="Large size"
                  maxFiles={1}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}