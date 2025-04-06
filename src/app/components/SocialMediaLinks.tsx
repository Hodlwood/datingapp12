"use client";

import { useState } from 'react';
import {
  GlobeAltIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';

interface SocialLink {
  platform: string;
  url: string;
}

interface SocialMediaLinksProps {
  links: SocialLink[];
  onUpdate: (links: SocialLink[]) => Promise<void>;
}

const PLATFORMS = [
  'LinkedIn',
  'Twitter',
  'GitHub',
  'Instagram',
  'Personal Website',
  'Other'
];

export default function SocialMediaLinks({ links, onUpdate }: SocialMediaLinksProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLinks, setEditedLinks] = useState<SocialLink[]>(links);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddLink = () => {
    setEditedLinks([...editedLinks, { platform: PLATFORMS[0], url: '' }]);
  };

  const handleRemoveLink = (index: number) => {
    setEditedLinks(editedLinks.filter((_, i) => i !== index));
  };

  const handleLinkChange = (index: number, field: keyof SocialLink, value: string) => {
    const newLinks = [...editedLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setEditedLinks(newLinks);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onUpdate(editedLinks);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving social links:', error);
      alert('Failed to save social links. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const validateUrl = (url: string): string => {
    if (!url) return url;
    try {
      const urlObj = new URL(url);
      return urlObj.toString();
    } catch {
      return `https://${url}`;
    }
  };

  if (!isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Social Links</h3>
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            Edit Links
          </button>
        </div>
        {editedLinks.length > 0 ? (
          <div className="space-y-2">
            {editedLinks.map((link, index) => (
              <a
                key={index}
                href={validateUrl(link.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-500"
              >
                <GlobeAltIcon className="w-5 h-5" />
                <span>{link.platform}</span>
                <LinkIcon className="w-4 h-4" />
              </a>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No social links added yet</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Edit Social Links</h3>
        <div className="space-x-2">
          <button
            onClick={() => setIsEditing(false)}
            className="text-gray-500 hover:text-gray-600 text-sm"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {editedLinks.map((link, index) => (
          <div key={index} className="flex items-center space-x-2">
            <select
              value={link.platform}
              onChange={(e) => handleLinkChange(index, 'platform', e.target.value)}
              className="p-2 border rounded-lg text-sm"
            >
              {PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={link.url}
              onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
              placeholder="Enter URL"
              className="flex-1 p-2 border rounded-lg text-sm"
            />
            <button
              onClick={() => handleRemoveLink(index)}
              className="text-red-500 hover:text-red-600 p-2"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleAddLink}
        className="text-blue-500 hover:text-blue-600 text-sm"
      >
        + Add Link
      </button>
    </div>
  );
} 