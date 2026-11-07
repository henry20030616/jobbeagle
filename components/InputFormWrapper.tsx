'use client';

/**
 * InputFormWrapper — desktop vs mobile form switch.
 *
 * Desktop requires BOTH min-width 1024px AND min-height 700px
 * (`DESKTOP_LAYOUT_MEDIA` in constants/desktop-layout.ts). Phone landscape
 * often has width ≥1024 with a short height; keeping the mobile form there
 * prevents the 4-col desktop layout from "breaking" after rotate.
 *
 * Visibility is CSS-driven (`.jb-desktop-only` / `.jb-mobile-only` in globals.css).
 */

import React from 'react';
import InputForm from '@/components/InputForm';
import InputFormMobile from '@/components/InputFormMobile';
import type { InputFormProps } from '@/components/InputFormMobile';

const InputFormWrapper: React.FC<InputFormProps> = (props) => {
  return (
    <>
      <div className="jb-desktop-only min-h-0 flex-1 flex-col">
        <InputForm {...props} />
      </div>
      <div className="jb-mobile-only">
        <InputFormMobile {...props} />
      </div>
    </>
  );
};

export default InputFormWrapper;
