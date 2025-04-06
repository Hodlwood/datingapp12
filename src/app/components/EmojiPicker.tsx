"use client";

import { useState, useRef, useEffect } from 'react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  position?: { top?: number; bottom?: number; left?: number; right?: number };
}

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '👏'];

export default function EmojiPicker({ onSelect, onClose, position }: EmojiPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={pickerRef}
      className="absolute bg-white rounded-lg shadow-lg p-2 z-50"
      style={{
        ...position,
        width: 'fit-content'
      }}
    >
      <div className="grid grid-cols-4 gap-2">
        {COMMON_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            className="hover:bg-gray-100 rounded p-1 text-xl transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
} 