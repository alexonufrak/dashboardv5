"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink, File, FileText, Video, BookOpen, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function Resources({ resources = [] }) {
  // Default resources if none provided
  const defaultResources = [
    {
      id: "docs",
      name: "Documentation",
      description: "Program guidelines and documentation",
      url: "https://xfoundry.org/docs",
      icon: <FileText className="h-4 w-4" />
    },
    {
      id: "community",
      name: "Community",
      description: "Join ConneXions community",
      url: "https://connexion.xfoundry.org",
      icon: <BookOpen className="h-4 w-4" />
    },
    {
      id: "help",
      name: "Help Center",
      description: "Get help with your program",
      url: "#help",
      icon: <HelpCircle className="h-4 w-4" />
    }
  ]
  
  // Use provided resources or defaults
  const displayResources = resources.length > 0 ? resources : defaultResources
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Resources</CardTitle>
        <CardDescription>Helpful resources for your program</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {displayResources.map((resource, index) => (
            <div key={resource.id || index}>
              <Button 
                variant="ghost" 
                className="w-full justify-start p-2 h-auto" 
                asChild
              >
                <Link 
                  href={resource.url} 
                  target={resource.url.startsWith('http') ? "_blank" : "_self"}
                  rel={resource.url.startsWith('http') ? "noopener noreferrer" : ""}
                  className="flex items-center gap-3"
                >
                  <div className="flex-shrink-0 bg-blue-50 p-2 rounded-md text-blue-700">
                    {resource.icon || <File className="h-4 w-4" />}
                  </div>
                  <div className="flex-grow text-left">
                    <div className="font-medium">{resource.name}</div>
                    {resource.description && (
                      <div className="text-xs text-muted-foreground">{resource.description}</div>
                    )}
                  </div>
                  {resource.url.startsWith('http') && (
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  )}
                </Link>
              </Button>
              {index < displayResources.length - 1 && <Separator className="my-1" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}