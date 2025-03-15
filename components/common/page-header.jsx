"use client"

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ChevronLeft } from 'lucide-react'

/**
 * Standardized page header component for dashboard pages using shadcn components
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - The main title of the page
 * @param {string} props.subtitle - Optional subtitle or description
 * @param {Array|React.ReactNode} props.badges - Optional badges to display next to the title
 * @param {Array|React.ReactNode} props.actions - Optional action buttons for the header
 * @param {React.ReactNode} props.children - Optional additional content to display below the header
 * @param {string} props.className - Optional additional CSS classes
 * @param {React.ReactNode} props.icon - Optional icon to display before the title
 * @param {string} props.image - Optional image URL to display before the title as an image
 * @param {number} props.imageSize - Size for the image (default: 40)
 * @param {string} props.bannerImage - Optional banner image URL to display above the header
 * @param {number} props.bannerHeight - Height for the banner image (default: 150)
 * @param {string|React.ReactNode} props.backHref - Optional back link URL or component
 * @param {React.ReactNode} props.breadcrumbs - Optional breadcrumbs component
 * @param {boolean} props.divider - Whether to show a divider below the header (default: false)
 * @param {string} props.spacing - Size of vertical padding (default: 'md')
 */
export function PageHeader({
  title,
  subtitle,
  badges,
  actions,
  children,
  className,
  icon,
  image,
  imageSize = 40,
  bannerImage,
  bannerHeight = 150,
  backHref,
  breadcrumbs,
  divider = false,
  spacing = 'md',
}) {
  // Normalize badges to an array if a single badge is passed
  const badgeElements = React.Children.toArray(badges);
  
  // Normalize actions to an array if a single action is passed
  const actionElements = React.Children.toArray(actions);
  
  // Determine padding based on spacing prop
  const paddingClasses = {
    'sm': 'py-2',
    'md': 'py-4',
    'lg': 'py-6',
    'xl': 'py-8',
  }[spacing] || 'py-4';
  
  return (
    <div className={cn('space-y-4', className)}>
      {/* Banner Image */}
      {bannerImage && (
        <div 
          className="relative w-full rounded-lg overflow-hidden mb-4" 
          style={{ height: `${bannerHeight}px` }}
        >
          <Image 
            src={bannerImage} 
            alt={title || "Page banner"} 
            fill 
            className="object-cover" 
            priority
          />
        </div>
      )}
      
      {/* Breadcrumbs */}
      {breadcrumbs && (
        <div className="mb-2">
          {breadcrumbs}
        </div>
      )}
      
      {/* Back Link */}
      {backHref && (
        <div className="mb-2">
          {typeof backHref === 'string' ? (
            <Button variant="ghost" size="sm" asChild className="gap-1 pl-0 hover:pl-1">
              <Link href={backHref}>
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </Link>
            </Button>
          ) : (
            backHref
          )}
        </div>
      )}
      
      {/* Main header container with proper vertical padding */}
      <div className={cn("flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", paddingClasses)}>
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Image or Icon */}
          {(image || icon) && (
            <div className="flex-shrink-0">
              {image ? (
                <div className="relative overflow-hidden rounded-md" style={{ width: imageSize, height: imageSize }}>
                  <Image 
                    src={image} 
                    alt={title || "Header image"} 
                    width={imageSize} 
                    height={imageSize} 
                    className="object-cover"
                  />
                </div>
              ) : icon ? (
                <div className="flex items-center justify-center">{icon}</div>
              ) : null}
            </div>
          )}
          
          {/* Title, badges, and subtitle */}
          <div className="space-y-1.5 flex-1 min-w-0">
            {/* Title row with badges */}
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight truncate pr-2">{title}</h1>
              
              {badgeElements.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  {badgeElements.map((badge, index) => {
                    // If it's already a Badge component, use it directly
                    if (React.isValidElement(badge)) {
                      return React.cloneElement(badge, { key: index });
                    }
                    
                    // If it's a string, wrap it in a Badge component
                    if (typeof badge === 'string') {
                      return <Badge key={index} variant="secondary">{badge}</Badge>;
                    }
                    
                    return null;
                  })}
                </div>
              )}
            </div>
            
            {/* Subtitle */}
            {subtitle && (
              <p className="text-muted-foreground line-clamp-2">{subtitle}</p>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        {actionElements.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 shrink-0 mt-3 sm:mt-0">
            {actionElements.map((action, index) => {
              if (React.isValidElement(action)) {
                return React.cloneElement(action, { key: index });
              }
              return null;
            })}
          </div>
        )}
      </div>
      
      {/* Divider */}
      {divider && <Separator className="my-4" />}
      
      {/* Additional content */}
      {children}
    </div>
  )
}

/**
 * Actions container for the PageHeader
 */
export function PageHeaderActions({ children, className }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {children}
    </div>
  )
}

/**
 * Badge container for the PageHeader
 */
export function PageHeaderBadges({ children, className }) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {children}
    </div>
  )
}