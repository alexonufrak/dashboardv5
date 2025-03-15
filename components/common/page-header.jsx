"use client"

import React from 'react'
import Link from 'next/link'
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
 * @param {string|React.ReactNode} props.backHref - Optional back link URL or component
 * @param {React.ReactNode} props.breadcrumbs - Optional breadcrumbs component
 * @param {boolean} props.divider - Whether to show a divider below the header (default: false)
 */
export function PageHeader({
  title,
  subtitle,
  badges,
  actions,
  children,
  className,
  icon,
  backHref,
  breadcrumbs,
  divider = false,
}) {
  // Normalize badges to an array if a single badge is passed
  const badgeElements = React.Children.toArray(badges);
  
  // Normalize actions to an array if a single action is passed
  const actionElements = React.Children.toArray(actions);
  
  return (
    <div className={cn('space-y-4', className)}>
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
      
      {/* Main header container */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          {/* Title row with icon and badges */}
          <div className="flex flex-wrap items-center gap-2">
            {icon && <div className="flex-shrink-0 mr-1">{icon}</div>}
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
        
        {/* Action buttons */}
        {actionElements.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
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