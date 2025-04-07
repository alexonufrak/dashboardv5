"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * ProfileDialogButton Component
 * Button to open profile dialog
 */
export function ProfileDialogButton({ userId }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex justify-end mt-6">
      <button
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1"
        onClick={() => setIsOpen(true)}
      >
        Edit Profile
      </button>
      
      {/* For now, just a placeholder dialog that will be implemented later */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <h2 className="text-lg font-semibold">Edit Profile</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Profile editing is not fully implemented yet in the App Router.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded-md bg-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </button>
              <Link 
                href="/dashboard/profile" 
                className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
              >
                Use Pages Router Version
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}