"use client"

import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const ResourceToolbarNew = () => {
  const resources = [
    {
      name: "xFoundry",
      url: "https://xfoundry.org"
    },
    {
      name: "ConneXions Community",
      url: "https://connexion.xfoundry.org"
    },
    {
      name: "Help Center",
      url: "#help"
    }
  ]
  
  return (
    <div className="fixed w-full bg-muted/40 border-b h-10 flex items-center top-0 left-0 z-50 px-4">
      <div className="hidden md:flex md:ml-64 items-center">
        <div className="flex items-center gap-4">
          {resources.map((resource, i) => (
            <div key={resource.name} className="flex items-center">
              {i > 0 && <Separator orientation="vertical" className="h-4 mx-2" />}
              <Button variant="link" size="sm" className="h-auto p-0 text-xs text-muted-foreground">
                <a 
                  href={resource.url} 
                  target={resource.url.startsWith('http') ? "_blank" : "_self"}
                  rel={resource.url.startsWith('http') ? "noopener noreferrer" : ""}
                  className="flex items-center gap-1"
                >
                  {resource.name}
                  {resource.url.startsWith('http') && (
                    <ExternalLink className="h-3 w-3" />
                  )}
                </a>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ResourceToolbarNew