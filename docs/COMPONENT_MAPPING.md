# xFoundry Dashboard: Component Migration Reference

This document provides a detailed mapping between existing components in the xFoundry Dashboard and their HeroUI equivalents. Use this reference when migrating components to ensure consistency and proper functionality.

## Base UI Components

### Button Components

| shadcn/ui Component | HeroUI Equivalent | Prop Differences | Notes |
|---------------------|-------------------|------------------|-------|
| `Button` | `@heroui/button` Button | `variant` values differ | HeroUI supports more variants like `shadow` |
| `IconButton` | `@heroui/button` Button with `isIconOnly` | Add `isIconOnly={true}` | HeroUI combines both in one component |
| `ButtonGroup` | `@heroui/button` ButtonGroup | Similar API | Direct replacement |

### Data Display Components

| shadcn/ui Component | HeroUI Equivalent | Prop Differences | Notes |
|---------------------|-------------------|------------------|-------|
| `Card` | `@heroui/react` Card | Similar structure | HeroUI uses CardHeader, CardBody, CardFooter |
| `Avatar` | `@heroui/react` Avatar | Similar API | HeroUI adds more size options |
| `Badge` | `@heroui/react` Badge | `variant` values differ | HeroUI has flat, bordered, dot variants |
| `Table` | `@heroui/react` Table | More complex API | HeroUI has TableHeader, TableColumn, TableRow, TableCell |

### Layout Components

| shadcn/ui Component | HeroUI Equivalent | Prop Differences | Notes |
|---------------------|-------------------|------------------|-------|
| `Tabs` | `@heroui/react` Tabs | Event handlers differ | Use `onSelectionChange` instead of `onValueChange` |
| `Dialog` | `@heroui/react` Modal | API differs significantly | Needs adapter component |
| `Popover` | `@heroui/react` Popover | Similar API | HeroUI adds more placement options |
| `Accordion` | `@heroui/react` Accordion | Similar API | HeroUI uses AccordionItem structure |

### Input Components

| shadcn/ui Component | HeroUI Equivalent | Prop Differences | Notes |
|---------------------|-------------------|------------------|-------|
| `Input` | `@heroui/input` Input | Similar API | HeroUI adds more options for start/end content |
| `Select` | `@heroui/listbox` Select | API differs significantly | Need to map items differently |
| `Checkbox` | `@heroui/react` Checkbox | Similar API | HeroUI has more styling options |
| `Switch` | `@heroui/switch` Switch | Similar API | Direct replacement |
| `Textarea` | `@heroui/react` Textarea | Similar API | Direct replacement |

### Navigation Components

| shadcn/ui Component | HeroUI Equivalent | Prop Differences | Notes |
|---------------------|-------------------|------------------|-------|
| `Navbar` | `@heroui/navbar` Navbar | More structured API | HeroUI uses NavbarContent, NavbarItem, etc. |
| `DropdownMenu` | `@heroui/react` Dropdown | API differs | HeroUI uses DropdownTrigger, DropdownMenu, DropdownItem |
| `Breadcrumb` | `@heroui/react` Breadcrumbs | Similar API | HeroUI uses BreadcrumbItem |
| `Link` | `@heroui/link` Link | Similar API | HeroUI adds `isExternal` prop |

### Feedback Components

| shadcn/ui Component | HeroUI Equivalent | Prop Differences | Notes |
|---------------------|-------------------|------------------|-------|
| `Toast` | `@heroui/react` Toast | API differs | HeroUI has a different toast system |
| `Progress` | `@heroui/react` Progress | Similar API | HeroUI adds more styling options |
| `Alert` | `@heroui/react` Alert | Similar API | HeroUI has more variants |
| `Spinner` | `@heroui/react` Spinner | Similar API | Direct replacement |

## Custom Components

### Dashboard Components

| Current Component | HeroUI Implementation | Required HeroUI Parts | Notes |
|-------------------|------------------------|----------------------|-------|
| `DashboardLayout.js` | `layouts/dashboard.tsx` | Base layout with sidebar/navbar | Main container |
| `DashboardHeader.js` | Part of `dashboard.tsx` | Title/breadcrumb section | Header section |
| `DashboardErrorBoundary.js` | Custom error component | Error UI patterns | Error handling |

### Program Components

| Current Component | HeroUI Implementation | Required HeroUI Parts | Notes |
|-------------------|------------------------|----------------------|-------|
| `ProgramDashboard.js` | `program/[programId]/index.tsx` | Tabs, Cards, Progress | Main program view |
| `ProgramHeader.js` | Custom component | Avatar, Text, Button | Program info display |
| `MilestonesTab.js` | Custom component | Timeline, Cards | Milestone tracking |
| `TeamMembersTab.js` | Custom component | Table, Avatar, Badge | Team member list |

### Team Components

| Current Component | HeroUI Implementation | Required HeroUI Parts | Notes |
|-------------------|------------------------|----------------------|-------|
| `TeamCard.js` | Custom component | Card, Avatar, Badge | Team overview card |
| `TeamCreateDialog.js` | Custom component | Modal, Form, Button | Team creation |
| `TeamInviteDialog.js` | Custom component | Modal, Input, Button | Team invitation |
| `TeamDetailModal.js` | Custom component | Modal, Tabs, Avatar | Team details |

### Profile Components

| Current Component | HeroUI Implementation | Required HeroUI Parts | Notes |
|-------------------|------------------------|----------------------|-------|
| `ProfileCard.js` | Custom component | Card, Avatar, Text | User profile display |
| `ProfileEditModal.js` | Custom component | Modal, Form, Input | Profile editing |
| `ProfileMenuButton.js` | Custom component | Dropdown, Avatar | User menu |

### Navigation Components

| Current Component | HeroUI Implementation | Required HeroUI Parts | Notes |
|-------------------|------------------------|----------------------|-------|
| `app-sidebar.jsx` | `components/dashboard/sidebar.tsx` | Custom sidebar with NavItems | Main navigation |
| `nav-main.jsx` | Part of sidebar | Link components | Main nav links |
| `nav-projects.jsx` | Part of sidebar | Link components | Program links |
| `nav-user.jsx` | Part of sidebar | Avatar, Text, Dropdown | User profile section |

## Prop Mapping Examples

### Button Component

**shadcn/ui Button:**
```jsx
<Button 
  variant="default" 
  size="default" 
  onClick={handleClick} 
  disabled={isDisabled}
>
  Click Me
</Button>
```

**HeroUI Button:**
```jsx
<Button 
  color="primary" 
  size="md" 
  onPress={handleClick} 
  isDisabled={isDisabled}
>
  Click Me
</Button>
```

### Card Component

**shadcn/ui Card:**
```jsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content goes here</CardContent>
  <CardFooter>Footer content</CardFooter>
</Card>
```

**HeroUI Card:**
```jsx
<Card>
  <CardHeader>
    <div className="flex flex-col">
      <h3 className="text-lg font-semibold">Title</h3>
      <p className="text-sm text-default-500">Description</p>
    </div>
  </CardHeader>
  <CardBody>Content goes here</CardBody>
  <CardFooter>Footer content</CardFooter>
</Card>
```

### Tabs Component

**shadcn/ui Tabs:**
```jsx
<Tabs defaultValue="tab1" onValueChange={handleTabChange}>
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

**HeroUI Tabs:**
```jsx
<Tabs 
  aria-label="Tabs"
  selectedKey={selected}
  onSelectionChange={setSelected}
>
  <Tab key="tab1" title="Tab 1">
    Content 1
  </Tab>
  <Tab key="tab2" title="Tab 2">
    Content 2
  </Tab>
</Tabs>
```

### Dialog/Modal Component

**shadcn/ui Dialog:**
```jsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description here.</DialogDescription>
    </DialogHeader>
    <div>Dialog content</div>
    <DialogFooter>
      <Button onClick={handleClose}>Close</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**HeroUI Modal:**
```jsx
<Modal isOpen={isOpen} onOpenChange={setIsOpen}>
  <ModalContent>
    {(onClose) => (
      <>
        <ModalHeader>
          <h2>Dialog Title</h2>
          <p className="text-sm text-default-500">Dialog description here.</p>
        </ModalHeader>
        <ModalBody>
          <div>Dialog content</div>
        </ModalBody>
        <ModalFooter>
          <Button onPress={onClose}>Close</Button>
        </ModalFooter>
      </>
    )}
  </ModalContent>
</Modal>
```

## Event Handler Differences

| shadcn/ui Event | HeroUI Event | Notes |
|-----------------|--------------|-------|
| `onClick` | `onPress` | Used in buttons, menu items |
| `onValueChange` | `onSelectionChange` | Used in tabs, selects |
| `onChange` | `onValueChange` | Used in inputs, checkboxes |
| `onOpenChange` | `onOpenChange` | Similar in modals/dialogs |

## Style Migration

When migrating styles, follow these patterns:

### Text Styles

| shadcn/ui Class | HeroUI Equivalent | Notes |
|-----------------|-------------------|-------|
| `text-muted-foreground` | `text-default-500` | For secondary text |
| `font-medium` | `font-medium` | Same |
| `text-sm` | `text-sm` | Same |
| `text-destructive` | `text-danger` | For error text |

### Background Colors

| shadcn/ui Class | HeroUI Equivalent | Notes |
|-----------------|-------------------|-------|
| `bg-primary` | `bg-primary` | Same concept |
| `bg-muted` | `bg-default-100` | For subtle backgrounds |
| `bg-destructive` | `bg-danger` | For error backgrounds |
| `hover:bg-accent` | `hover:bg-default-200` | For hover states |

### Border Styles

| shadcn/ui Class | HeroUI Equivalent | Notes |
|-----------------|-------------------|-------|
| `border` | `border` | Same |
| `border-input` | `border-default` | Default border |
| `border-destructive` | `border-danger` | Error borders |
| `rounded-md` | `rounded-md` | Same |

This document will be updated throughout the migration process as we encounter new components and challenges.

---

## Class Name Mapping Cheatsheet

Quick reference for common class name conversions:

```
text-muted-foreground → text-default-500
bg-muted → bg-default-100
bg-accent → bg-default-200
border-input → border-default
text-destructive → text-danger
bg-destructive → bg-danger
border-destructive → border-danger
```