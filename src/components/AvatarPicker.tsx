import React, { useState } from 'react';
import { X } from 'lucide-react';
import { AvatarDef } from '../avatarGenerator';

interface AvatarPickerProps {
  avatars: AvatarDef[];
  currentUri: string;
  onSelect: (uri: string) => void;
  onClose: () => void;
}

export default function AvatarPicker({ avatars, currentUri, onSelect, onClose }: AvatarPickerProps) {
  const [selected, setSelected] = useState(currentUri);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-brand-surface border border-brand-outline rounded-3xl p-6 max-w-2xl w-full shadow-2xl">
        <div className="flex items-center justify-between mb-4 border-b border-brand-outline pb-3">
          <h3 className="font-display font-black text-white uppercase tracking-wider text-sm">
            Choose Your Pixel Avatar
          </h3>
          <button
            onClick={onClose}
            className="bg-brand-surface-high p-1.5 rounded-full text-on-surface-variant hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-5 gap-3 max-h-96 overflow-y-auto p-1">
          {avatars.map((av) => {
            const isSelected = selected === av.dataUri;
            return (
              <button
                key={av.id}
                onClick={() => setSelected(av.dataUri)}
                className={`
                  flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all cursor-pointer bg-brand-surface-lowest
                  ${isSelected
                    ? 'border-brand-primary shadow-lg shadow-brand-primary/20 scale-105'
                    : 'border-transparent hover:border-brand-outline'}
                `}
              >
                <img
                  src={av.dataUri}
                  alt={av.name}
                  className="w-16 h-16 rounded-lg"
                />
                <span className="text-[9px] text-on-surface-variant font-mono text-center leading-tight">
                  {av.name}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-brand-outline">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-white bg-transparent border border-brand-outline rounded-xl cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSelect(selected)}
            className="px-6 py-2 text-xs font-bold uppercase tracking-wider text-black bg-brand-primary rounded-xl cursor-pointer transition-colors hover:opacity-90"
          >
            Select Avatar
          </button>
        </div>
      </div>
    </div>
  );
}
