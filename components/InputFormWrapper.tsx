'use client';

/**
 * InputFormWrapper - Responsive switcher between desktop and mobile forms
 * 
 * Breakpoint: lg (1024px)
 * - Desktop (≥1024px): uses InputForm (original)
 * - Mobile (<1024px): uses InputFormMobile (optimized)
 * 
 * This component is a pure UI switch with no logic.
 * All props are passed through to both child components.
 */

import React from 'react';
import InputForm from '@/components/InputForm';
import InputFormMobile from '@/components/InputFormMobile';
import type { InputFormProps } from '@/components/InputFormMobile';

const InputFormWrapper: React.FC<InputFormProps> = (props) => {
  return (
    <>
      {/* Desktop version: ≥1024px (lg+) */}
      <div className="hidden lg:block">
        <InputForm {...props} />
      </div>
      
      {/* Mobile version: <1024px */}
      <div className="block lg:hidden">
        <InputFormMobile {...props} />
      </div>
    </>
  );
};

export default InputFormWrapper;
