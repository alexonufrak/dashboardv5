"use client"

import React from 'react'
import { BountyList } from '@/components/program/common'

export function BountiesTab({ programId }) {
  return (
    <div className="space-y-4 w-full">
      <BountyList programId={programId} />
    </div>
  )
}